#!/usr/bin/env node
/**
 * Script to enhance task descriptions based on test requirements
 * Reads tasks.levels.json and generates meaningful descriptions
 */

const fs = require('fs');
const path = require('path');

const tasksPath = path.join(__dirname, '../apps/web/data/tasks.levels.json');
const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

/**
 * Generate a descriptive task description based on tests
 */
function generateDescription(task) {
  const { category, tests, title } = task;

  // Parse test requirements
  const requirements = tests.map(test => analyzeTest(test, category));

  // Generate description based on category and requirements
  let description = '';

  switch (category) {
    case 'HTML Basics':
      description = generateHTMLDescription(requirements, title);
      break;
    case 'CSS & Layout':
      description = generateCSSDescription(requirements, title);
      break;
    case 'JS DOM':
      description = generateJSDOMDescription(requirements, title);
      break;
    case 'Algorithms':
      description = generateAlgorithmDescription(requirements, title);
      break;
    case 'Async & Modules':
      description = generateAsyncDescription(requirements, title);
      break;
    case 'React Basics':
    case 'React Hooks':
    case 'React Capstone':
      description = generateReactDescription(requirements, title, category);
      break;
    default:
      description = `Complete the requirements: ${requirements.join(', ')}`;
  }

  return description;
}

function analyzeTest(test, category) {
  const code = test.code;

  // HTML element checks
  if (code.includes("querySelector('h1')")) return 'an <h1> heading';
  if (code.includes("querySelector('h2')")) return 'an <h2> heading';
  if (code.includes("querySelector('p')")) return 'a paragraph';
  if (code.includes("querySelector('ul')")) return 'an unordered list';
  if (code.includes("querySelector('ol')")) return 'an ordered list';
  if (code.includes("querySelectorAll('ul li').length>=3")) return 'at least 3 list items';
  if (code.includes("querySelector('a[href")) return 'a link with the correct href';
  if (code.includes("target==='_blank'")) return 'link that opens in a new tab';
  if (code.includes("querySelector('img[alt]')")) return 'an image with alt text';
  if (code.includes("querySelector('table')")) return 'a table';
  if (code.includes("querySelector('form')")) return 'a form';
  if (code.includes("querySelector('input[type=\"text\"]')")) return 'a text input';
  if (code.includes("querySelector('button')")) return 'a button';
  if (code.includes("querySelector('div')")) return 'a div element';
  if (code.includes("querySelector('span')")) return 'a span element';

  // CSS checks
  if (code.includes('getComputedStyle')) {
    if (code.includes('color')) return 'proper text color styling';
    if (code.includes('backgroundColor')) return 'background color styling';
    if (code.includes('fontSize')) return 'font size styling';
    if (code.includes('display')) return 'proper display property';
    if (code.includes('flexbox') || code.includes('flex')) return 'flexbox layout';
    if (code.includes('grid')) return 'CSS grid layout';
  }

  // JavaScript DOM checks
  if (code.includes('addEventListener')) return 'event listener';
  if (code.includes('innerHTML')) return 'dynamic content update';
  if (code.includes('classList')) return 'class manipulation';

  // React checks
  if (code.includes('useState')) return 'useState hook';
  if (code.includes('useEffect')) return 'useEffect hook';
  if (code.includes('props')) return 'component props';

  // Fallback - use test id as hint
  return test.id;
}

function generateHTMLDescription(requirements, title) {
  const intro = [
    'Create an HTML page with',
    'Build a webpage containing',
    'Write HTML markup for',
    'Construct an HTML document with'
  ];

  const reqText = requirements.join(' and ');
  return `${intro[Math.floor(Math.random() * intro.length)]} ${reqText}.`;
}

function generateCSSDescription(requirements, title) {
  return `Style your HTML elements using CSS. Add ${requirements.join(', ')}.`;
}

function generateJSDOMDescription(requirements, title) {
  return `Use JavaScript to manipulate the DOM. Implement ${requirements.join(' and ')}.`;
}

function generateAlgorithmDescription(requirements, title) {
  return `Implement an algorithm to solve this problem. Your solution should ${requirements.join(' and ')}.`;
}

function generateAsyncDescription(requirements, title) {
  return `Work with asynchronous JavaScript. Implement ${requirements.join(' and ')}.`;
}

function generateReactDescription(requirements, title, category) {
  if (category === 'React Capstone') {
    return `Build a complete React application. This capstone project should ${requirements.join(', ')}.`;
  }
  return `Create a React component that uses ${requirements.join(' and ')}.`;
}

// Enhanced descriptions with better test name mappings
function enhanceDescription(task) {
  const testIds = task.tests.map(t => t.id).join(',');
  const testCodes = task.tests.map(t => t.code);

  // Manual mappings for common patterns
  const descriptionMap = {
    // HTML Basics Level 1
    'l1-html-basics-1': 'Create an HTML page with a heading (h1) and a paragraph (p) element.',
    'l1-html-basics-2': 'Build an unordered list (ul) with at least 3 list items (li).',
    'l1-html-basics-3': 'Add a link that opens https://example.com in a new tab.',
    'l1-html-basics-4': 'Insert an image element with alt text for accessibility.',
    'l1-html-basics-5': 'Create a table to display structured data.',
    'l1-html-basics-6': 'Build a form with a text input field.',
    'l1-html-basics-7': 'Add a button element to your page.',
    'l1-html-basics-8': 'Create a div container for organizing content.',
    'l1-html-basics-9': 'Use strong tags to emphasize important text.',
    'l1-html-basics-10': 'Add a span element for inline styling.',
  };

  // Return manual description if exists, otherwise generate
  return descriptionMap[task.id] || generateDescription(task);
}

// Process all tasks
const enhancedTasks = tasks.map(task => {
  const description = enhanceDescription(task);
  return {
    ...task,
    description
  };
});

// Write enhanced tasks back
fs.writeFileSync(tasksPath, JSON.stringify(enhancedTasks, null, 2));
console.log(`✅ Enhanced ${enhancedTasks.length} task descriptions!`);
console.log('Updated file:', tasksPath);
