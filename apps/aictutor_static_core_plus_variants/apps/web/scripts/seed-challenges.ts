// scripts/seed-challenges.ts
// Seeds the challenges from tasks.levels.json into the PostgreSQL database

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface Challenge {
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
  category: string;
  solution?: Record<string, string>;
}

async function loadChallengesJson(): Promise<Challenge[]> {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'apps/web/data/tasks.levels.json'),
    path.join(cwd, 'data/tasks.levels.json'),
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
    `tasks.levels.json not found. Looked in:\n${candidates.join('\n')}`
  );
}

async function seedChallenges() {
  try {
    console.log('Loading challenges from tasks.levels.json...');
    const challenges = await loadChallengesJson();
    console.log(`Found ${challenges.length} challenges to seed`);

    // Clear existing challenges (optional - comment out if you want to preserve existing data)
    console.log('Clearing existing challenges...');
    await prisma.task.deleteMany({});

    console.log('Seeding challenges...');
    let seededCount = 0;

    for (const challenge of challenges) {
      await prisma.task.create({
        data: {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          difficulty: challenge.difficulty,
          category: challenge.category,
          scaffold: challenge.scaffold,
          tests: challenge.tests,
          solution: challenge.solution || null,
        },
      });
      seededCount++;

      if (seededCount % 10 === 0) {
        console.log(`Seeded ${seededCount}/${challenges.length} challenges...`);
      }
    }

    console.log(`✅ Successfully seeded ${seededCount} challenges!`);
  } catch (error) {
    console.error('❌ Error seeding challenges:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedChallenges()
  .then(() => {
    console.log('Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
