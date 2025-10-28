import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/app/lib/server-db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = process.env.MODEL_FAST || "claude-3-haiku-20240307"; // Haiku 4.5 slot

const SYS = `あなたは初学者向けWeb開発の講師AIです。常に日本語（丁寧体）で回答します。
目的: 学習者が自分で解けるように【段階的ヒント】を提示してください。正解コードは出しません。
原則:
- まず「何を確認すべきか」を1文
- 次に「方向性のヒント」を2〜3個、箇条書きで短く
- 最後に「最小の例」を1〜2行の疑似タグ名・API名レベルで示す（完成コードは不可）
- objective と passCriteria に沿って不足点だけ指摘
出力は日本語。完成コードや長いコードブロックは出さない`;

export async function POST(req: Request, { params }: { params: { slug: string }}) {
  const { files, lastTestResult, level = 1 } = await req.json();
  const ch = await prisma.challenge.findUnique({
    where: { slug: params.slug },
    include: { hintTemplates: true }
  });
  if (!ch) return new Response("Not found", { status: 404 });

  const seed = ch.hintTemplates.find(t => t.level === level) || ch.hintTemplates[0];

  const user = [
    `課題タイトル: ${ch.title}`,
    `学習目標: ${ch.objective}`,
    `合否条件: ${ch.passCriteria}`,
    `提出(抜粋):`,
    `HTML:\n${files?.html ?? "(なし)"}`,
    `CSS:\n${files?.css ?? "(なし)"}`,
    `JS:\n${files?.js ?? "(なし)"}`,
    `直近テスト結果:\n${JSON.stringify(lastTestResult ?? {}, null, 2)}`,
    `参考ヒント(レベル${level}): ${seed?.text ?? "(なし)"} `,
    `制約: 完成コードは出さない。タグ名や属性名レベルの示唆に留める。`
  ].join("\n\n");

  const res = await anthropic.messages.create({
    model: MODEL, max_tokens: 350, temperature: 0.3,
    system: SYS,
    messages: [{ role: "user", content: user }]
  });
  const text = res.content?.map((c: any) => c.text ?? "").join("") ?? "";
  const nextLevelSuggested = !lastTestResult?.passed && level < 3 ? level + 1 : level;
  return new Response(JSON.stringify({ hintText: text.trim(), nextLevelSuggested }), { headers: { "Content-Type": "application/json" }});
}
