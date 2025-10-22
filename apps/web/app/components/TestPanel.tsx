// apps/web/app/components/TestPanel.tsx
"use client";

interface TestResult {
  passed: boolean;
  passedIds: string[];
  failedIds: string[];
  messages: Record<string, string>;
}

interface TestPanelProps {
  result: TestResult | null;
  onRunTests?: () => void;
  isRunning?: boolean;
}

export function TestPanel({ result, onRunTests, isRunning }: TestPanelProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No tests run yet</p>
          {onRunTests && (
            <button
              onClick={onRunTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Run Tests
            </button>
          )}
        </div>
      </div>
    );
  }

  const allTestIds = [...result.passedIds, ...result.failedIds];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-100 border-b border-gray-300 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">
            {result.passed ? "✅" : "❌"} Tests
          </span>
          <span className="text-sm text-gray-600">
            {result.passedIds.length} / {allTestIds.length} passed
          </span>
        </div>
        {onRunTests && (
          <button
            onClick={onRunTests}
            disabled={isRunning}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isRunning ? "Running..." : "Re-run"}
          </button>
        )}
      </div>

      {/* Overall Status */}
      <div
        className={`px-4 py-3 ${
          result.passed ? "bg-green-50" : "bg-red-50"
        }`}
      >
        <p
          className={`text-sm font-medium ${
            result.passed ? "text-green-800" : "text-red-800"
          }`}
        >
          {result.passed
            ? "All tests passed! 🎉"
            : "Some tests failed. Keep going!"}
        </p>
      </div>

      {/* Test List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {allTestIds.map(testId => {
          const passed = result.passedIds.includes(testId);
          const message = result.messages[testId];

          return (
            <div
              key={testId}
              className={`border rounded-lg p-3 ${
                passed
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{passed ? "✅" : "❌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {testId}
                  </p>
                  {message && (
                    <p
                      className={`text-sm mt-1 ${
                        passed ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}