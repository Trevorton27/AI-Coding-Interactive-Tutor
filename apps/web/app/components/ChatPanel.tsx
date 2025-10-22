// apps/web/app/components/ChatPanel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { isTutorResponse, runActions, type UIMessage } from "@aict/services/src/orchestrator";
import type { HostCapabilities } from "@aict/services/src/orchestrator";

type ChatMessage = UIMessage & { id: string };

interface ChatPanelProps {
  host: HostCapabilities;
  contextBuilder: () => any;
  onTestResult?: (result: any) => void;
}

export function ChatPanel({ host, contextBuilder, onTestResult }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const appendMessage = (msg: UIMessage) => {
    setMessages(prev => [...prev, { ...msg, id: crypto.randomUUID() }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    appendMessage({ type: "user", text: userText });
    setIsLoading(true);

    try {
      // 1) Build context for model
      const context = contextBuilder();

      // 2) Call tutor API
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText, context })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const modelJson = await res.json();

      // 3) Validate response shape
      if (!isTutorResponse(modelJson)) {
        appendMessage({
          type: "assistant",
          text: "I didn't understand that response format. Let's try again with a simpler question."
        });
        return;
      }

      // 4) Display UI messages
      for (const msg of modelJson.ui_messages || []) {
        appendMessage(msg);
      }

      // 5) Execute actions (write files, run tests, etc.)
      const outputs = await runActions(modelJson, host);

      // 6) If tests ran, notify parent
      if (outputs.test_result && onTestResult) {
        onTestResult(outputs.test_result);
      }

      // 7) Show hint indicator if present
      if (modelJson.hint) {
        const hintEmoji = { 1: "🟡", 2: "🟠", 3: "🔴" }[modelJson.hint.level] || "💡";
        appendMessage({
          type: "system",
          text: `${hintEmoji} Hint level ${modelJson.hint.level} provided`
        });
      }

    } catch (error) {
      console.error("Chat error:", error);
      appendMessage({
        type: "system",
        text: "Something went wrong. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.type === "user"
                  ? "bg-blue-600 text-white"
                  : msg.type === "system"
                  ? "bg-gray-200 text-gray-700 text-sm italic"
                  : "bg-white text-gray-900 shadow-sm border border-gray-200"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-300 p-4 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for help or describe what you want to do..."
            disabled={isLoading}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}