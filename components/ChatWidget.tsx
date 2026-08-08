'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatWidgetProps {
  clinicContext?: string;
  clinicUrl?: string;
  onShowIntakeForm?: () => void;
  intakeData?: {
    name: string;
    email: string;
    phone: string;
    reason: string;
    insurance: string;
  } | null;
}

type SandboxStatus = 'idle' | 'submitting' | 'hibernating' | 'resumed' | 'denied';

export default function ChatWidget({
  clinicContext,
  clinicUrl,
  onShowIntakeForm,
  intakeData,
}: ChatWidgetProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: clinicUrl
        ? `Hi! I'm ready to answer questions about this clinic. How can I help you?`
        : 'Welcome! Please load a clinic website above to get started.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus>('idle');
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<{
    doctor: string;
    date: string;
    time: string;
    authorizationNumber: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef(crypto.randomUUID());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sandboxStatus]);

  const quickReplies = [
    'Schedule Appointment',
    'Insurance Accepted',
    'Office Hours',
    'Location',
  ];

  async function sendMessage(overrideMessage?: string) {
    const text =
      typeof overrideMessage === 'string' ? overrideMessage : message;

    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationIdRef.current,
          message: text,
          clinicContext: clinicContext ?? '',
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply ?? 'Sorry, I could not generate a response.',
        },
      ]);

      if (data.showIntakeForm && onShowIntakeForm) {
        onShowIntakeForm();
      }

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitInsuranceRequest() {
    if (!intakeData) return;
    setSandboxStatus('submitting');

    try {
      const response = await fetch('/api/insurance/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: intakeData.email,
          insurance: intakeData.insurance,
          doctorId: 'DR-402',
          appointmentDate: '2026-08-12',
          procedureCode: '99203',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSandboxId(data.sandboxId);
        setSandboxStatus('hibernating');

        // Simulate webhook after 5 seconds for demo
        setTimeout(() => simulateWebhook(data.sandboxId, data.requestId), 5000);
      }
    } catch {
      setSandboxStatus('idle');
    }
  }

  async function simulateWebhook(sbxId: string, requestId: string) {
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId: sbxId,
          requestId,
          patientId: intakeData?.email,
          status: 'APPROVED',
          authorizationNumber: 'AUTH-789012',
        }),
      });

      const data = await response.json();

      if (data.success && data.appointment) {
        setAppointment(data.appointment);
        setSandboxStatus('resumed');
      } else {
        setSandboxStatus('denied');
      }
    } catch {
      setSandboxStatus('idle');
    }
  }

  return (
    <div className="w-[400px] h-[600px] border rounded-xl shadow-lg flex flex-col bg-white">

      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-xl">
        <h2 className="font-semibold">LoopChat</h2>
        <p className="text-sm opacity-90">Virtual Clinic Assistant</p>
      </div>

      {/* Quick Replies */}
      <div className="p-3 flex flex-wrap gap-2 border-b">
        {quickReplies.map((text) => (
          <button
            key={text}
            aria-label={`Quick reply: ${text}`}
            onClick={() => sendMessage(text)}
            className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100"
          >
            {text}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-black'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm text-gray-500">
              Typing...
            </div>
          </div>
        )}

        {/* Insurance request button — shows after intake submitted */}
        {intakeData && sandboxStatus === 'idle' && (
          <div className="flex justify-start">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 max-w-[85%]">
              <p className="text-sm text-blue-800 mb-2">
                ✅ Intake received for <strong>{intakeData.name}</strong>. Ready to submit your insurance pre-authorization?
              </p>
              <button
                onClick={submitInsuranceRequest}
                aria-label="Submit insurance pre-authorization request"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 w-full"
              >
                Submit Insurance Request
              </button>
            </div>
          </div>
        )}

        {/* Submitting */}
        {sandboxStatus === 'submitting' && (
          <div className="flex justify-start">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 max-w-[85%]">
              <p className="text-sm text-yellow-800">
                ⏳ Submitting pre-authorization request...
              </p>
            </div>
          </div>
        )}

        {/* Hibernating — the key demo moment */}
        {sandboxStatus === 'hibernating' && (
          <div className="flex justify-start">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 max-w-[85%]">
              <p className="text-sm font-semibold text-orange-800 mb-1">
                ⏸ Sandbox Hibernating
              </p>
              <p className="text-xs text-orange-700 mb-2">
                Your pre-authorization request has been submitted to insurance. The AI agent is now in deep hibernation — compute billing paused to $0 while waiting for approval.
              </p>
              <p className="text-xs text-orange-600 font-mono">
                Sandbox ID: {sandboxId}
              </p>
              <div className="mt-2 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-1 bg-orange-400 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          </div>
        )}

        {/* Resumed — appointment confirmed */}
        {sandboxStatus === 'resumed' && appointment && (
          <div className="flex justify-start">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 max-w-[85%]">
              <p className="text-sm font-semibold text-green-800 mb-2">
                ✅ Insurance Approved — Sandbox Resumed
              </p>
              <div className="text-xs text-green-700 space-y-1">
                <p>👨‍⚕️ Doctor: <strong>{appointment.doctor}</strong></p>
                <p>📅 Date: <strong>{appointment.date}</strong></p>
                <p>🕐 Time: <strong>{appointment.time}</strong></p>
                <p>🔐 Auth #: <strong>{appointment.authorizationNumber}</strong></p>
              </div>
              <p className="text-xs text-green-600 mt-2">
                A confirmation email has been sent to {intakeData?.email}
              </p>
            </div>
          </div>
        )}

        {/* Denied */}
        {sandboxStatus === 'denied' && (
          <div className="flex justify-start">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 max-w-[85%]">
              <p className="text-sm font-semibold text-red-800 mb-1">
                ❌ Insurance Request Denied
              </p>
              <p className="text-xs text-red-700">
                Unfortunately your insurance request was denied. Please contact the clinic directly for alternative options.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <input
          aria-label="Type your message"
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          aria-label="Send message"
          onClick={() => sendMessage()}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 rounded-lg text-sm disabled:opacity-50 hover:bg-blue-700"
        >
          Send
        </button>
      </div>

    </div>
  );
}