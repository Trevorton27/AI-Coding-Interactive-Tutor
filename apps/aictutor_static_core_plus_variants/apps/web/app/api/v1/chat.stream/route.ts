// apps/web/app/api/v1/chat.stream/route.ts
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { sseHeaders, writeSSE } from "@/app/lib/sse";
import { verifyServiceToken } from "@/app/lib/auth";
import { AGENT_DEFAULT } from "@/config/agent";
import { chooseModel } from "@/app/lib/router";
import { ensureJapaneseOrThrow } from "@/app/lib/validator";
import { searchKnowledge } from "@/app/lib/rag";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    verifyServiceToken(req);
    const { conversationId, studentId, courseId, message, language = "ja-JP", retrieve } = await req.json();

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      try {
        const sys = buildSystemPrompt();
        const userMsg = `学生ID: ${studentId} コースID: ${courseId}\n${message}`;

        const ctxSnips = retrieve?.topK ? await searchKnowledge(courseId, message, retrieve.topK) : [];
        const ctxText  = toCitations(ctxSnips);

        const model = chooseModel("code");
        const resp = await anthropic.messages.stream({
          model,
          max_tokens: 1024,
          system: sys,
          messages: [{ role: "user", content: `${ctxText}\n\n${userMsg}\n\n※日本語で回答してください。` }]
        });

        resp.on("text", async t => { await writeSSE(writer, "token", { text: t }); });
        resp.on("message", async m => {
          const full = m.content?.map((c: any) => c.text || "").join("") || "";
          try { ensureJapaneseOrThrow(full); } catch { /* optional retry with self-critique */ }
        });
        resp.on("end", async () => { await writeSSE(writer, "done", { ok: true }); await writer.close(); });
        resp.on("error", async e => { await writeSSE(writer, "error", { error: String(e) }); await writer.close(); });

        await resp.start();
      } catch (err) {
        await writeSSE(writer, "error", { error: String(err) });
        await writer.close();
      }
    })();

    return new Response(stream.readable, { headers: sseHeaders() });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e) }), { status: e?.status || 500 });
  }
}

function buildSystemPrompt() {
  return [
    AGENT_DEFAULT.systemPrompt,
    "",
    "追加ルール:",
    "- 応答は必ず日本語（丁寧体）。",
    "- RAG参照がある場合は（引用元: <lesson/uri>）を末尾に付ける。",
    "- 構成: 要約→手順→最小コード→確認質問→次の一歩。"
  ].join("\n");
}
function toCitations(snips: any[]) {
  if (!snips.length) return "";
  const cites = snips.map(s => `- ${s.lessonId ? \`lesson-\${s.lessonId}\` : (s.uri || s.id)}`).join("\n");
  const body  = snips.map(s => s.text).join("\n---\n");
  return `# 参照スニペット\n${body}\n\n(引用元:\n${cites}\n)`;
}
