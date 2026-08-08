// app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSandboxService } from "../../../backend/services/getSandboxService";
import { getTraceId, logTrace } from "@/backend/utils/trace";
import { Resend } from "resend";

const sandboxService = getSandboxService();
const resend = new Resend(process.env.RESEND_API_KEY!);

interface InsuranceWebhookRequest {
  sandboxId?: string;
  requestId?: string;
  patientId?: string;
  status?: "APPROVED" | "DENIED";
  authorizationNumber?: string;
}

export async function POST(req: NextRequest) {
  const traceId = getTraceId(req);

  try {
    const body: InsuranceWebhookRequest = await req.json();

    if (!body.sandboxId) {
      return NextResponse.json(
        { success: false, error: "sandboxId is required." },
        { status: 400 }
      );
    }

    const approved = body.status !== "DENIED";

    // Step 1 — resume sandbox from hibernation
    logTrace(traceId, `Webhook received — resuming sandbox: ${body.sandboxId}`);
    const state = await sandboxService.resume(body.sandboxId);
    logTrace(traceId, "Sandbox resumed — checkpoint restored", state.checkpoint);

    // Step 2 — generate appointment confirmation
    const appointment = approved
      ? {
          doctor: "Dr. Chen",
          date: state.checkpoint.appointmentDate ?? "2026-08-12",
          time: "10:00 AM",
          authorizationNumber: body.authorizationNumber ?? "AUTH-123456",
        }
      : null;

    // Step 3 — send confirmation email if approved
    if (approved && body.patientId) {
      logTrace(traceId, "Sending confirmation email...");
      await resend.emails.send({
        from: "LoopChat <onboarding@resend.dev>",
        to: body.patientId,
        subject: "Your appointment is confirmed!",
        text: `Great news! Your prior authorization has been approved.

Your appointment with Dr. Chen is confirmed for ${appointment?.date} at ${appointment?.time}.

Authorization Number: ${appointment?.authorizationNumber}

Please bring your insurance card and a valid photo ID.

Warm regards,
The LoopChat Team`,
      });
      logTrace(traceId, "Confirmation email sent");
    }

    // Step 4 — destroy sandbox
    await sandboxService.destroy(body.sandboxId);
    logTrace(traceId, `Sandbox destroyed: ${body.sandboxId}`);

    return NextResponse.json({
      success: true,
      sandboxId: body.sandboxId,
      requestId: body.requestId ?? null,
      workflowStatus: approved ? "RESUMED" : "FAILED",
      insuranceStatus: approved ? "APPROVED" : "DENIED",
      authorizationNumber: body.authorizationNumber ?? "AUTH-123456",
      appointment,
      emailQueued: approved,
      message: approved
        ? "Sandbox resumed. Appointment confirmed."
        : "Insurance request denied.",
      mock: false,
    }, {
      headers: {
        "x-sls-trace-id": traceId,
      },
    });

  } catch (err) {
    console.error(`[TraceID: ${traceId}] [Webhook] Error:`, err);
    return NextResponse.json(
      { success: false, error: "Invalid webhook payload." },
      { status: 500 }
    );
  }
}