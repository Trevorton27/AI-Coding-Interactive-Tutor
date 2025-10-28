"use client";

import { useState } from "react";

interface AITutorHelperProps {
  onAskForHint: (level: 1 | 2 | 3) => void;
  onAskQuestion: (question: string) => void;
}

export function AITutorHelper({ onAskForHint: _, onAskQuestion: __ }: AITutorHelperProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const quickQuestions = [
    "I'm stuck, can you give me a hint?",
    "I need more help with this",
    "Show me a more direct hint",
    "Can you explain the key concept?",
    "What am I doing wrong?",
  ];

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🤖</span>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm mb-0.5">AI Tutor</h4>
          <p className="text-xs text-gray-600">
            Copy these questions to the chat above →
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {quickQuestions.map((q, index) => (
          <button
            key={index}
            onClick={() => handleCopy(q, index)}
            className="w-full text-left px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-between group"
          >
            <span className="flex-1">{q}</span>
            <span className="text-gray-400 group-hover:text-blue-500 text-xs">
              {copiedIndex === index ? "✓ Copied!" : "📋"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t border-blue-200">
        <p className="text-xs text-gray-500">
          💡 Start with simple hints, ask for more help if needed!
        </p>
      </div>
    </div>
  );
}
