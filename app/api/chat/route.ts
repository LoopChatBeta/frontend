import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const dashscope = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY!,
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
});

const conversations = new Map<string, any[]>();

export async function POST(req: NextRequest) {
  try {
    const { conversation_id, message, clinicContext } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!conversations.has(conversation_id)) {
      conversations.set(conversation_id, [
        {
          role: "system",
          content: `You are LoopChat, an AI assistant for healthcare clinic patients.
${clinicContext
  ? `Use the following clinic information to answer questions accurately:\n\n${clinicContext}`
  : "No clinic website has been loaded yet."
}
Be empathetic, clear, and professional.
When a patient wants to book an appointment, request a callback, or be contacted, respond naturally and include the exact text SHOW_INTAKE_FORM in your response.`,
        },
      ]);
    }

    const history = conversations.get(conversation_id)!;
    history.push({ role: "user", content: message });

    const response = await dashscope.chat.completions.create({
      model: "qwen-plus",
      messages: history,
      stream: false,
    });

    const reply =
      response.choices[0]?.message?.content ??
      "I'm sorry, I couldn't generate a response.";

    history.push({ role: "assistant", content: reply });

    const showIntake = reply.includes("SHOW_INTAKE_FORM");
    const cleanReply = reply.replace("SHOW_INTAKE_FORM", "").trim();

    return NextResponse.json({
      reply: cleanReply,
      showIntakeForm: showIntake,
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Chat failed" },
      { status: 500 }
    );
  }
}