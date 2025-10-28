// Script to replace the first 40 HTML challenges in tasks.levels.json
// with the new challenges from html_challenges_40.json

const fs = require('fs');
const path = require('path');

// Read both files
const tasksPath = path.join(__dirname, '../data/tasks.levels.json');
const htmlChallengesPath = path.join(__dirname, '../data/html_challenges_40.json');

console.log('Reading tasks.levels.json...');
const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
console.log(`Found ${tasks.length} total tasks`);

console.log('Reading html_challenges_40.json...');
const htmlChallenges = JSON.parse(fs.readFileSync(htmlChallengesPath, 'utf-8'));
console.log(`Found ${htmlChallenges.length} new HTML challenges`);

// Filter out existing HTML challenges
const nonHtmlTasks = tasks.filter(t => t.category !== 'html');
console.log(`Found ${tasks.length - nonHtmlTasks.length} existing HTML challenges to replace`);
console.log(`Found ${nonHtmlTasks.length} non-HTML tasks to keep`);

// Transform new HTML challenges to match the expected schema
const transformedChallenges = htmlChallenges.map((challenge, index) => {
  // Transform tests to match the old format
  const tests = challenge.tests.map(test => ({
    id: test.id,
    code: test.code,
    label: test.description || `Test ${test.id}`
  }));

  // Use the first solution as the main solution
  const solution = challenge.solutions && challenge.solutions.length > 0
    ? challenge.solutions[0].files
    : challenge.scaffold;

  // Build alternative solutions from the remaining solutions
  const alternativeSolutions = challenge.solutions && challenge.solutions.length > 1
    ? challenge.solutions.slice(1).map(sol => ({
        label: sol.id || 'Alternative',
        files: sol.files,
        explanation: sol.explanation || 'An alternative solution approach.'
      }))
    : [];

  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty,
    category: challenge.category,
    scaffold: challenge.scaffold,
    tests: tests,
    solution: solution,
    hints: challenge.hints || [],
    alternativeSolutions: alternativeSolutions,
    realWorldContext: challenge.realWorldContext || `Learn ${challenge.title.toLowerCase()} - a fundamental web development concept used in modern websites.`
  };
});

// Combine: new HTML challenges + existing non-HTML tasks
const updatedTasks = [...transformedChallenges, ...nonHtmlTasks];

// Sort to maintain order: HTML (l1), CSS (l2), JS (l3), Advanced (l4)
updatedTasks.sort((a, b) => {
  const categoryOrder = { html: 1, css: 2, javascript: 3, advanced: 4 };
  const catA = categoryOrder[a.category] || 999;
  const catB = categoryOrder[b.category] || 999;

  if (catA !== catB) return catA - catB;
  return a.id.localeCompare(b.id);
});

console.log(`\nNew tasks.levels.json will have ${updatedTasks.length} tasks:`);
const byCategory = updatedTasks.reduce((acc, t) => {
  acc[t.category] = (acc[t.category] || 0) + 1;
  return acc;
}, {});
console.log('By category:', byCategory);

// Backup the original file
const backupPath = tasksPath + '.backup';
console.log(`\nCreating backup at ${backupPath}...`);
fs.copyFileSync(tasksPath, backupPath);

// Write the updated tasks
console.log(`Writing updated tasks to ${tasksPath}...`);
fs.writeFileSync(tasksPath, JSON.stringify(updatedTasks, null, 2), 'utf-8');

console.log('\n✅ Successfully merged HTML challenges!');
console.log(`   - Replaced ${tasks.length - nonHtmlTasks.length} old HTML challenges`);
console.log(`   - Added ${transformedChallenges.length} new HTML challenges`);
console.log(`   - Total tasks: ${updatedTasks.length}`);
console.log(`   - Backup saved to: ${backupPath}`);
