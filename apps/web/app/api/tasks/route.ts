import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic"; // avoid caching during dev

const SRC = process.env.TASKS_SOURCE || "local"; // local | db

// Convert challenge structure to task structure
function challengeToTask(challenge: any) {
  return {
    id: challenge.slug,
    title: challenge.title,
    description: `${challenge.objective}\n\n${challenge.passCriteria}`,
    prompt: challenge.objective,
    difficulty: challenge.level,

    // Convert starter files to scaffold
    scaffold: {
      "index.html": challenge.starter?.html || "",
      "style.css": challenge.starter?.css || "",
      "script.js": challenge.starter?.js || "",
    },

    // Convert solutions to alternativeSolutions
    alternativeSolutions: challenge.solutions?.map((sol: any) => ({
      label: sol.label,
      files: {
        "index.html": sol.files?.html || "",
        "style.css": sol.files?.css || "",
        "script.js": sol.files?.js || "",
      },
      explanation: sol.notes || "",
    })) || [],

    // Convert tests - need to convert type-based tests to code-based
    tests: challenge.tests?.map((test: any) => {
      if (test.code) {
        // Already has code
        return {
          id: test.id,
          code: test.code,
          label: test.label || test.id,
        };
      } else if (test.type === "dom-assert" && test.selector) {
        // Convert DOM assertion to code
        return {
          id: test.id,
          code: `!!document.querySelector("${test.selector}")`,
          label: test.label || `Has element: ${test.selector}`,
        };
      } else {
        // Fallback
        return {
          id: test.id,
          code: "true",
          label: test.label || test.id,
        };
      }
    }) || [],

    hints: challenge.hints || [],
    prerequisites: [],
    solution: challenge.solutions?.[0]?.files ? {
      "index.html": challenge.solutions[0].files.html || "",
      "style.css": challenge.solutions[0].files.css || "",
      "script.js": challenge.solutions[0].files.js || "",
    } : {},
  };
}

async function readChallengesFromDirectory() {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "data/challenges"),
    path.join(cwd, "apps/web/data/challenges"),
  ];

  for (const dir of candidates) {
    try {
      const files = await fs.readdir(dir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const challenges = await Promise.all(
        jsonFiles.map(async (file) => {
          const raw = await fs.readFile(path.join(dir, file), "utf-8");
          const challenge = JSON.parse(raw);
          return challengeToTask(challenge);
        })
      );

      // Sort by id to maintain consistent order
      return challenges.sort((a, b) => a.id.localeCompare(b.id));
    } catch (_) {
      // try next
    }
  }

  throw new Error(
    `challenges directory not found. Looked in:\n${candidates.join("\n")}`
  );
}

async function readJsonFlexible() {
  // Try loading from challenges directory first
  try {
    return await readChallengesFromDirectory();
  } catch (challengeErr) {
    // Fallback to tasks.levels.json
    const cwd = process.cwd();
    const candidates = [
      path.join(cwd, "data/tasks.levels.json"),
      path.join(cwd, "apps/web/data/tasks.levels.json"),
    ];

    for (const p of candidates) {
      try {
        const raw = await fs.readFile(p, "utf-8");
        return JSON.parse(raw) as any[];
      } catch (_) {
        // try next
      }
    }
    throw new Error(
      `Neither challenges directory nor tasks.levels.json found.\nChallenges error: ${challengeErr}\nLooking for tasks in: ${candidates.join(", ")}`
    );
  }
}

async function loadLocal(level?: number) {
  const all = await readJsonFlexible();
  return typeof level === "number" ? all.filter(t => t.difficulty === level) : all;
}

async function loadDb(level?: number) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const where = level ? { difficulty: level } : {};
    return await prisma.task.findMany({ where, orderBy: { id: "asc" } });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // Accept both 'level' and 'difficulty' parameters (they mean the same thing)
    const levelParam = searchParams.get("level") || searchParams.get("difficulty");
    const level = levelParam ? parseInt(levelParam) : undefined;
    const limit = parseInt(searchParams.get("limit") || "15");
    const offset = parseInt(searchParams.get("offset") || "0");

    const rows = (process.env.TASKS_SOURCE || "local") === "db"
      ? await loadDb(level)
      : await loadLocal(level);

    const items = rows.slice(offset, offset + limit);
    return NextResponse.json({ items, total: rows.length });
  } catch (err: any) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
