import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { OpenAI } from "openai";

const resend = new Resend(process.env.RESEND_API_KEY!);

const dashscope = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY!,
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
});

export async function POST(req: NextRequest) {
  try {
    const { name, email, reason, insurance, clinicUrl } = await req.json();

    // Input validation — OWASP A03
    if (!name?.trim() || !email?.trim() || !reason?.trim()) {
      return NextResponse.json(
        { error: "Name, email and reason are required" },
        { status: 400 }
      );
    }

    // Generate personalized email body using Qwen
    const completion = await dashscope.chat.completions.create({
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content: "You are a helpful healthcare clinic assistant. Write warm, professional, concise follow-up emails to patients. Do not include a subject line. Just the email body.",
        },
        {
          role: "user",
          content: `Write a personalized follow-up email to a patient with these details:
          - Name: ${name}
          - Reason for visit: ${reason}
          - Insurance: ${insurance || "not provided"}
          - Clinic website: ${clinicUrl || "our clinic"}
          
          The email should:
          1. Thank them for their interest
          2. Reference their specific reason for visit
          3. Let them know we will be in touch to confirm their appointment
          4. Be warm and professional
          5. Be 3-4 short paragraphs`,
        },
      ],
      stream: false,
    });

    const emailBody =
      completion.choices[0]?.message?.content ??
      `Dear ${name}, thank you for reaching out. We have received your inquiry about ${reason} and will be in touch shortly.`;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "LoopChat <onboarding@resend.dev>",
      to: email,
      subject: `Thank you for contacting us, ${name}`,
      text: emailBody,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: "Follow-up email sent successfully",
    });

  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}