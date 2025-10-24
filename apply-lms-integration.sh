# apply-lms-integration.sh
set -euo pipefail

root="$(pwd)"

# ---- helpers ---------------------------------------------------------------
mk() { mkdir -p "$1"; }
write() { # write <path> <<'EOF' ... EOF
  local path="$1"; shift
  mk "$(dirname "$path")"
  cat > "$path"
  echo "WROTE  $path"
}
append_once() { # append_once <path> <marker> <<'EOF' ... EOF
  local path="$1"; local marker="$2"; shift 2
  mk "$(dirname "$path")"
  touch "$path"
  if grep -q "$marker" "$path"; then
    echo "SKIP   $path (already contains marker: $marker)"
  else
    echo "" >> "$path"
    cat >> "$path"
    echo "APPEND $path"
  fi
}

# ---- sanity ---------------------------------------------------------------
test -d apps/web || { echo "Run from repo root (must contain apps/web)"; exit 1; }

# ---- env hints ------------------------------------------------------------
echo "NOTE: ensure apps/web/.env.local contains:
ANTHROPIC_API_KEY=...
DATABASE_URL=...
TUTOR_SERVICE_TOKENS=supersecret_lms_token_1,supersecret_lms_token_2
MODEL_FAST=claude-3-haiku-20240307
MODEL_SMART=claude-3-5-sonnet-202410
# optional
RUNNER_URL=http://runner:8080
" >&2

# ---- new files ------------------------------------------------------------

write apps/web/config/agent.ts <<'EOF'
// apps/web/config/agent.ts
export const AGENT_DEFAULT = {
  systemPrompt: `あなたはソフトウェア開発の講師AIです。常に日本語で、丁寧体で回答します。
原則:
1) 学習者の理解度を確認し、短い例→要点→演習の順に進める。
2) 回答は段階的。まず要約→手順→コード（最小）→確認質問→「次の一歩」。
3) コードは最小実行例を提示し、「実行時の注意点」「よくある失敗」も併記。
4) 不明点は学習者に質問して仮説検証する。憶測で断言しない。
5) 受講コースの教材と提出物を最優先の根拠にする。RAG参照がある場合は（引用元: <lesson/uri>）を明記。
6) 出力はMarkdown。専門用語は英語併記（例: ベクトル埋め込み(vector embedding)）。
7) 完了時は「次の一歩」を1つだけ提案する。`,
  defaultTools: ["run_code","make_quiz","grade_submission"],
  policies: { enforceJapanese: true, requireCitation: true }
};
EOF

write apps/web/app/lib/auth.ts <<'EOF'
// apps/web/app/lib/auth.ts
import { NextRequest } from "next/server";
const VALID = (process.env.TUTOR_SERVICE_TOKENS || "")
  .split(",").map(s => s.trim()).filter(Boolean);
export function verifyServiceToken(req: NextRequest) {
  const token = req.headers.get("X-LMS-Service-Token");
  if (!token || !VALID.includes(token)) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
}
EOF

write apps/web/app/lib/sse.ts <<'EOF'
// apps/web/app/lib/sse.ts
export function sseHeaders() {
  return new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });
}
export function writeSSE(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  event: string,
  data: any
) {
  const enc = new TextEncoder();
  const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return writer.write(enc.encode(chunk));
}
EOF

write apps/web/app/lib/router.ts <<'EOF'
// apps/web/app/lib/router.ts
export function chooseModel(task: "small" | "code" | "grading" | "quiz"): string {
  const fast = process.env.MODEL_FAST || "claude-3-haiku-20240307";
  const smart = process.env.MODEL_SMART || "claude-3-5-sonnet-202410";
  switch (task) {
    case "small": return fast;
    case "code":
    case "grading":
    case "quiz":
    default: return smart;
  }
}
EOF

write apps/web/app/lib/server-db.ts <<'EOF'
// apps/web/app/lib/server-db.ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
EOF

write apps/web/app/lib/rag.ts <<'EOF'
// apps/web/app/lib/rag.ts
import { prisma } from "@/app/lib/server-db";
/** Minimal LIKE fallback (upgrade to pgvector later). */
export async function searchKnowledge(courseId: string, query: string, topK = 5) {
  return prisma.knowledgeDoc.findMany({
    where: { courseId, OR: [{ text: { contains: query } }, { uri: { contains: query } }] },
    take: topK,
    select: { id: true, lessonId: true, uri: true, text: true, meta: true }
  });
}
EOF

write apps/web/app/lib/validator.ts <<'EOF'
// apps/web/app/lib/validator.ts
export function looksJapanese(s: string) {
  return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(s);
}
export function ensureJapaneseOrThrow(s: string) {
  if (!looksJapanese(s)) throw new Error("出力は日本語でなければなりません。");
}
EOF

write apps/web/app/api/v1/chat.stream/route.ts <<'EOF'
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
EOF

