// apps/web/app/api/variants/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import { promises as fs } from "fs";

import { generateVariantForTask } from "@aict/services";

export const dynamic = "force-dynamic";

function repoRoot(cwd: string) {
  // apps/web during runtime; repo root is one up from apps/web
  return cwd.endsWith("/apps/web") ? path.join(cwd, "..", "..") : cwd;
}

async function loadLocalTaskById(id: string) {
  const cwd = process.cwd();
  const root = repoRoot(cwd);

  // Check if this is an HTML challenge (html-001 to html-040)
  const isHtmlChallenge = /^html-\d{3}$/.test(id);

  if (isHtmlChallenge) {
    // Load from html_challenges_40.json for HTML challenges
    const htmlCandidates = [
      path.join(cwd, "data/html_challenges_40.json"),
      path.join(root, "apps/web/data/html_challenges_40.json")
    ];

    for (const p of htmlCandidates) {
      try {
        const raw = await fs.readFile(p, "utf8");
        const htmlTasks = JSON.parse(raw);
        const task = htmlTasks.find((t: any) => t.id === id);
        if (task) {
          // Transform to match expected format
          return {
            ...task,
            tests: task.tests.map((test: any) => ({
              id: test.id,
              code: test.code,
              label: test.description || test.label || `Test ${test.id}`
            })),
            solution: task.solutions?.[0]?.files || task.scaffold,
            alternativeSolutions: task.solutions?.slice(1).map((sol: any) => ({
              label: sol.id || 'Alternative',
              files: sol.files,
              explanation: sol.explanation || 'An alternative solution approach.'
            })) || []
          };
        }
      } catch {}
    }
  }

  // Fall back to tasks.levels.json for other challenges
  const candidates = [
    path.join(cwd, "data/tasks.levels.json"),
    path.join(root, "apps/web/data/tasks.levels.json")
  ];
  let tasks: any[] | null = null;
  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf8");
      tasks = JSON.parse(raw);
      break;
    } catch {}
  }
  if (!tasks) throw new Error("tasks.levels.json not found");
  return tasks.find((t:any) => t.id === id) ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const { task_id, seed } = await req.json();
    if (!task_id) return NextResponse.json({ error: "task_id required" }, { status: 400 });

    const task = await loadLocalTaskById(task_id);
    if (!task) return NextResponse.json({ error: "task not found" }, { status: 404 });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const spec = await generateVariantForTask({
      task,
      seed: seed || Math.random().toString(36).slice(2),
      anthropic,
      model: process.env.CLAUDE_MODEL || "claude-3-5-haiku-20241022"
    });

    // Apply scaffold overrides in-memory for client to load
    const merged = {
      ...task,
      title: spec.title,
      description: spec.description,
      variant: { seed: spec.seed, theme: spec.theme },
      scaffold: { ...task.scaffold, ...(spec.scaffold_overrides || {}) },
      hints: [...(task.hints || []), ...(spec.additional_hints || [])]
    };

    return NextResponse.json({ task: merged, variant: spec });
  } catch (err:any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
