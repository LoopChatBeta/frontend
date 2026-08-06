'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatWidgetProps {
  clinicContext?: string;
  clinicUrl?: string;
  onShowIntakeForm?: () => void;
}

export default function ChatWidget({
  clinicContext,
  clinicUrl,
  onShowIntakeForm,
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef(crypto.randomUUID());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // Add user message immediately
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

      // Trigger intake form if AI detected booking intent
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <input
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