"use client";

import { useState } from "react";
import ChatWidget from "../components/ChatWidget";
import IntakeForm, { IntakeData } from "../components/IntakeForm";

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [clinicLoaded, setClinicLoaded] = useState(false);
  const [clinicContext, setClinicContext] = useState("");
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

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
        setClinicContext(data.context || "");
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch {
      setStatus("❌ Failed to ingest URL");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIntakeSubmit = async (data: IntakeData) => {
    console.log("Intake submitted:", data);
    // Step 3 — save to NeonDB goes here
    setShowIntakeForm(false);
    setLeadSaved(true);
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
        {leadSaved && (
          <p className="text-sm mt-2 text-green-600">
            ✅ Your information has been saved. We'll follow up shortly!
          </p>
        )}
      </div>

      {/* Intake Form Modal */}
      {showIntakeForm && (
        <IntakeForm
          onSubmit={handleIntakeSubmit}
          onClose={() => setShowIntakeForm(false)}
        />
      )}

      {/* Chat Widget */}
      <ChatWidget
        clinicContext={clinicContext}
        clinicUrl={clinicLoaded ? url : undefined}
        onShowIntakeForm={() => setShowIntakeForm(true)}
      />
    </main>
  );
}