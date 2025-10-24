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
