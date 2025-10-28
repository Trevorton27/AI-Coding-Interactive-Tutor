import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/app/lib/server-db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = process.env.MODEL_FAST || "claude-3-haiku-20240307";

const SYS = `あなたは課題作成AIです。同じ学習目標を保ちつつ、文言や識別子を小さく変えた別バージョンを作成します。
制約:
- objective と passCriteria は維持
- starter は最小限（必要なファイルのみ）
- tests は既存構造に合わせたJSON配列
- 出力はJSONのみ
{
  "title": "...(Variant)",
  "starter": { "html": "...", "css": "...", "js": "..." },
  "tests": [ ... ]
}`;

export async function POST(req: Request, { params }: { params: { slug: string }}) {
  const { difficulty = "same" } = await req.json();
  const ch = await prisma.challenge.findUnique({
    where: { slug: params.slug },
    select: { title:true, objective:true, passCriteria:true, starter:true, tests:true, paramsSchema:true }
  });
  if (!ch) return new Response("Not found", { status: 404 });

  const user = JSON.stringify({
    title: ch.title, objective: ch.objective, passCriteria: ch.passCriteria,
    starter: ch.starter, tests: ch.tests, paramsSchema: ch.paramsSchema, difficulty
  });

  const res = await anthropic.messages.create({
    model: MODEL, max_tokens: 700, temperature: 0.5,
    system: SYS,
    messages: [{ role: "user", content: user }]
  });

  const text = res.content?.map((c: any) => c.text ?? "").join("") ?? "{}";
  let payload: any = {};
  try { payload = JSON.parse(text); } catch { payload = {}; }
  const variant = {
    title: payload.title ?? (ch.title + " (Variant)"),
    objective: ch.objective,
    passCriteria: ch.passCriteria,
    starter: payload.starter ?? ch.starter,
    tests: payload.tests ?? ch.tests
  };
  return new Response(JSON.stringify(variant), { headers: { "Content-Type": "application/json" }});
}
