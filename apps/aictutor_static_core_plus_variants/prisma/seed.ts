import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const file = path.join(process.cwd(), "apps/web/data/tasks.levels.json");
  const raw = await fs.readFile(file, "utf-8");
  const tasks = JSON.parse(raw);
  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {
        title: t.title,
        description: t.description,
        difficulty: t.difficulty || 1,
        category: t.category || null,
        scaffold: t.scaffold,
        tests: t.tests,
      },
      create: {
        id: t.id,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty || 1,
        category: t.category || null,
        scaffold: t.scaffold,
        tests: t.tests,
      }
    });
  }
  console.log(`Seeded ${tasks.length} tasks.`);
}

main().finally(() => prisma.$disconnect());
