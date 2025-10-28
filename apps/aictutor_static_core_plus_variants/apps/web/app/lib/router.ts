// apps/web/app/lib/router.ts
export function chooseModel(task: "small" | "code" | "grading" | "quiz"): string {
  const fast = process.env.MODEL_FAST || "claude-3-haiku-20240307";
  const smart = process.env.MODEL_SMART || "claude-3-5-sonnet-202410";
  switch (task) {
    case "small": return fast;
    case "code":
    case "grading":
    case "quiz":
    default: return smart;
  }
}
