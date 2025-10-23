// apps/web/app/learn/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChatPanel } from "../components/ChatPanel";
import { CodeEditor } from "../components/CodeEditor";
import { PreviewSandbox } from "../components/PreviewSandbox";
import { TestPanel } from "../components/TestPanel";
import { makeHostCapabilities } from "../lib/host";
import type { HostCapabilities } from "@aict/services/orchestrator";

// Mock task structure - replace with real data loading
interface Task {
  id: string;
  title: string;
  description: string;
  scaffold: Record<string, string>;
  tests: Array<{ id: string; code: string }>;
}

export default function LearnPage() {
  // Core state
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [editorFiles, setEditorFiles] = useState<Record<string, string>>({});
  const [activePath, setActivePath] = useState<string>("");
  const [testResult, setTestResult] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Refs for orchestrator
  const currentTaskRef = useRef<Task | null>(null);
  const editorFilesRef = useRef<Record<string, string>>({});

  // Keep refs in sync
  useEffect(() => {
    currentTaskRef.current = currentTask;
  }, [currentTask]);

  useEffect(() => {
    editorFilesRef.current = editorFiles;
  }, [editorFiles]);

  // Load initial task on mount
  useEffect(() => {
    loadInitialTask();
  }, []);

  const loadInitialTask = async () => {
    // TODO: Fetch from API - for now use mock
    const mockTask: Task = {
      id: "html-basics-1",
      title: "Create a Simple Webpage",
      description: "Create an HTML page with a heading and paragraph",
      scaffold: {
        "index.html": "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <!-- Add your code here -->\n</body>\n</html>",
        "style.css": "/* Add your styles here */\n"
      },
      tests: [
        { id: "has-h1", code: "document.querySelector('h1') !== null" },
        { id: "has-paragraph", code: "document.querySelector('p') !== null" }
      ]
    };
    
    setCurrentTask(mockTask);
    setEditorFiles(mockTask.scaffold);
    setActivePath("index.html");
  };

  // Host capabilities implementation
  const hostCapabilities: HostCapabilities = makeHostCapabilities({
    loadTaskById: async (id: string) => {
      // TODO: Fetch task from API
      console.log("Loading task:", id);
    },
    
    pickNextTask: async (strategy: "just-right" | "sequential") => {
      // TODO: Call task selection API
      console.log("Picking next task with strategy:", strategy);
    },
    
    openPath: async (path: string) => {
      setActivePath(path);
    },
    
    writeFiles: async (files: Record<string, string>) => {
      setEditorFiles(prev => ({ ...prev, ...files }));
    },
    
    runSandbox: async () => {
      setRefreshTrigger(prev => prev + 1);
    },
    
    runTestsApi: async (payload: any) => {
      setIsTestRunning(true);
      try {
        const res = await fetch("/api/eval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
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
        body: JSON.stringify({ tags, result })
      });
    },
    
    revealSolutionUI: async () => {
      // TODO: Show modal with solution
      alert("Solution reveal not yet implemented");
    },
    
    getCurrentTask: () => currentTaskRef.current,
    getCurrentCodeBundle: () => editorFilesRef.current
  });

  // Context builder for model
  const buildContext = () => ({
    task: currentTask,
    test_result: testResult,
    editor: {
      open_path: activePath,
      files: editorFiles
    },
    student: {
      hint_policy: "normal", // TODO: Make configurable
      requested_full_solution: false
    }
  });

  const handleRunTests = async () => {
    if (!currentTask) return;
    
    setIsTestRunning(true);
    try {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Coding Tutor</h1>
            {currentTask && (
              <p className="text-sm text-gray-600 mt-1">{currentTask.title}</p>
            )}
          </div>
          <button
            onClick={handleRunTests}
            disabled={isTestRunning}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            {isTestRunning ? "Running..." : "Run Tests"}
          </button>
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
              <PreviewSandbox
                files={editorFiles}
                refreshTrigger={refreshTrigger}
              />
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
    </div>
  );
}