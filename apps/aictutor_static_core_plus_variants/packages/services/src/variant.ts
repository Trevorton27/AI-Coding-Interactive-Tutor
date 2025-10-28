// packages/services/src/variant.ts
import Anthropic from "@anthropic-ai/sdk";
import type { Task } from "./types";

/**
 * Variation generator: keeps grading deterministic by only changing narrative and superficial parameters.
 * Tests remain untouched. This makes variants "theme skins" of a canonical task.
 */
export interface VariantSpec {
  seed: string;
  theme: string;
  title: string;
  description: string;
  scaffold_overrides?: Record<string, string>;
  additional_hints?: { level: 1|2|3; text: string }[];
}

export async function generateVariantForTask(opts: {
  task: Task;
  seed: string;
  anthropic: Anthropic;
  model?: string;
}): Promise<VariantSpec> {
  const { task, seed, anthropic } = opts;
  const model = opts.model || process.env.CLAUDE_MODEL || "claude-3-5-haiku-20241022";

  const sys = `You rewrite web dev coding challenges without changing their testable requirements.
- Keep HTML/CSS/JS objectives identical.
- Only change the story/theme, names, and copy.
- Provide optional starter code comments that fit the theme.
- Do not include full solutions.
- Return strictly JSON with keys: theme, title, description, scaffold_overrides (object of filename->string), additional_hints (array of {level,text}).`;

  const user = {
    seed,
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      prompt: task.prompt,
      scaffold: task.scaffold,
      tests: task.tests?.map(t => ({ id: t.id, description: t.description, type: t.type })) ?? [],
      hints: task.hints?.slice(0,3) ?? []
    }
  };

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 700,
    system: sys,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Create a light variation (new theme) for the given task. Keep requirements the same. JSON only." },
        { type: "text", text: JSON.stringify(user) }
      ]
    }]
  });

  const text = msg.content?.[0]?.type === "text" ? msg.content[0].text : "";
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Fallback: return minimal pass-through variant
    return {
      seed,
      theme: "original",
      title: task.title,
      description: task.description,
      scaffold_overrides: {},
      additional_hints: []
    };
  }

  // Defensive shaping
  const spec: VariantSpec = {
    seed,
    theme: String(parsed.theme || "custom"),
    title: String(parsed.title || task.title),
    description: String(parsed.description || task.description),
    scaffold_overrides: parsed.scaffold_overrides && typeof parsed.scaffold_overrides === "object"
      ? parsed.scaffold_overrides
      : {},
    additional_hints: Array.isArray(parsed.additional_hints) ? parsed.additional_hints
      .filter((h:any) => h && (h.level===1||h.level===2||h.level===3) && typeof h.text==="string")
      : []
  };

  return spec;
}