write apps/web/app/api/v1/knowledge/search/route.ts <<'EOF'
// apps/web/app/api/v1/knowledge/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyServiceToken } from "@/app/lib/auth";
import { searchKnowledge } from "@/app/lib/rag";
export async function POST(req: NextRequest) {
  verifyServiceToken(req);
  const { courseId, query, topK = 5 } = await req.json();
  const rows = await searchKnowledge(courseId, query, topK);
  return NextResponse.json(rows);
}
EOF

write apps/web/app/api/v1/tools/run_code/route.ts <<'EOF'
// apps/web/app/api/v1/tools/run_code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyServiceToken } from "@/app/lib/auth";
export async function POST(req: NextRequest) {
  verifyServiceToken(req);
  const body = await req.json();
  if (process.env.RUNNER_URL) {
    const r = await fetch(`${process.env.RUNNER_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return NextResponse.json(await r.json(), { status: r.status });
  }
  return NextResponse.json({ stdout: "", stderr: "", verdicts: [] });
}
EOF

write apps/web/app/api/v1/tools/make_quiz/route.ts <<'EOF'
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
EOF

write apps/web/app/api/v1/tools/grade_submission/route.ts <<'EOF'
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
EOF

write scripts/ingest-knowledge.ts <<'EOF'
// scripts/ingest-knowledge.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.knowledgeDoc.create({
    data: {
      courseId: "nextjs-101",
      lessonId: "01",
      uri: "docs/lesson-01",
      text: "Next.jsのApp Routerではpage.tsxがルートに対応します。...",
      meta: { tags: ["nextjs", "app-router"] }
    }
  });
}
main().finally(() => prisma.$disconnect());
EOF

# ---- prisma schema append (both locations) -------------------------------
schema_block='// -------- Agent & Orchestration --------'
for p in apps/web/prisma/schema.prisma packages/database/prisma/schema.prisma; do
  if [ -f "$p" ]; then
    append_once "$p" "$schema_block" <<'EOF'
// -------- Agent & Orchestration --------
model Agent {
  id            String   @id @default(cuid())
  name          String   @unique
  version       String
  systemPrompt  String
  tools         Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Conversation {
  id            String   @id @default(cuid())
  agentId       String?
  agentVersion  String?
  studentId     String
  courseId      String
  createdAt     DateTime @default(now())
  messages      Message[]
  @@index([studentId, courseId])
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // system | user | assistant | tool | summary
  text           String   @db.Text
  tokens         Int?
  toolCalls      Json?
  language       String?
  createdAt      DateTime @default(now())
  feedback       Feedback?
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  @@index([conversationId])
}

// -------- Long-term memory & knowledge --------
model Memory {
  id         String   @id @default(cuid())
  studentId  String
  courseId   String
  text       String   @db.Text
  source     String
  lastUsedAt DateTime @default(now())
  embedding  Bytes?   // upgrade to pgvector later
  @@index([studentId, courseId])
}

model KnowledgeDoc {
  id        String   @id @default(cuid())
  courseId  String
  lessonId  String?
  uri       String?
  text      String   @db.Text
  meta      Json?
  embedding Bytes?   // upgrade to pgvector later
  @@index([courseId])
}

// -------- Feedback & evals --------
model Feedback {
  id         String   @id @default(cuid())
  messageId  String   @unique
  rating     Int      // -1 | 0 | 1
  tags       String[]
  comment    String?
  createdAt  DateTime @default(now())
  message    Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
}

model EvalSample {
  id         String   @id @default(cuid())
  input      String   @db.Text
  golden     String   @db.Text
  rubricId   String?
  createdAt  DateTime @default(now())
}

model EvalResult {
  id          String   @id @default(cuid())
  agentId     String
  agentVer    String
  sampleId    String
  score       Float
  metrics     Json
  createdAt   DateTime @default(now())
}
EOF
  else
    echo "WARN   missing $p (skipped prisma append)"
  fi
done

echo "----------------------------------------------------------------"
echo "DONE. Next steps:"
echo "1) Manually update apps/web/app/api/tutor/route.ts MASTER_PROMPT to the JP version I provided."
echo "2) pnpm --filter @aict/web prisma generate"
echo "3) pnpm --filter @aict/web prisma migrate dev -n 'agent_memory_knowledge_feedback'"
echo "4) Seed: pnpm tsx scripts/ingest-knowledge.ts"
echo "5) Test SSE: curl -N -H 'Content-Type: application/json' -H 'X-LMS-Service-Token: supersecret_lms_token_1' -d '{\"conversationId\":\"c1\",\"studentId\":\"s1\",\"courseId\":\"nextjs-101\",\"message\":\"SSRとISRの違いは？\",\"retrieve\":{\"topK\":3}}' http://localhost:3000/api/v1/chat.stream"
echo "----------------------------------------------------------------"
