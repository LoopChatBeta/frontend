// app/api/insurance/request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSandboxService } from "../../../../backend/services/getSandboxService";
import { getTraceId } from "@/backend/utils/trace";

const sandboxService = getSandboxService();

// Mock EligibilityService — replace with Don's implementation once pushed
function checkEligibility(patientId: string, insurance: string) {
  return {
    eligible: true,
    patientId,
    insurance,
    copay: 30,
    deductible: 250,
    deductibleMet: true,
    coverageType: "PPO",
    notes: `${insurance} covers specialist visits with $30 copay.`,
  };
}

// Mock CostEstimator — replace with Don's implementation once pushed
function calculateEstimate(cptCodes: string[]) {
  const cptMap: Record<string, { description: string; cost: number }> = {
    "99203": { description: "Office Visit — New Patient", cost: 30 },
    "73560": { description: "Knee X-Ray (2 views)", cost: 25 },
    "99213": { description: "Office Visit — Established Patient", cost: 20 },
    "93000": { description: "ECG with interpretation", cost: 15 },
  };

  const breakdown = cptCodes.map((code) => ({
    code,
    description: cptMap[code]?.description ?? "Medical Service",
    cost: cptMap[code]?.cost ?? 20,
  }));

  const total = breakdown.reduce((sum, item) => sum + item.cost, 0);
  return { total, breakdown };
}

interface InsuranceRequest {
  intakeId?: string;
  patientId?: string;
  insurance?: string;
  provider?: string;
  doctorId?: string;
  appointmentDate?: string;
  procedureCode?: string;
  cptCodes?: string[];
}

export async function POST(req: NextRequest) {
  const traceId = getTraceId(req);

  try {
    const body: InsuranceRequest = await req.json();

    // Input validation — OWASP A03
    if (!body.patientId) {
      return NextResponse.json(
        { success: false, error: "patientId is required." },
        { status: 400 }
      );
    }

    console.log(`[TraceID: ${traceId}] [Insurance] Starting for patient: ${body.patientId}`);

    // Step 1 — check eligibility
    const eligibility = checkEligibility(
      body.patientId,
      body.insurance ?? "Unknown"
    );

    if (!eligibility.eligible) {
      return NextResponse.json(
        { success: false, error: "Patient is not eligible for coverage.", eligibility },
        { status: 400 }
      );
    }

    console.log(`[TraceID: ${traceId}] [Insurance] Eligibility confirmed — Copay: $${eligibility.copay}`);

    // Step 2 — calculate cost estimate
    const cptCodes = body.cptCodes ?? ["99203", "73560"];
    const costEstimate = calculateEstimate(cptCodes);

    console.log(`[TraceID: ${traceId}] [Insurance] Cost estimate: $${costEstimate.total}`);

    // Step 3 — create sandbox
    console.log(`[TraceID: ${traceId}] [Insurance] Creating sandbox`);
    const state = await sandboxService.create(body.patientId, traceId);

    // Step 4 — save checkpoint with full workflow context
    const checkpoint = {
      patientId: body.patientId,
      intakeId: body.intakeId ?? null,
      insurance: body.insurance ?? null,
      provider: body.provider ?? null,
      doctorId: body.doctorId ?? null,
      appointmentDate: body.appointmentDate ?? null,
      procedureCode: body.procedureCode ?? null,
      eligibility,
      costEstimate,
      submittedAt: new Date().toISOString(),
    };

    // Step 5 — hibernate sandbox
    console.log(`[TraceID: ${traceId}] [Insurance] Hibernating sandbox: ${state.sandboxId}`);
    await sandboxService.pause(state.sandboxId, checkpoint);

    return NextResponse.json({
      success: true,
      status: "HIBERNATING",
      sandboxId: state.sandboxId,
      requestId: `pa-${Date.now()}`,
      eligibility,
      costEstimate,
      message: "Eligibility confirmed. Prior authorization submitted. Waiting for insurance approval.",
      estimatedWait: "30 seconds (demo)",
      nextStep: "webhook",
      mock: false,
    }, {
      headers: {
        "x-sls-trace-id": traceId,
      },
    });

  } catch (err) {
    console.error(`[TraceID: ${traceId}] [Insurance] Error:`, err);
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 500 }
    );
  }
}