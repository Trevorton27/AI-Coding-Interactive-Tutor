// apps/web/app/lib/host.ts
import type { HostCapabilities } from "@aict/services/orchestrator";

export interface HostOptions {
  // Task management
  loadTaskById: (id: string) => Promise<void>;
  pickNextTask: (strategy: "just-right" | "sequential") => Promise<void>;

  // Editor operations
  openPath: (path: string) => Promise<void>;
  writeFiles: (files: Record<string, string>) => Promise<void>;
  
  // Sandbox execution
  runSandbox: () => Promise<void>;

  // Test execution
  runTestsApi: (payload: {
    task: any;
    files: Record<string, string>;
  }) => Promise<{
    passed: boolean;
    passedIds: string[];
    failedIds: string[];
    messages: Record<string, string>;
  }>;

  // Mastery tracking
  updateMasteryApi: (tags: string[], result: "pass" | "fail") => Promise<void>;

  // UI actions
  revealSolutionUI: () => Promise<void>;

  // State getters
  getCurrentTask: () => any;
  getCurrentCodeBundle: () => Record<string, string>;
}

export function makeHostCapabilities(opts: HostOptions): HostCapabilities {
  return {
    async loadTask(taskId: string) {
      await opts.loadTaskById(taskId);
    },

    async pickNextTask(strategy: "just-right" | "sequential") {
      await opts.pickNextTask(strategy);
    },

    async openPath(path: string) {
      await opts.openPath(path);
    },

    async writeFiles(files: Record<string, string>) {
      // Optional: Validate file sizes/count before writing
      const fileCount = Object.keys(files).length;
      if (fileCount > 20) {
        console.warn(`Writing many files (${fileCount}), may impact performance`);
      }

      // Check for overly large code snippets (pedagogical guard)
      for (const [path, content] of Object.entries(files)) {
        const lines = content.split('\n').length;
        if (lines > 100) {
          console.warn(`File ${path} has ${lines} lines - may be too much for learning`);
        }
      }

      await opts.writeFiles(files);
    },

    async runSandbox() {
      await opts.runSandbox();
    },

    async runTests() {
      const task = opts.getCurrentTask();
      const files = opts.getCurrentCodeBundle();

      if (!task) {
        throw new Error("No task loaded");
      }

      return await opts.runTestsApi({ task, files });
    },

    async updateMastery(tags: string[], result: "pass" | "fail") {
      if (tags.length === 0) {
        console.warn("updateMastery called with no tags");
        return;
      }
      await opts.updateMasteryApi(tags, result);
    },

    async revealSolution() {
      await opts.revealSolutionUI();
    }
  };
}