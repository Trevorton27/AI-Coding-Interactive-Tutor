// scripts/seed-tasks.ts
// Seeds the Task model from tasks.levels.json

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface TaskData {
  id: string;
  title: string;
  description: string;
  scaffold: Record<string, string>;
  tests: Array<{
    id: string;
    code: string;
    label: string;
  }>;
  difficulty: number;
  category?: string;
  solution?: Record<string, string>;
  realWorldContext?: string;
  alternativeSolutions?: Array<{
    label: string;
    files: Record<string, string>;
    explanation: string;
  }>;
}

async function loadTasksJson(): Promise<TaskData[]> {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'data/tasks.levels.json'),
    path.join(cwd, 'apps/web/data/tasks.levels.json'),
  ];

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, 'utf-8');
      return JSON.parse(raw);
    } catch (_) {
      // try next
    }
  }

  throw new Error(
    `tasks.levels.json not found. Looked in: ${candidates.join(', ')}`
  );
}

async function seedTasks() {
  try {
    console.log('📚 Loading tasks from tasks.levels.json...');
    const tasks = await loadTasksJson();
    console.log(`Found ${tasks.length} tasks to seed`);

    // Clear existing tasks
    console.log('🗑️  Clearing existing tasks...');
    await prisma.task.deleteMany({});

    console.log('✨ Seeding tasks...');
    let seededCount = 0;

    for (const task of tasks) {
      await prisma.task.create({
        data: {
          id: task.id,
          title: task.title,
          description: task.description,
          prompt: task.description, // Use description as prompt
          difficulty: task.difficulty,
          scaffold: task.scaffold,
          tests: task.tests,
          solution: task.solution || {},
          hints: [], // Default empty hints array
          prerequisites: [], // Default empty prerequisites
          realWorldContext: task.realWorldContext,
          alternativeSolutions: task.alternativeSolutions,
        },
      });
      seededCount++;

      if (seededCount % 10 === 0) {
        console.log(`  ✓ Seeded ${seededCount}/${tasks.length} tasks...`);
      }
    }

    console.log(`\n✅ Successfully seeded ${seededCount} tasks!`);
  } catch (error) {
    console.error('❌ Error seeding tasks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTasks()
  .then(() => {
    console.log('\n🎉 Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed script failed:', error);
    process.exit(1);
  });
