import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  const challengeCount = await prisma.challenge.count();
  const taskCount = await prisma.task.count();
  const challengeSolutionCount = await prisma.challengeSolution.count();
  
  console.log('📊 Database Verification:');
  console.log(`  ✓ Challenges: ${challengeCount}`);
  console.log(`  ✓ Tasks: ${taskCount}`);
  console.log(`  ✓ Challenge Solutions: ${challengeSolutionCount}`);
  
  // Sample a few records
  const sampleChallenge = await prisma.challenge.findFirst({ where: { level: 1 } });
  const sampleTask = await prisma.task.findFirst({ where: { difficulty: 1 } });
  
  console.log('\n📝 Sample Records:');
  console.log(`  Challenge: ${sampleChallenge?.title} (${sampleChallenge?.slug})`);
  console.log(`  Task: ${sampleTask?.title} (${sampleTask?.id})`);
  
  await prisma.$disconnect();
}

verify();
