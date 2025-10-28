"use client";

import { useState } from "react";

interface ChallengeDetailsProps {
  task: {
    title: string;
    description: string;
    detailedDescription?: string;
    realWorldContext?: string;
    tests: Array<{ id: string; code: string; label?: string }>;
    hints?: Array<{
      level: number;
      text: string;
    }>;
    solution?: Record<string, string>;
    alternativeSolutions?: Array<{
      label: string;
      files: Record<string, string>;
      explanation: string;
    }>;
  };
  onApplySolution?: (files: Record<string, string>) => void;
  attemptCount?: number;
  requiredAttempts?: number;
}

export function ChallengeDetails({
  task,
  onApplySolution,
  attemptCount = 0,
  requiredAttempts = 3
}: ChallengeDetailsProps) {
  const [activeTab, setActiveTab] = useState<"description" | "tests" | "hints" | "solutions" | "context">("description");
  const solutionsUnlocked = attemptCount >= requiredAttempts;

  // Calculate total solutions count (main solution + alternatives)
  const solutionsCount = (task.solution ? 1 : 0) + (task.alternativeSolutions?.length || 0);

  const tabs = [
    { id: "description" as const, label: "Description", icon: "📝" },
    { id: "tests" as const, label: "Tests", icon: "✓", count: task.tests.length },
    { id: "hints" as const, label: "Hints", icon: "💡", count: task.hints?.length || 0 },
    { id: "solutions" as const, label: "Solutions", icon: "🔑", count: solutionsCount },
    { id: "context" as const, label: "Real World", icon: "🌍" },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4 bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }
            `}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
            {'count' in tab && tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "description" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{task.title}</h3>
              {task.detailedDescription ? (
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {task.detailedDescription}
                </div>
              ) : (
                <p className="text-gray-700">{task.description}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "tests" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <span className="mr-2">ℹ️</span>
                About Tests
              </h4>
              <p className="text-sm text-blue-800">
                These are the criteria your code needs to meet. Tests run automatically when you click "Run Tests" or through the AI tutor.
                You can view them here but they cannot be edited.
              </p>
            </div>

            <div className="space-y-3">
              {task.tests.map((test, index) => (
                <div key={test.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 mb-2">
                        {test.label || `Test ${index + 1}`}
                      </h5>
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                        {test.code}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "hints" && (
          <div className="space-y-4">
            {!task.hints || task.hints.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">💡 No hints available</p>
                <p className="text-sm">Try solving the challenge! Ask the AI tutor if you need help.</p>
              </div>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    Progressive Hints
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Hints are organized by difficulty. Start with Level 1 and progress if you need more help.
                  </p>
                </div>

                <div className="space-y-3">
                  {task.hints.map((hint, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-3 border-b border-gray-200">
                        <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold">
                            {hint.level}
                          </span>
                          Level {hint.level}
                        </h5>
                      </div>
                      <div className="p-4 bg-white">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {hint.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "solutions" && (
          <div className="space-y-4">
            {!solutionsUnlocked ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">🔒 Solutions Locked</p>
                <p className="text-sm mb-4">
                  Complete {requiredAttempts - attemptCount} more attempt{requiredAttempts - attemptCount === 1 ? '' : 's'} to unlock solutions.
                </p>
                <div className="flex justify-center gap-2 mb-4">
                  {Array.from({ length: requiredAttempts }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                        i < attemptCount
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {i < attemptCount ? '✓' : i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600">
                  Attempts: {attemptCount} / {requiredAttempts}
                </p>
                <p className="text-sm mt-4 text-gray-600">
                  Try solving the challenge first! Click "Run Tests" to make an attempt.
                  <br />
                  Ask the AI tutor for hints if you need help.
                </p>
              </div>
            ) : !task.solution && (!task.alternativeSolutions || task.alternativeSolutions.length === 0) ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">💡 No solutions available</p>
                <p className="text-sm">This challenge doesn't have solution examples yet.</p>
              </div>
            ) : (
              <>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    {task.alternativeSolutions && task.alternativeSolutions.length > 0 ? 'Multiple Approaches' : 'Solution'}
                  </h4>
                  <p className="text-sm text-purple-800">
                    {task.alternativeSolutions && task.alternativeSolutions.length > 0
                      ? "There's often more than one way to solve a problem! Each approach below shows a different method with its own trade-offs."
                      : "Review the solution code below to understand how to solve this challenge."}
                  </p>
                </div>

                {/* Main Solution */}
                {task.solution && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200">
                      <h5 className="font-semibold text-gray-900 flex items-center justify-between">
                        <span>Reference Solution</span>
                        {onApplySolution && (
                          <button
                            onClick={() => onApplySolution(task.solution!)}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                          >
                            Apply to Editor
                          </button>
                        )}
                      </h5>
                    </div>
                    <div className="p-4 space-y-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        A straightforward solution that demonstrates the key concepts.
                      </p>
                      <div className="space-y-2">
                        {Object.entries(task.solution).map(([filename, code]) => {
                          if (!code || code.trim() === "") return null;
                          return (
                            <details key={filename} className="group" open={filename === 'index.html'}>
                              <summary className="cursor-pointer font-mono text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <span className="text-gray-400 group-open:rotate-90 transition-transform">▶</span>
                                {filename}
                              </summary>
                              <div className="mt-2 bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                                <pre>{code}</pre>
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Alternative Solutions */}
                {task.alternativeSolutions && task.alternativeSolutions.map((solution, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200">
                      <h5 className="font-semibold text-gray-900 flex items-center justify-between">
                        <span>{solution.label}</span>
                        {onApplySolution && (
                          <button
                            onClick={() => onApplySolution(solution.files)}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                          >
                            Apply to Editor
                          </button>
                        )}
                      </h5>
                    </div>
                    <div className="p-4 space-y-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {solution.explanation}
                      </p>
                      <div className="space-y-2">
                        {Object.entries(solution.files).map(([filename, code]) => {
                          if (!code || code.trim() === "") return null;
                          return (
                            <details key={filename} className="group">
                              <summary className="cursor-pointer font-mono text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <span className="text-gray-400 group-open:rotate-90 transition-transform">▶</span>
                                {filename}
                              </summary>
                              <div className="mt-2 bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                                <pre>{code}</pre>
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === "context" && (
          <div className="space-y-4">
            {task.realWorldContext ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                    <span className="mr-2">🌍</span>
                    Why This Matters
                  </h4>
                  <p className="text-sm text-green-800">
                    Understanding how skills connect to real-world development helps you see the bigger picture.
                  </p>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {task.realWorldContext}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">📚 Context coming soon</p>
                <p className="text-sm">Real-world examples and use cases will be added here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
