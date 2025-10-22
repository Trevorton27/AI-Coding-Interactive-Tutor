// apps/web/app/api/eval/route.ts
import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export async function POST(req: NextRequest) {
  try {
    const { task, files } = await req.json();

    if (!task || !files) {
      return NextResponse.json(
        { error: "Missing task or files" },
        { status: 400 }
      );
    }

    // Build HTML document from files
    const htmlContent = buildHTMLDocument(files);

    // Create virtual DOM
    const dom = new JSDOM(htmlContent, {
      runScripts: "dangerously",
      resources: "usable"
    });

    const { window } = dom;
    const { document } = window;

    // Wait for scripts to execute
    await new Promise(resolve => setTimeout(resolve, 100));

    // Run tests
    const results = {
      passed: true,
      passedIds: [] as string[],
      failedIds: [] as string[],
      messages: {} as Record<string, string>
    };

    for (const test of task.tests || []) {
      try {
        // Evaluate test code in the context of the document
        const testFn = new Function("document", "window", `return ${test.code}`);
        const result = testFn(document, window);

        if (result) {
          results.passedIds.push(test.id);
          results.messages[test.id] = test.successMessage || "Test passed";
        } else {
          results.passed = false;
          results.failedIds.push(test.id);
          results.messages[test.id] = test.failureMessage || "Test failed";
        }
      } catch (error) {
        results.passed = false;
        results.failedIds.push(test.id);
        results.messages[test.id] = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    }

    // Clean up
    window.close();

    return NextResponse.json(results);

  } catch (error) {
    console.error("Eval API error:", error);
    return NextResponse.json(
      {
        passed: false,
        passedIds: [],
        failedIds: [],
        messages: { "error": "Failed to run tests" }
      },
      { status: 500 }
    );
  }
}

function buildHTMLDocument(files: Record<string, string>): string {
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