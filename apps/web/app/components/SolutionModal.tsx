// apps/web/app/components/SolutionModal.tsx
"use client";

import { useState } from 'react';

interface SolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  solution: Record<string, string>;
  onReveal: () => void;
}

export function SolutionModal({ isOpen, onClose, solution, onReveal }: SolutionModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  if (!isOpen) return null;

  const handleReveal = () => {
    setRevealed(true);
    onReveal();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {revealed ? '🎓 Solution' : '⚠️ Reveal Solution?'}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!revealed ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Seeing the full solution may reduce your learning effectiveness. 
                  Studies show that struggling with problems leads to better long-term retention.
                </p>
              </div>

              <p className="text-gray-700">
                Before revealing the solution, consider:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
                <li>Have you tried asking for a hint?</li>
                <li>Have you read the error messages carefully?</li>
                <li>Have you tested different approaches?</li>
                <li>Would a smaller example help you understand?</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Try asking the AI tutor for a "level 3 hint" first. 
                  It will show you code patterns without giving away the complete solution.
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  I understand that viewing the solution may impact my learning, 
                  and I still want to see it.
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700 mb-4">
                Here's the complete solution. Try to understand <em>why</em> each part works:
              </p>

              {Object.entries(solution).map(([filename, code]) => (
                <div key={filename} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{filename}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{code}</code>
                  </pre>
                </div>
              ))}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-green-800">
                  <strong>Next steps:</strong> Try recreating this solution from memory, 
                  or modify it to add new features. Teaching yourself is the best way to learn!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {revealed ? 'Close' : 'Cancel'}
          </button>
          {!revealed && (
            <button
              onClick={handleReveal}
              disabled={!confirmed}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Reveal Solution
            </button>
          )}
        </div>
      </div>
    </div>
  );
}