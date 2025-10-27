"use client";
import { useState } from "react";

export function ChallengeHelper({ slug, getFiles, lastTestResult, applyFiles }:{
  slug: string;
  getFiles: ()=>({html?:string, css?:string, js?:string});
  lastTestResult: any;
  applyFiles: (files: Record<string,string>)=>Promise<void>;
}) {
  const [hint, setHint] = useState<string>("");
  const [hintLevel, setHintLevel] = useState<1|2|3>(1);
  const [busy, setBusy] = useState(false);
  const [solutionIndex, setSolutionIndex] = useState(0);

  async function askHint() {
    setBusy(true);
    const r = await fetch(`/api/v1/challenges/${slug}/hint`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: getFiles(), lastTestResult, level: hintLevel })
    });
    const j = await r.json();
    setHint(j.hintText || "");
    setHintLevel(j.nextLevelSuggested || hintLevel);
    setBusy(false);
  }

  async function revealSolution() {
    setBusy(true);
    const r = await fetch(`/api/v1/challenges/${slug}/solution?index=${solutionIndex}`);
    const j = await r.json();
    if (j?.files) {
      await applyFiles(j.files);
    }
    setBusy(false);
  }

  async function tryAgain() {
    setBusy(true);
    const r = await fetch(`/api/v1/challenges/${slug}/try-again`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ difficulty: "same" }) });
    const v = await r.json();
    if (v?.starter) {
      await applyFiles({
        ...(v.starter.html ? { "index.html": v.starter.html } : {}),
        ...(v.starter.css  ? { "styles.css": v.starter.css } : {}),
        ...(v.starter.js   ? { "main.js": v.starter.js } : {}),
      });
    }
    setBusy(false);
  }

  return (
    <div className="rounded-xl border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <button disabled={busy} className="px-3 py-1 rounded bg-slate-900 text-white" onClick={askHint}>Hint (Lv {hintLevel})</button>
        <button disabled={busy} className="px-3 py-1 rounded bg-emerald-700 text-white" onClick={revealSolution}>Reveal solution</button>
        <select value={solutionIndex} onChange={(e)=>setSolutionIndex(Number(e.target.value))} className="border rounded px-2 py-1">
          <option value={0}>#1</option><option value={1}>#2</option><option value={2}>#3</option>
        </select>
        <button disabled={busy} className="px-3 py-1 rounded bg-indigo-700 text-white" onClick={tryAgain}>Try again</button>
      </div>
      {hint && <div className="text-sm bg-amber-50 border border-amber-200 rounded p-2 whitespace-pre-wrap">{hint}</div>}
    </div>
  );
}
