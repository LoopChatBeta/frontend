import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { leads } from "../../../lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, email, phone, reason, insurance, clinicUrl, transcript } = body;

    // Input validation — OWASP A03
    if (!name?.trim() || !email?.trim() || !reason?.trim()) {
      return NextResponse.json(
        { error: "Name, email and reason are required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const newLead = await db
      .insert(leads)
      .values({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() ?? null,
        reason: reason.trim(),
        insurance: insurance?.trim() ?? null,
        clinicUrl: clinicUrl?.trim() ?? null,
        transcript: transcript?.trim() ?? null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      lead: newLead[0],
    });

  } catch (error) {
    console.error("Lead save error:", error);
    return NextResponse.json(
      { error: "Failed to save lead" },
      { status: 500 }
    );
  }
}