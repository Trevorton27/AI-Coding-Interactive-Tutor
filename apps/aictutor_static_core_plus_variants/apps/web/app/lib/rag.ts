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
