// apps/web/app/api/v1/tools/grade_submission/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyServiceToken } from "@/app/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
export async function POST(req: NextRequest) {
  verifyServiceToken(req);
  const { rubricId, repo_url, code, rubricText } = await req.json();
  const sys = "あなたは日本語の採点アシスタントです。ルーブリックに従って減点方式で採点し、改善点と次の一歩を短く示してください。";
  const res = await anthropic.messages.create({
    model: process.env.MODEL_SMART || "claude-3-5-sonnet-202410",
    max_tokens: 800,
    system: sys,
    messages: [{ role: "user", content: `ルーブリックID: ${rubricId}\nリポジトリ: ${repo_url}\nルーブリック本文:\n${rubricText}\n\n提出コード抜粋:\n${code || "(省略)"}\n` }]
  });
  const text = res.content?.map((c: any) => c.text || "").join("") || "";
  return NextResponse.json({ grading: text });
}
