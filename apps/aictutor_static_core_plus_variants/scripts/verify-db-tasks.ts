import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  const tasks = await prisma.task.findMany({
    select: {
      id: true,
      title: true,
      difficulty: true,
      description: true,
      realWorldContext: true,
      alternativeSolutions: true,
    },
  });

  console.log('📊 Database Task Summary\n');
  console.log(`Total tasks in DB: ${tasks.length}`);

  console.log('\nTasks by difficulty:');
  const byDiff = tasks.reduce((acc: Record<number, number>, t) => {
    acc[t.difficulty] = (acc[t.difficulty] || 0) + 1;
    return acc;
  }, {});
  Object.keys(byDiff).sort().forEach((d) => {
    console.log(`  Level ${d}: ${byDiff[Number(d)]} tasks`);
  });

  const withDesc = tasks.filter((t) => t.description && t.description.length > 100);
  const withContext = tasks.filter((t) => t.realWorldContext && t.realWorldContext.length > 100);
  const withSolutions = tasks.filter(
    (t) => t.alternativeSolutions && Array.isArray(t.alternativeSolutions) && (t.alternativeSolutions as any[]).length >= 2
  );

  console.log('\n✅ Enhancement Status:');
  console.log(`  Tasks with detailed descriptions: ${withDesc.length}/${tasks.length}`);
  console.log(`  Tasks with real-world context: ${withContext.length}/${tasks.length}`);
  console.log(`  Tasks with 2+ solutions: ${withSolutions.length}/${tasks.length}`);

  // Show sample
  if (tasks.length > 0) {
    const sample = tasks[0];
    console.log(`\n📝 Sample Task: ${sample.title}`);
    console.log(`  Description length: ${sample.description?.length || 0} chars`);
    console.log(`  Context length: ${sample.realWorldContext?.length || 0} chars`);
    console.log(`  Solutions: ${Array.isArray(sample.alternativeSolutions) ? (sample.alternativeSolutions as any[]).length : 0}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
