#!/usr/bin/env node
/**
 * Validate All Solutions Script
 *
 * Tests all 120 challenge solutions against their test requirements
 * Generates a comprehensive report showing pass/fail status
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Load tasks
const tasksPath = path.join(__dirname, '../apps/web/data/tasks.levels.json');
const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

/**
 * Build HTML document from files (matches eval API logic)
 */
function buildHTMLDocument(files) {
  let htmlContent = files["index.html"] || files["main.html"] || "";

  if (!htmlContent) {
    htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
  }

  // Inject CSS
  const cssFiles = Object.keys(files).filter(p => p.endsWith(".css"));
  let styles = "";
  for (const cssPath of cssFiles) {
    styles += `<style>\n${files[cssPath]}\n</style>\n`;
  }

  // Inject JS (strip TypeScript for simple eval)
  const jsFiles = Object.keys(files).filter(p =>
    p.endsWith(".js") || p.endsWith(".ts")
  );
  let scripts = "";
  for (const jsPath of jsFiles) {
    const jsCode = files[jsPath]
      .replace(/: \w+/g, "")
      .replace(/interface \w+ \{[^}]+\}/g, "");

    scripts += `<script>\n${jsCode}\n</script>\n`;
  }

  htmlContent = htmlContent.replace("</head>", `${styles}</head>`);
  htmlContent = htmlContent.replace("</body>", `${scripts}</body>`);

  return htmlContent;
}

/**
 * Run tests for a single task
 */
async function runTests(task, files) {
  // Build HTML document from files
  const htmlContent = buildHTMLDocument(files);

  // Create virtual DOM
  const virtualConsole = new (require('jsdom').VirtualConsole)();
  virtualConsole.on("error", () => {}); // Suppress JSDOM errors

  const dom = new JSDOM(htmlContent, {
    runScripts: "dangerously",
    resources: "usable",
    url: "http://localhost",
    virtualConsole
  });

  const { window } = dom;
  const { document } = window;

  // Wait for scripts to execute
  await new Promise(resolve => setTimeout(resolve, 100));

  // Run tests
  const results = {
    passed: true,
    passedIds: [],
    failedIds: [],
    messages: {},
    errors: {}
  };

  for (const test of task.tests || []) {
    try {
      // Evaluate test code in the context of the document
      const testFn = new Function("document", "window", `return ${test.code}`);
      const result = testFn(document, window);

      if (result) {
        results.passedIds.push(test.id);
        results.messages[test.id] = test.label || "Test passed";
      } else {
        results.passed = false;
        results.failedIds.push(test.id);
        results.messages[test.id] = test.label || "Test failed";
      }
    } catch (error) {
      results.passed = false;
      results.failedIds.push(test.id);
      results.messages[test.id] = `Error: ${error.message}`;
      results.errors[test.id] = error.stack;
    }
  }

  // Clean up
  window.close();

  return results;
}

/**
 * Validate all tasks
 */
async function validateAll() {
  console.log('🧪 Validating All Solutions Against Tests\n');
  console.log('='.repeat(80));
  console.log('\n');

  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    noSolution: 0,
    byCategory: {},
    failures: []
  };

  for (const task of tasks) {
    summary.total++;

    // Initialize category stats
    const category = task.category || 'Unknown';
    if (!summary.byCategory[category]) {
      summary.byCategory[category] = {
        total: 0,
        passed: 0,
        failed: 0,
        noSolution: 0
      };
    }
    summary.byCategory[category].total++;

    // Check if solution exists
    if (!task.solution) {
      summary.noSolution++;
      summary.byCategory[category].noSolution++;
      console.log(`⚠️  ${task.id}: No solution provided`);
      continue;
    }

    // Run tests
    try {
      const results = await runTests(task, task.solution);

      if (results.passed) {
        summary.passed++;
        summary.byCategory[category].passed++;
        console.log(`✅ ${task.id}: PASSED (${results.passedIds.length}/${task.tests.length} tests)`);
      } else {
        summary.failed++;
        summary.byCategory[category].failed++;
        console.log(`❌ ${task.id}: FAILED (${results.passedIds.length}/${task.tests.length} tests passed)`);
        console.log(`   Failed tests: ${results.failedIds.join(', ')}`);

        summary.failures.push({
          id: task.id,
          category: category,
          title: task.title,
          failedTests: results.failedIds,
          messages: results.messages,
          errors: results.errors
        });
      }
    } catch (error) {
      summary.failed++;
      summary.byCategory[category].failed++;
      console.log(`💥 ${task.id}: ERROR - ${error.message}`);

      summary.failures.push({
        id: task.id,
        category: category,
        title: task.title,
        error: error.message,
        stack: error.stack
      });
    }
  }

  // Print summary
  console.log('\n');
  console.log('='.repeat(80));
  console.log('\n📊 SUMMARY\n');
  console.log(`Total Tasks: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed} (${(summary.passed/summary.total*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${summary.failed} (${(summary.failed/summary.total*100).toFixed(1)}%)`);
  console.log(`⚠️  No Solution: ${summary.noSolution} (${(summary.noSolution/summary.total*100).toFixed(1)}%)`);

  console.log('\n📁 BY CATEGORY\n');
  for (const [category, stats] of Object.entries(summary.byCategory)) {
    const passRate = stats.total > 0 ? (stats.passed/stats.total*100).toFixed(1) : 0;
    console.log(`${category}:`);
    console.log(`  Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed} | Pass Rate: ${passRate}%`);
  }

  // Print failures
  if (summary.failures.length > 0) {
    console.log('\n❌ FAILURES\n');
    for (const failure of summary.failures) {
      console.log(`\n${failure.id} - ${failure.title}`);
      console.log(`Category: ${failure.category}`);

      if (failure.error) {
        console.log(`Error: ${failure.error}`);
      } else {
        console.log(`Failed Tests: ${failure.failedTests.join(', ')}`);
        for (const [testId, message] of Object.entries(failure.messages)) {
          if (failure.failedTests.includes(testId)) {
            console.log(`  - ${testId}: ${message}`);
          }
        }
      }
    }
  }

  // Save report to file
  const reportPath = path.join(__dirname, '../TEST_VALIDATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  console.log(`\n📝 Detailed report saved to: ${reportPath}`);

  // Return exit code based on results
  return summary.failed === 0 ? 0 : 1;
}

// Run validation
validateAll()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
