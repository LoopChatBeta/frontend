// app/api/insurance/request/route.ts

import { NextRequest, NextResponse } from "next/server";

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

    // Minimal validation
    if (!body.patientId) {
      return NextResponse.json(
        {
          success: false,
          error: "patientId is required."
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // TODO (Hackathon Day 3)
    //
    // Replace this mock implementation with:
    //
    // const sandbox = await sandboxService.create();
    // await sandbox.pause();
    //
    // Return the real sandboxId.
    // ------------------------------------------------------------------

    const sandboxId = `sandbox-${Date.now()}`;
    const requestId = `pa-${Date.now()}`;

    return NextResponse.json({
      success: true,

      status: "HIBERNATING",

      requestId,

      sandboxId,

      message:
        "Prior authorization submitted. Waiting for insurance approval.",

      estimatedWait: "30 seconds (demo)",

      nextStep: "webhook",

      mock: true
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request."
      },
      { status: 500 }
    );
  }
}
