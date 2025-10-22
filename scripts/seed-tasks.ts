// scripts/seed-tasks.ts
// Advanced seeding script for adding more tasks

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdvancedTasks() {
  console.log('🌱 Seeding advanced tasks...');

  // Get existing concepts
  const htmlBasics = await prisma.concept.findUnique({ where: { name: 'html-basics' } });
  const cssBasics = await prisma.concept.findUnique({ where: { name: 'css-basics' } });
  const jsBasics = await prisma.concept.findUnique({ where: { name: 'js-basics' } });

  if (!htmlBasics || !cssBasics || !jsBasics) {
    console.error('❌ Base concepts not found. Run main seed first.');
    process.exit(1);
  }

  // Advanced HTML task
  await prisma.task.upsert({
    where: { id: 'html-lists-1' },
    update: {},
    create: {
      id: 'html-lists-1',
      title: 'Create a Todo List Structure',
      description: 'Build an unordered list with at least 3 todo items',
      prompt: 'Create an HTML page with a heading "My Todos" and an unordered list with 3 todo items.',
      difficulty: 2,
      conceptIds: [htmlBasics.id],
      prerequisites: ['html-basics-1'],
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
</html>`
      },
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
</html>`
      },
      tests: [
        {
          id: 'has-ul',
          code: 'document.querySelector("ul") !== null',
          successMessage: 'Great! You added an unordered list.',
          failureMessage: 'Add a <ul> element for your list.'
        },
        {
          id: 'has-three-items',
          code: 'document.querySelectorAll("li").length >= 3',
          successMessage: 'Perfect! You have at least 3 list items.',
          failureMessage: 'Add at least 3 <li> elements inside your <ul>.'
        }
      ],
      hints: [
        {
          level: 1,
          text: 'HTML lists use <ul> for unordered lists and <li> for each item.'
        },
        {
          level: 2,
          text: 'Wrap multiple <li> elements inside a <ul> tag.'
        },
        {
          level: 3,
          text: '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>'
        }
      ]
    }
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