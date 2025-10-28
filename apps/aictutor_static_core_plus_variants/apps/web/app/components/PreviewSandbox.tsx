// apps/web/app/components/PreviewSandbox.tsx
"use client";

import { useRef, useEffect, useState } from "react";

interface PreviewSandboxProps {
  files: Record<string, string>;
  refreshTrigger?: number; // Change this to force refresh
}

export function PreviewSandbox({ files, refreshTrigger }: PreviewSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    renderPreview();
  }, [files, refreshTrigger]);

  const renderPreview = () => {
    try {
      setError(null);
      const html = buildHTMLDocument(files);
      
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        iframe.srcdoc = html;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview error");
    }
  };

  const buildHTMLDocument = (files: Record<string, string>): string => {
    // Find main HTML file or create one
    let htmlContent = files["index.html"] || files["main.html"] || "";
    
    // If no HTML file, create a basic one
    if (!htmlContent) {
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
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

    // Inject JS
    const jsFiles = Object.keys(files).filter(p => 
      p.endsWith(".js") || p.endsWith(".ts")
    );
    let scripts = "";
    for (const jsPath of jsFiles) {
      // Strip TypeScript types for basic preview (real solution would transpile)
      const jsCode = files[jsPath]
        .replace(/: \w+/g, "") // Remove type annotations
        .replace(/interface \w+ \{[^}]+\}/g, ""); // Remove interfaces
      
      scripts += `<script>\n${jsCode}\n</script>\n`;
    }

    // Insert before closing tags
    htmlContent = htmlContent.replace("</head>", `${styles}</head>`);
    htmlContent = htmlContent.replace("</body>", `${scripts}</body>`);

    // Add console capture for errors
    const consoleCapture = `
<script>
  window.addEventListener('error', (e) => {
    console.error('Runtime error:', e.message);
  });
  
  // Capture console for debugging
  const originalLog = console.log;
  console.log = function(...args) {
    originalLog.apply(console, args);
  };
</script>`;
    
    htmlContent = htmlContent.replace("</head>", `${consoleCapture}</head>`);

    return htmlContent;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-100 border-b border-gray-300 px-4 py-2">
        <span className="text-sm font-medium text-gray-700">Preview</span>
        <button
          onClick={renderPreview}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Preview Frame */}
      <div className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          title="preview"
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}