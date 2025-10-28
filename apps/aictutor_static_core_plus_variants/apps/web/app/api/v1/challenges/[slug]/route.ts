import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/server-db";

export async function GET(_: Request, { params }: { params: { slug: string }}) {
  const ch = await prisma.challenge.findUnique({
    where: { slug: params.slug },
    select: { id:true, slug:true, level:true, title:true, objective:true, passCriteria:true, starter:true, tests:true, tags:true }
  });
  if (!ch) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(ch);
}
