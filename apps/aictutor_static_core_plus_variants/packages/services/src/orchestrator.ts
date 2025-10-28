// packages/services/src/orchestrator.ts
// Executes model "actions" from the Master Prompt and returns side-effect results for the next turn.

export type UIMessage = { type: "assistant" | "system" | "user"; text: string };

export type TutorResponse = {
  ui_messages: UIMessage[];
  hint?: { level: 1 | 2 | 3; concept_tag?: string | null };
  actions?: Action[];
};

export type Action =
  | { type: "load_task"; task_id: string }
  | { type: "open_path"; path: string }
  | { type: "write_files"; files: Record<string, string> }
  | { type: "run" }
  | { type: "run_tests" }
  | { type: "update_mastery"; concept_tags: string[]; result: "pass" | "fail" }
  | { type: "pick_next_task"; strategy: "just-right" | "sequential" }
  | { type: "reveal_solution"; confirm: true };

// --- Host-side capabilities your app must provide ---
export interface HostCapabilities {
  // Task management
  loadTask(taskId: string): Promise<void>;
  pickNextTask(strategy: "just-right" | "sequential"): Promise<void>;

  // Editor / Sandbox
  openPath(path: string): Promise<void>;
  writeFiles(files: Record<string, string>): Promise<void>;
  runSandbox(): Promise<void>;

  // Tests
  runTests(): Promise<{
    passed: boolean;
    passedIds: string[];
    failedIds: string[];
    messages: Record<string, string>;
  }>;

  // Mastery
  updateMastery(tags: string[], result: "pass" | "fail"): Promise<void>;

  // Reveal Solution (your UI decides how to show it)
  revealSolution(): Promise<void>;
}

// Basic shape guard (very light)
export function isTutorResponse(v: any): v is TutorResponse {
  return v && Array.isArray(v.ui_messages) && typeof v === "object";
}

// Execute all actions in order and collect any outputs we need to show / store for next turn
export async function runActions(
  resp: TutorResponse,
  host: HostCapabilities
): Promise<{
  test_result?: Awaited<ReturnType<HostCapabilities["runTests"]>>;
}> {
  const outputs: { test_result?: Awaited<ReturnType<HostCapabilities["runTests"]>> } = {};

  const actions = resp.actions ?? [];
  for (const a of actions) {
    switch (a.type) {
      case "load_task":
        await host.loadTask(a.task_id);
        break;
      case "open_path":
        await host.openPath(a.path);
        break;
      case "write_files":
        await host.writeFiles(a.files);
        break;
      case "run":
        await host.runSandbox();
        break;
      case "run_tests":
        outputs.test_result = await host.runTests();
        break;
      case "update_mastery":
        await host.updateMastery(a.concept_tags, a.result);
        break;
      case "pick_next_task":
        await host.pickNextTask(a.strategy);
        break;
      case "reveal_solution":
        await host.revealSolution();
        break;
      default:
        // ignore unknown action
        break;
    }
  }
  return outputs;
}