import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic"; // avoid caching during dev

const SRC = process.env.TASKS_SOURCE || "local"; // local | db

async function readJsonFlexible() {
  const cwd = process.cwd(); // when running inside apps/web, this IS apps/web
  const candidates = [
    path.join(cwd, "data/tasks.levels.json"),          // when cwd === apps/web
    path.join(cwd, "apps/web/data/tasks.levels.json"), // when cwd === repo root
  ];

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf-8");
      return JSON.parse(raw) as any[];
    } catch (_) {
      // try next
    }
  }
  throw new Error(
    `tasks.levels.json not found. Looked in:\n${candidates.join("\n")}`
  );
}

async function loadLocal(level?: number) {
  const all = await readJsonFlexible();
  return typeof level === "number" ? all.filter(t => t.difficulty === level) : all;
}

async function loadDb(level?: number) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const where = level ? { difficulty: level } : {};
    return await prisma.task.findMany({ where, orderBy: { id: "asc" } });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const levelParam = searchParams.get("level");
    const level = levelParam ? parseInt(levelParam) : undefined;
    const limit = parseInt(searchParams.get("limit") || "15");
    const offset = parseInt(searchParams.get("offset") || "0");

    const rows = (process.env.TASKS_SOURCE || "local") === "db"
      ? await loadDb(level)
      : await loadLocal(level);

    const items = rows.slice(offset, offset + limit);
    return NextResponse.json({ items, total: rows.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
