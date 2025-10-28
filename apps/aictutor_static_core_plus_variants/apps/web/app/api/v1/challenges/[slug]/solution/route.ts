import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/server-db";

export async function GET(req: Request, { params }: { params: { slug: string }}) {
  const url = new URL(req.url);
  const index = Number(url.searchParams.get("index") ?? 0);
  const sols = await prisma.challengeSolution.findMany({
    where: { challenge: { slug: params.slug }},
    orderBy: { createdAt: "asc" }
  });
  if (!sols.length) return NextResponse.json({ error:"no_solution" }, { status:404 });
  const i = Math.max(0, Math.min(index, sols.length - 1));
  const s = sols[i];
  return NextResponse.json({ label: s.label, files: s.files, notes: s.notes ?? "" });
}
