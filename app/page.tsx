"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">LoopChat</h1>
      <p className="text-gray-500 mb-8">
        AI-powered patient engagement for healthcare clinics
      </p>
      <CopilotSidebar
        defaultOpen={true}
        instructions="You are LoopChat, an AI assistant for healthcare clinic patients. 
        Help patients with questions about services, insurance coverage, appointment 
        booking, and general clinic information. Be empathetic, clear, and professional."
        labels={{
          title: "LoopChat Patient Assistant",
          initial: "Hi! I'm your LoopChat assistant. How can I help you today?",
        }}
      />
    </main>
  );
}