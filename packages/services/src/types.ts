// packages/services/src/types.ts
// Shared TypeScript types across the application

export interface Task {
  id: string;
  title: string;
  description: string;
  prompt: string;
  difficulty: number;
  conceptIds: string[];
  prerequisites: string[];
  scaffold: Record<string, string>;
  solution: Record<string, string>;
  tests: Test[];
  hints: Hint[];
}

export interface Test {
  id: string;
  code: string;
  successMessage?: string;
  failureMessage?: string;
}

export interface Hint {
  level: 1 | 2 | 3;
  text: string;
  conceptTag?: string;
}

export interface Concept {
  id: string;
  name: string;
  description?: string;
  difficulty: number;
  prerequisites: string[];
}

export interface Progress {
  userId: string;
  conceptId: string;
  mastery: number;
  attempts: number;
  successes: number;
  lastAttemptAt?: Date;
}

export interface Attempt {
  id: string;
  userId: string;
  taskId: string;
  code: Record<string, string>;
  passed: boolean;
  passedTests: string[];
  failedTests: string[];
  hintsUsed: number;
  maxHintLevel: number;
  timeSpentMs?: number;
  createdAt: Date;
}

export interface TestResult {
  passed: boolean;
  passedIds: string[];
  failedIds: string[];
  messages: Record<string, string>;
}

export interface Context {
  task: Task | null;
  test_result: TestResult | null;
  editor: {
    open_path: string;
    files: Record<string, string>;
  };
  student: {
    hint_policy: "strict" | "normal" | "generous";
    requested_full_solution: boolean;
  };
}