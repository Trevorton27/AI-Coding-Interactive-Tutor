# Challenges Module – UI hook

To render the Hint / Solution / Try-again panel on the Learn page, add:

```tsx
// apps/web/app/learn/page.tsx (near top)
import { ChallengeHelper } from "../components/ChallengeHelper";

// inside component, after you know the current challenge slug and you have functions to get/apply files:
{currentTask?.slug && (
  <ChallengeHelper
    slug={currentTask.slug}
    getFiles={() => ({
      html: editorFiles["index.html"],
      css: editorFiles["styles.css"],
      js: editorFiles["main.js"],
    })}
    lastTestResult={testResult}
    applyFiles={async (files) => {
      // merge into editor state then re-run tests (your existing helpers)
      setEditorFiles(prev => ({ ...prev, ...files }));
      await runTests();
    }}
  />
)}
