// apps/web/prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create concepts
  const htmlBasics = await prisma.concept.upsert({
    where: { name: 'html-basics' },
    update: {},
    create: {
      name: 'html-basics',
      description: 'Basic HTML structure and elements',
      difficulty: 1,
      prerequisites: []
    }
  });

  const cssBasics = await prisma.concept.upsert({
    where: { name: 'css-basics' },
    update: {},
    create: {
      name: 'css-basics',
      description: 'CSS styling and selectors',
      difficulty: 1,
      prerequisites: ['html-basics']
    }
  });

  const jsBasics = await prisma.concept.upsert({
    where: { name: 'js-basics' },
    update: {},
    create: {
      name: 'js-basics',
      description: 'JavaScript fundamentals',
      difficulty: 2,
      prerequisites: ['html-basics']
    }
  });

  const domManipulation = await prisma.concept.upsert({
    where: { name: 'dom-manipulation' },
    update: {},
    create: {
      name: 'dom-manipulation',
      description: 'DOM querying and manipulation',
      difficulty: 2,
      prerequisites: ['html-basics', 'js-basics']
    }
  });

  const events = await prisma.concept.upsert({
    where: { name: 'dom-events' },
    update: {},
    create: {
      name: 'dom-events',
      description: 'Event handling and listeners',
      difficulty: 3,
      prerequisites: ['js-basics', 'dom-manipulation']
    }
  });

  console.log('✅ Created concepts');

  // 2. Create initial tasks
  await prisma.task.upsert({
    where: { id: 'html-basics-1' },
    update: {},
    create: {
      id: 'html-basics-1',
      title: 'Create Your First Webpage',
      description: 'Build a simple HTML page with a heading and paragraph',
      prompt: 'Create an HTML page that displays a heading saying "Hello World" and a paragraph introducing yourself.',
      difficulty: 1,
      conceptIds: [htmlBasics.id],
      prerequisites: [],
      scaffold: {
        'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My First Page</title>
</head>
<body>
  <!-- Add your code here -->
</body>
</html>`
      },
      solution: {
        'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My First Page</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>My name is Alex and I'm learning web development!</p>
</body>
</html>`
      },
      tests: [
        {
          id: 'has-h1',
          code: 'document.querySelector("h1") !== null',
          successMessage: 'Great! You added a heading.',
          failureMessage: 'Add an <h1> element to your page.'
        },
        {
          id: 'h1-has-text',
          code: 'document.querySelector("h1")?.textContent.trim().length > 0',
          successMessage: 'Your heading has text!',
          failureMessage: 'Make sure your <h1> has some text inside.'
        },
        {
          id: 'has-paragraph',
          code: 'document.querySelector("p") !== null',
          successMessage: 'Perfect! You added a paragraph.',
          failureMessage: 'Add a <p> element to your page.'
        }
      ],
      hints: [
        {
          level: 1,
          text: 'Think about what HTML element creates a large heading. It starts with <h...'
        },
        {
          level: 2,
          text: 'Use <h1> for your heading and <p> for your paragraph. Both go inside the <body> tag.'
        },
        {
          level: 3,
          text: 'Add these lines inside <body>:\n<h1>Hello World</h1>\n<p>Your introduction here</p>'
        }
      ]
    }
  });

  await prisma.task.upsert({
    where: { id: 'css-basics-1' },
    update: {},
    create: {
      id: 'css-basics-1',
      title: 'Style Your Page',
      description: 'Add colors and fonts to your webpage',
      prompt: 'Style your heading with a blue color and your paragraph with a larger font size.',
      difficulty: 1,
      conceptIds: [cssBasics.id],
      prerequisites: ['html-basics-1'],
      scaffold: {
        'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Styled Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello World</h1>
  <p>Welcome to my styled page!</p>
</body>
</html>`,
        'style.css': `/* Add your styles here */
`
      },
      solution: {
        'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Styled Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello World</h1>
  <p>Welcome to my styled page!</p>
</body>
</html>`,
        'style.css': `h1 {
  color: blue;
}

p {
  font-size: 18px;
}`
      },
      tests: [
        {
          id: 'h1-color-blue',
          code: 'window.getComputedStyle(document.querySelector("h1")).color === "rgb(0, 0, 255)"',
          successMessage: 'Nice! Your heading is blue.',
          failureMessage: 'Set the h1 color to blue in your CSS.'
        },
        {
          id: 'p-font-size',
          code: 'parseInt(window.getComputedStyle(document.querySelector("p")).fontSize) >= 18',
          successMessage: 'Perfect! Your paragraph font is larger.',
          failureMessage: 'Increase the paragraph font-size to at least 18px.'
        }
      ],
      hints: [
        {
          level: 1,
          text: 'CSS uses selectors to target elements. What selector targets all h1 elements?'
        },
        {
          level: 2,
          text: 'Use h1 { color: blue; } and p { font-size: 18px; } in your CSS file.'
        },
        {
          level: 3,
          text: 'In style.css, add:\nh1 { color: blue; }\np { font-size: 18px; }'
        }
      ]
    }
  });

  await prisma.task.upsert({
    where: { id: 'js-basics-1' },
    update: {},
    create: {
      id: 'js-basics-1',
      title: 'Make a Button Click Counter',
      description: 'Count button clicks and display the number',
      prompt: 'Create a button that counts how many times it has been clicked and displays the count.',
      difficulty: 2,
      conceptIds: [jsBasics.id, domManipulation.id, events.id],
      prerequisites: ['html-basics-1'],
      scaffold: {
        'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Click Counter</title>
</head>
<body>
  <button id="clickBtn">Click me!</button>
  <p id="count">Clicks: 0</p>
  <script src="script.js"></script>
</body>
</html>`,
        'script.js': `// Add your JavaScript here
`
      },
      solution: {
        'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Click Counter</title>
</head>
<body>
  <button id="clickBtn">Click me!</button>
  <p id="count">Clicks: 0</p>
  <script src="script.js"></script>
</body>
</html>`,
        'script.js': `let count = 0;
const button = document.getElementById('clickBtn');
const countDisplay = document.getElementById('count');

button.addEventListener('click', () => {
  count++;
  countDisplay.textContent = 'Clicks: ' + count;
});`
      },
      tests: [
        {
          id: 'button-exists',
          code: 'document.getElementById("clickBtn") !== null',
          successMessage: 'Button found!',
          failureMessage: 'Make sure you have a button with id="clickBtn".'
        },
        {
          id: 'count-display-exists',
          code: 'document.getElementById("count") !== null',
          successMessage: 'Count display found!',
          failureMessage: 'Make sure you have an element with id="count".'
        },
        {
          id: 'click-increments',
          code: `(() => {
            const btn = document.getElementById("clickBtn");
            const initial = document.getElementById("count").textContent;
            btn.click();
            const after = document.getElementById("count").textContent;
            return initial !== after;
          })()`,
          successMessage: 'Clicks update the count!',
          failureMessage: 'Make sure clicking the button updates the count display.'
        }
      ],
      hints: [
        {
          level: 1,
          text: 'You need a variable to store the count and an event listener on the button.'
        },
        {
          level: 2,
          text: 'Use let count = 0; then add a click event listener that increments count and updates the text.'
        },
        {
          level: 3,
          text: 'button.addEventListener("click", () => { count++; countDisplay.textContent = "Clicks: " + count; });'
        }
      ]
    }
  });

  console.log('✅ Created tasks');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });