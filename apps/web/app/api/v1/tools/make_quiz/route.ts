// apps/web/app/api/v1/tools/make_quiz/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyServiceToken } from "@/app/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
export async function POST(req: NextRequest) {
  verifyServiceToken(req);
  const { topic, difficulty = "beginner", n = 5 } = await req.json();
  const sys = "あなたは日本語でクイズを作るAI講師です。必ず日本語で出題し、最後に正答を配列で返します。";
  const res = await anthropic.messages.create({
    model: process.env.MODEL_SMART || "claude-3-5-sonnet-202410",
    max_tokens: 800,
    system: sys,
    messages: [{ role: "user", content: `トピック: ${topic}\n難易度: ${difficulty}\n問題数: ${n}\n形式: 選択式(4択)` }]
  });
  const text = res.content?.map((c: any) => c.text || "").join("") || "";
  return NextResponse.json({ quiz: text });
}
