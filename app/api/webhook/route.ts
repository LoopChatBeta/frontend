// app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";

interface InsuranceWebhookRequest {
  sandboxId?: string;
  requestId?: string;
  patientId?: string;
  status?: "APPROVED" | "DENIED";
  authorizationNumber?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: InsuranceWebhookRequest = await req.json();

    if (!body.sandboxId) {
      return NextResponse.json(
        {
          success: false,
          error: "sandboxId is required."
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // TODO (Alibaba FC Sandbox)
    //
    // const sandbox = await sandboxService.resume(body.sandboxId);
    //
    // Continue workflow:
    //   - Restore checkpoint
    //   - Generate booking confirmation
    //   - Send confirmation email
    // ------------------------------------------------------------------

    const approved = body.status !== "DENIED";

    return NextResponse.json({
      success: true,

      sandboxId: body.sandboxId,

      requestId: body.requestId ?? null,

      workflowStatus: approved ? "RESUMED" : "FAILED",

      insuranceStatus: approved ? "APPROVED" : "DENIED",

      authorizationNumber:
        body.authorizationNumber ?? "AUTH-123456",

      appointment: approved
        ? {
            doctor: "Dr. Chen",
            date: "2026-08-12",
            time: "10:00 AM"
          }
        : null,

      emailQueued: approved,

      message: approved
        ? "Sandbox resumed successfully. Appointment confirmed."
        : "Insurance request denied.",

      mock: true
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid webhook payload."
      },
      { status: 500 }
    );
  }
}
