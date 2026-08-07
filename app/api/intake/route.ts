// app/api/intake/route.ts

import { NextRequest, NextResponse } from "next/server";

interface IntakeRequest {
  patientId?: string;
  firstName?: string;
  lastName?: string;
  insurance?: string;
  complaint?: string;
  email?: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: IntakeRequest = await req.json();

    // Minimal validation
    if (!body.complaint) {
      return NextResponse.json(
        {
          success: false,
          error: "Complaint is required."
        },
        { status: 400 }
      );
    }

    // TODO:
    // Replace this with IntakeService.save()
    // Persist to Postgres later.

    const intakeId = `INT-${Date.now()}`;

    return NextResponse.json({
      success: true,
      message: "Patient intake received.",
      intakeId,

      patient: {
        patientId: body.patientId ?? null,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        insurance: body.insurance ?? "Unknown",
        complaint: body.complaint,
        email: body.email ?? null,
        phone: body.phone ?? null
      },

      nextStep: "eligibility",

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
