// apps/web/app/learn/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChatPanel } from "../components/ChatPanel";
import { CodeEditor } from "../components/CodeEditor";
import { PreviewSandbox } from "../components/PreviewSandbox";
import { TestPanel } from "../components/TestPanel";
import { SolutionModal } from "../components/SolutionModal";
import { makeHostCapabilities } from "../lib/host";
import type { HostCapabilities } from "@aict/services/orchestrator";

// ----- Types -----
interface Task {
  id: string;
  title: string;
  description: string;
  scaffold: Record<string, string>;
  tests: Array<{ id: string; code: string }>;
  solution?: Record<string, string>;
  // Optional fields when coming from DB/local JSON:
  difficulty?: number;
  category?: string | null;
}

export default function LearnPage() {
  // ---------- Core state ----------
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [editorFiles, setEditorFiles] = useState<Record<string, string>>({});
  const [activePath, setActivePath] = useState<string>("");
  const [testResult, setTestResult] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // ---------- NEW: difficulty + task list ----------
  const [difficulty, setDifficulty] = useState<number>(1);
  const [taskList, setTaskList] = useState<Task[]>([]);

  // ---------- Solution modal state ----------
  const [showSolutionModal, setShowSolutionModal] = useState(false);

  // ---------- Refs for orchestrator ----------
  const currentTaskRef = useRef<Task | null>(null);
  const editorFilesRef = useRef<Record<string, string>>({});

  // Keep refs in sync
  useEffect(() => {
    currentTaskRef.current = currentTask;
  }, [currentTask]);

  useEffect(() => {
    editorFilesRef.current = editorFiles;
  }, [editorFiles]);

  // ---------- First render: load the original mock (fallback) ----------
  useEffect(() => {
    loadInitialTask();
  }, []);

  // ---------- When level changes: load 15 tasks for that level ----------
  useEffect(() => {
    loadTasksByLevel(difficulty);
  }, [difficulty]);

  // Fallback mock to keep MVP behavior intact on first paint
  const loadInitialTask = async () => {
    const mockTask: Task = {
      id: "html-basics-1",
      title: "Create a Simple Webpage",
      description: "Create an HTML page with a heading and paragraph",
      scaffold: {
        "index.html":
          "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <!-- Add your code here -->\n</body>\n</html>",
        "style.css": "/* Add your styles here */\n",
      },
      tests: [
        { id: "has-h1", code: "document.querySelector('h1') !== null" },
        { id: "has-paragraph", code: "document.querySelector('p') !== null" },
      ],
    };

    setCurrentTask(mockTask);
    setEditorFiles(mockTask.scaffold);
    setActivePath("index.html");
  };

  // ---------- NEW: fetch tasks of a given level from /api/tasks ----------
  async function loadTasksByLevel(level: number) {
    try {
      const res = await fetch(`/api/tasks?level=${level}&limit=15`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`GET /api/tasks failed: ${res.status}`);
      const data = await res.json();

      const items: Task[] = Array.isArray(data?.items) ? data.items : [];
      setTaskList(items);

      const first = items[0];
      if (first) {
        setCurrentTask(first);
        setEditorFiles(first.scaffold);
        setActivePath(Object.keys(first.scaffold)[0] || "index.html");
      }
    } catch (err) {
      console.error("loadTasksByLevel error:", err);
      // keep the previously loaded mock task
    }
  }

  // ---------- Host capabilities ----------
  const hostCapabilities: HostCapabilities = makeHostCapabilities({
    loadTaskById: async (id: string) => {
      // If you later want to support direct load-by-id, query /api/tasks without level and filter by id
      console.log("Loading task:", id);
      const found = taskList.find((t) => t.id === id);
      if (found) {
        setCurrentTask(found);
        setEditorFiles(found.scaffold);
        setActivePath(Object.keys(found.scaffold)[0] || "index.html");
      }
    },

    pickNextTask: async (strategy: "just-right" | "sequential") => {
      // Simple placeholder: advance to next item in the current list
      const idx = taskList.findIndex((t) => t.id === currentTaskRef.current?.id);
      const next = taskList[idx + 1] ?? taskList[0];
      if (next) {
        setCurrentTask(next);
        setEditorFiles(next.scaffold);
        setActivePath(Object.keys(next.scaffold)[0] || "index.html");
      }
      console.log("Picking next task with strategy:", strategy);
    },

    openPath: async (path: string) => {
      setActivePath(path);
    },

    writeFiles: async (files: Record<string, string>) => {
      setEditorFiles((prev) => ({ ...prev, ...files }));
    },

    runSandbox: async () => {
      setRefreshTrigger((prev) => prev + 1);
    },

    runTestsApi: async (payload: any) => {
      setIsTestRunning(true);
      try {
        const res = await fetch("/api/eval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        return result;
      } finally {
        setIsTestRunning(false);
      }
    },

    updateMasteryApi: async (tags: string[], result: "pass" | "fail") => {
      await fetch("/api/mastery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags, result }),
      });
    },

    revealSolutionUI: async () => {
      setShowSolutionModal(true);
    },

    getCurrentTask: () => currentTaskRef.current,
    getCurrentCodeBundle: () => editorFilesRef.current,
  });

  // ---------- Model context ----------
  const buildContext = () => ({
    task: currentTask,
    test_result: testResult,
    editor: {
      open_path: activePath,
      files: editorFiles,
    },
    student: {
      hint_policy: "normal", // TODO: Make configurable
      requested_full_solution: false,
    },
  });

  // ---------- UI handlers ----------
  const handleRunTests = async () => {
    if (!currentTask) return;

    setIsTestRunning(true);
    try {
      // makeHostCapabilities typically exposes host.runTests() that builds the correct payload
      const result = await hostCapabilities.runTests();
      setTestResult(result);
    } catch (error) {
      console.error("Test run failed:", error);
    } finally {
      setIsTestRunning(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Coding Tutor</h1>
            {currentTask && (
              <p className="text-sm text-gray-600 mt-1">{currentTask.title}</p>
            )}
          </div>

          {/* NEW: Level + Challenge pickers */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md p-1 text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Level {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Challenge</label>
              <select
                value={currentTask?.id ?? ""}
                onChange={(e) => {
                  const t = taskList.find((x) => x.id === e.target.value);
                  if (!t) return;
                  setCurrentTask(t);
                  setEditorFiles(t.scaffold);
                  setActivePath(
                    Object.keys(t.scaffold)[0] || "index.html"
                  );
                }}
                className="border border-gray-300 rounded-md p-1 text-sm min-w-[240px]"
              >
                <option value="" disabled>
                  {taskList.length ? "Select challenge…" : "No tasks for level"}
                </option>
                {taskList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowSolutionModal(true)}
              disabled={!currentTask?.solution}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              title={!currentTask?.solution ? "No solution available" : "View solution"}
            >
              Show Solution
            </button>

            <button
              onClick={handleRunTests}
              disabled={isTestRunning}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {isTestRunning ? "Running..." : "Run Tests"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="w-96 border-r border-gray-200">
          <ChatPanel
            host={hostCapabilities}
            contextBuilder={buildContext}
            onTestResult={setTestResult}
          />
        </div>

        {/* Middle: Editor + Preview */}
        <div className="flex-1 flex flex-col">
          {/* Task Description */}
          {currentTask && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
              <p className="text-sm text-blue-900">{currentTask.description}</p>
            </div>
          )}

          {/* Split: Editor | Preview */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 border-r border-gray-200">
              <CodeEditor
                files={editorFiles}
                onFilesChange={setEditorFiles}
                activePath={activePath}
                onActivePathChange={setActivePath}
              />
            </div>
            <div className="flex-1">
              <PreviewSandbox files={editorFiles} refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>

        {/* Right: Tests */}
        <div className="w-80 border-l border-gray-200">
          <TestPanel
            result={testResult}
            onRunTests={handleRunTests}
            isRunning={isTestRunning}
          />
        </div>
      </div>

      {/* Solution Modal */}
      {currentTask?.solution && (
        <SolutionModal
          isOpen={showSolutionModal}
          onClose={() => setShowSolutionModal(false)}
          solution={currentTask.solution}
          onApplySolution={(files) => {
            setEditorFiles(files);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
