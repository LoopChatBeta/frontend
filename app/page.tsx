"use client";

import { useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotReadable } from "@copilotkit/react-core";

export default function Home() {
  const [url, setUrl] = useState("https://www.mayoclinic.org");
  const [status, setStatus] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [clinicLoaded, setClinicLoaded] = useState(false);

  const [clinicContext, setClinicContext] = useState("");

  useCopilotReadable({
    description: "Clinic website knowledge base — use this to answer patient questions accurately",
    value: clinicContext || "No clinic website has been loaded yet.",
  });

  const handleIngest = async () => {
    if (!url) return;
    setIsIngesting(true);
    setStatus("Crawling website...");

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus(`✅ Loaded ${data.chunks} chunks from the site`);
        setClinicLoaded(true);
        // Fetch initial context to prime the readable
        const searchRes = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "clinic services insurance appointment" }),
        });
        const searchData = await searchRes.json();
        setClinicContext(searchData.context || "");
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch {
      setStatus("❌ Failed to ingest URL");
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-2">LoopChat</h1>
      <p className="text-gray-500 mb-8">
        AI-powered patient engagement for healthcare clinics
      </p>

      {/* URL Ingestion */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourclinic.com"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleIngest}
            disabled={isIngesting || !url}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
          >
            {isIngesting ? "Loading..." : "Load Site"}
          </button>
        </div>
        {status && (
          <p className="text-sm mt-2 text-gray-600">{status}</p>
        )}
      </div>

      <CopilotSidebar
        defaultOpen={true}
        instructions={`You are LoopChat, an AI assistant for healthcare clinic patients. 
        ${clinicLoaded ? `You have been loaded with information from ${url}. Use this knowledge to answer patient questions accurately.` : "No clinic website has been loaded yet. Ask the clinic to load their website first."}
        Be empathetic, clear, and professional.`}
        labels={{
          title: "LoopChat Patient Assistant",
          initial: clinicLoaded
            ? `Hi! I'm ready to answer questions about this clinic. How can I help you?`
            : "Hi! I'm your LoopChat assistant. How can I help you today?",
        }}
      />
    </main>
  );
}