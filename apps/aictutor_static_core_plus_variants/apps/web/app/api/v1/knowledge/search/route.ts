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
