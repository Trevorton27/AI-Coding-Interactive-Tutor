// apps/web/app/components/CodeEditor.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  files: Record<string, string>;
  onFilesChange: (files: Record<string, string>) => void;
  activePath?: string;
  onActivePathChange?: (path: string) => void;
}

export function CodeEditor({
  files,
  onFilesChange,
  activePath,
  onActivePathChange
}: CodeEditorProps) {
  const [openPath, setOpenPath] = useState<string>(
    activePath || Object.keys(files)[0] || ""
  );
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (activePath && activePath !== openPath) {
      setOpenPath(activePath);
    }
  }, [activePath]);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && openPath) {
      onFilesChange({ ...files, [openPath]: value });
    }
  };

  const switchFile = (path: string) => {
    setOpenPath(path);
    onActivePathChange?.(path);
  };

  const fileList = Object.keys(files).sort();

  // Detect language from file extension
  const getLanguage = (path: string) => {
    if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
    if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".json")) return "json";
    return "plaintext";
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* File Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {fileList.map(path => (
          <button
            key={path}
            onClick={() => switchFile(path)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-r border-gray-700 ${
              openPath === path
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
            }`}
          >
            {path.split("/").pop()}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1">
        {openPath && files[openPath] !== undefined ? (
          <Editor
            height="100%"
            language={getLanguage(openPath)}
            value={files[openPath]}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on"
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No file selected
          </div>
        )}
      </div>
    </div>
  );
}