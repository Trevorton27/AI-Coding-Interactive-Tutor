/**
 * Converts Challenge format to Task format for tasks.levels.json
 */
import fs from "node:fs";
import path from "node:path";

interface Challenge {
  level: number;
  slug: string;
  title: string;
  objective: string;
  passCriteria: string;
  starter: { html?: string; css?: string; js?: string };
  tests: Array<
    | { id: string; type: "dom-assert"; selector: string }
    | { id: string; type: "dom-assert-attr"; selector: string; attr: string }
    | { id: string; type: "js-eval"; code: string }
  >;
  tags: string[];
  solutions: Array<{
    label: string;
    files: { html?: string; css?: string; js?: string };
    notes?: string;
  }>;
  hints: Array<{ level: number; text: string }>;
}

interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  category: string;
  scaffold: Record<string, string>;
  tests: Array<{ id: string; code: string; label: string }>;
  solution?: Record<string, string>;
}

// Determine path based on working directory
const cwd = process.cwd();
let challengesDir = path.join(cwd, "data", "challenges");
if (!fs.existsSync(challengesDir)) {
  challengesDir = path.join(cwd, "apps", "web", "data", "challenges");
}

const files = fs.readdirSync(challengesDir).filter((f) => f.endsWith(".json"));

const tasks: Task[] = [];

files.forEach((file) => {
  const challengePath = path.join(challengesDir, file);
  const challenge: Challenge = JSON.parse(
    fs.readFileSync(challengePath, "utf-8")
  );

  // Convert Challenge format to Task format
  const task: Task = {
    id: challenge.slug,
    title: challenge.title,
    description: challenge.objective,
    difficulty: challenge.level,
    category: challenge.tags.join(", "),
    scaffold: {
      "index.html": challenge.starter.html || "",
      "style.css": challenge.starter.css || "",
      "script.js": challenge.starter.js || "",
    },
    tests: challenge.tests.map((test) => {
      // Convert test format
      if (test.type === "dom-assert") {
        return {
          id: test.id,
          code: `!!document.querySelector('${test.selector}')`,
          label: `Has element: ${test.selector}`,
        };
      } else if (test.type === "dom-assert-attr") {
        return {
          id: test.id,
          code: `!!document.querySelector('${test.selector}')?.getAttribute('${test.attr}')`,
          label: `Has attribute ${test.attr} on ${test.selector}`,
        };
      } else if (test.type === "js-eval") {
        return {
          id: test.id,
          code: test.code,
          label: "JS evaluation passes",
        };
      }
      return test as any;
    }),
  };

  // Add solution if available
  if (challenge.solutions && challenge.solutions.length > 0) {
    const sol = challenge.solutions[0];
    task.solution = {
      "index.html": sol.files.html || "",
      "style.css": sol.files.css || "",
      "script.js": sol.files.js || "",
    };
  }

  tasks.push(task);
});

// Sort by difficulty and id
tasks.sort((a, b) => {
  if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
  return a.id.localeCompare(b.id);
});

// Write to tasks.levels.json
let outputPath = path.join(cwd, "data", "tasks.levels.json");
if (!fs.existsSync(path.dirname(outputPath))) {
  outputPath = path.join(cwd, "apps", "web", "data", "tasks.levels.json");
}
fs.writeFileSync(outputPath, JSON.stringify(tasks, null, 2), "utf-8");

console.log(`✅ Converted ${tasks.length} challenges to tasks.levels.json`);
