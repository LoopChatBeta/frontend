// app/api/insurance/request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSandboxService } from "../../../../backend/services/getSandboxService";

const sandboxService = getSandboxService();

interface InsuranceRequest {
  intakeId?: string;
  patientId?: string;
  insurance?: string;
  provider?: string;
  doctorId?: string;
  appointmentDate?: string;
  procedureCode?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: InsuranceRequest = await req.json();

    if (!body.patientId) {
      return NextResponse.json(
        { success: false, error: "patientId is required." },
        { status: 400 }
      );
    }

    // Step 1 — create sandbox
    console.log(`[Insurance] Creating sandbox for patient: ${body.patientId}`);
    const state = await sandboxService.create(body.patientId);

    // Step 2 — save checkpoint with all workflow context
    const checkpoint = {
      patientId: body.patientId,
      intakeId: body.intakeId ?? null,
      insurance: body.insurance ?? null,
      provider: body.provider ?? null,
      doctorId: body.doctorId ?? null,
      appointmentDate: body.appointmentDate ?? null,
      procedureCode: body.procedureCode ?? null,
      submittedAt: new Date().toISOString(),
    };

    // Step 3 — hibernate sandbox while waiting for insurance
    console.log(`[Insurance] Hibernating sandbox: ${state.sandboxId}`);
    await sandboxService.pause(state.sandboxId, checkpoint);

    return NextResponse.json({
      success: true,
      status: "HIBERNATING",
      sandboxId: state.sandboxId,
      requestId: `pa-${Date.now()}`,
      message: "Prior authorization submitted. Waiting for insurance approval.",
      estimatedWait: "30 seconds (demo)",
      nextStep: "webhook",
      mock: false,
    });

  } catch (err) {
    console.error("[Insurance] Error:", err);
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 500 }
    );
  }
}