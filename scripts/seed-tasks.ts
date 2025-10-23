// scripts/seed-tasks.ts
// Advanced seeding script for adding more tasks

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdvancedTasks() {
  console.log('🌱 Seeding advanced tasks...');

  // Lookup base concepts by unique "name"
  const [htmlBasics, cssBasics, jsBasics] = await Promise.all([
    prisma.concept.findUnique({ where: { name: 'html-basics' } }),
    prisma.concept.findUnique({ where: { name: 'css-basics' } }),
    prisma.concept.findUnique({ where: { name: 'js-basics' } }),
  ]);

  if (!htmlBasics || !cssBasics || !jsBasics) {
    console.error('❌ Base concepts not found. Run main seed first.');
    process.exit(1);
  }

  await prisma.task.upsert({
    where: { id: 'html-lists-1' },
    update: {},
    create: {
      id: 'html-lists-1',
      title: 'Create a Todo List Structure',
      description: 'Build an unordered list with at least 3 todo items',
      prompt:
        'Create an HTML page with a heading "My Todos" and an unordered list with 3 todo items.',
      difficulty: 2,

      // String[] column
      prerequisites: ['html-basics-1'],

      // Use the explicit join model via nested write
      concepts: {
        // either direct FK…
        // create: [{ conceptId: htmlBasics.id }],
        // …or connect through the related model:
        create: [{ concept: { connect: { id: htmlBasics.id } } }],
      },

      // JSON columns — type-safe inputs
      scaffold: {
        'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Todo List</title>
</head>
<body>
  <h1>My Todos</h1>
  <!-- Add your list here -->
</body>
</html>`,
      } as Prisma.InputJsonObject,

      solution: {
        'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Todo List</title>
</head>
<body>
  <h1>My Todos</h1>
  <ul>
    <li>Learn HTML</li>
    <li>Practice CSS</li>
    <li>Build projects</li>
  </ul>
</body>
</html>`,
      } as Prisma.InputJsonObject,

      tests: [
        {
          id: 'has-ul',
          code: 'document.querySelector("ul") !== null',
          successMsg: 'Great! You added an unordered list.',
          failureMsg: 'Add a <ul> element for your list.',
        },
        {
          id: 'has-three-items',
          code: 'document.querySelectorAll("li").length >= 3',
          successMsg: 'Perfect! You have at least 3 list items.',
          failureMsg: 'Add at least 3 <li> elements inside your <ul>.',
        },
      ] as Prisma.InputJsonValue,

      hints: [
        { level: 1, text: 'HTML lists use <ul> for unordered lists and <li> for each item.' },
        { level: 2, text: 'Wrap multiple <li> elements inside a <ul> tag.' },
        { level: 3, text: '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>' },
      ] as Prisma.InputJsonValue,
    },
  });

  console.log('✅ Advanced tasks seeded');
}

seedAdvancedTasks()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
