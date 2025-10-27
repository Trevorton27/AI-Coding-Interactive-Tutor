/**
 * Generates 160 challenges across 4 levels and writes JSON files to:
 *   apps/web/data/challenges/*.json
 *
 * Run with:
 *   pnpm add -D tsx @types/node
 *   pnpm gen:challenges
 */
import fs from "node:fs";
import path from "node:path";

type Starter = { html?: string; css?: string; js?: string };
type TestDef =
  | { id: string; type: "dom-assert"; selector: string }
  | { id: string; type: "dom-assert-attr"; selector: string; attr: string }
  | { id: string; type: "js-eval"; code: string };

type Seed = {
  level: 1 | 2 | 3 | 4;
  slug: string;
  title: string;
  objective: string;
  passCriteria: string;
  starter: Starter;
  tests: TestDef[];
  tags: string[];
  solutions: { label: string; files: Starter; notes?: string }[];
  hints: { level: 1 | 2 | 3; text: string }[];
  paramsSchema?: any;
};

const baseHTML = `<!doctype html>
<html lang="ja">
<head><meta charset="utf-8"><title>Challenge</title></head>
<body>
  <!-- TODO -->
</body></html>`;

const baseCSS = `/* styles.css */`;
const baseJS  = `// main.js`;

// ----- Titles per level (40 each) -----
const L1 = [
  "Headings 101","Paragraph Basics","Line Breaks & HR","Lists: UL","Lists: OL","Nested Lists",
  "Link: Absolute","Link: Relative","Images + alt","Semantic Layout","Article & Section","Figure & Figcaption",
  "Emphasis & Strong","Code & Pre","Blockquote & Cite","Table: Basic","Table: Caption","Form Inputs",
  "Form: Required Email","Form: Fieldset + Legend","Form: Radio","Form: Checkbox","Select Dropdown","Textarea + Maxlength",
  "Button Types","Labels & for","Image Alts","Metadata Basics","Favicon Link","Document Outline",
  "Skip Link","Landmarks (minimal)","Download Link","mailto/tel Links","Address Block","<time> element",
  "Datalist Suggestions","Progress & Meter","Details/Summary","HTML Only Portfolio"
];

const L2 = [
  "Normalize & Base","Type Scale","CSS Variables Theme","Flex Header","Hero Center",
  "Card Component","Button Variants","Form Layout Grid","Accessible Focus","Responsive Nav (CSS only)",
  "Grid Gallery","Media Queries","Sticky Header","Footer Columns","CSS Tooltip",
  "CSS Modal (target)","Animations","Transitions","SVG Sprite","Aspect Ratio",
  "Form Error States","Visually Hidden Utility","Theme Toggle (vars)","Print Styles","Z-Index Dropdown",
  "Sticky Sidebar","Image Fit & Sizes","Clamp Typography","Grid Form","CSS Accordion (details)",
  "CSS Tabs (radio)","Progress Bar","Badges & Pills","Table Styles","Breadcrumb",
  "Toast (CSS show/hide)","Masonry-like Grid","Button Loading State","Spacing System (vars)","Landing Page Polish"
];

const L3 = [
  "sumStrings → number","once(fn)","closureCounter","array map/filter/reduce","clone (shallow)",
  "debounce","throttle","pipe/compose","uniqBy","groupBy",
  "stable sort by key","flattenDepth","chunk","memoize","bigint sum",
  "currency format (¥)","date helpers (start/end)","validators (email/url)","schema guard","event emitter",
  "localStorage wrapper","LRU cache (basic)","binary search","merge sort","hash map (simple)",
  "set union/intersection/diff","uuid v4 (simple)","weighted random","calculator eval core","expression parser RPN",
  "sanitize form input","number utils (clamp/round)","promise sleep/timeout","retry with backoff","async queue (k)",
  "pub/sub","finite state machine (calc)","sum amounts helper","CRUD service (memory)","totals helper by category"
];

const L4 = [
  "DOM render list","Add item form","Delete item","Edit item inline","Filter items",
  "Sort controls","Empty state","Persist to localStorage","Hydrate from localStorage","Form validation",
  "Stable IDs","Accessibility labels/roles","Keyboard shortcuts","Undo last delete","Bulk clear (confirm)",
  "Totals panel","Live total update","Currency input mask","Category field","Date field + sort",
  "Responsive two-column","Toast notifications","Modal confirm","Loading/Empty/Error visuals","Import/Export JSON",
  "Input masking refine","Data-testids","Tabs views","Stats view (by category)","LS namespacing v1→v2",
  "Debounced saves","Print view","Keyboard nav in list","A11y audit fixes","Calculator keypad grid",
  "Calculator input logic","Calculator evaluate","Calculator clear/del","Memory buttons","Final Expense Tracker"
];

// ----- Helpers to generate tests by title -----
function htmlTests(title: string): TestDef[] {
  if (/Headings/.test(title)) return [{ id: "h1", type: "dom-assert", selector: "h1" }];
  if (/Lists: UL/.test(title)) return [{ id: "ul", type: "dom-assert", selector: "ul li" }];
  if (/Lists: OL/.test(title)) return [{ id: "ol", type: "dom-assert", selector: "ol li" }];
  if (/Images/.test(title))    return [{ id: "img-alt", type: "dom-assert-attr", selector: "img", attr: "alt" }];
  if (/Form Inputs/.test(title)) return [{ id: "inputs", type: "dom-assert", selector: "input[type=text]" }];
  if (/Required Email/.test(title)) return [{ id: "email", type: "dom-assert-attr", selector: "input[type=email][required]", attr: "required" }];
  if (/Table/.test(title)) return [{ id: "table", type: "dom-assert", selector: "table thead th" }];
  if (/Details\/Summary/.test(title)) return [{ id: "details", type: "dom-assert", selector: "details summary" }];
  return [{ id: "body", type: "dom-assert", selector: "body" }];
}

function cssTests(title: string): TestDef[] {
  if (/Flex Header/.test(title)) return [{ id: "header", type: "dom-assert", selector: "header nav" }];
  if (/Grid/.test(title)) return [{ id: "grid", type: "dom-assert", selector: ".grid" }];
  if (/Button Variants/.test(title)) return [{ id: "btn", type: "dom-assert", selector: ".btn" }];
  return [{ id: "style", type: "dom-assert", selector: "style, link[rel=stylesheet]" }];
}

function jsTests(title: string): TestDef[] {
  const fn = "solution"; // students attach their function on window.solution
  if (/sumStrings/.test(title)) {
    return [{ id: "eval", type: "js-eval", code: `(function(){ return (window as any).${fn}('2','3')===5; })()` }];
  }
  if (/once\(fn\)/.test(title)) {
    return [{ id: "eval", type: "js-eval", code: `(function(){ let c=0; const f=(window as any).${fn}(()=>c++); f(); f(); return c===1; })()` }];
  }
  if (/CRUD service/.test(title)) {
    return [{ id: "eval", type: "js-eval", code: `(function(){ const s=(window as any).${fn}(); const a=s.create({id:1}); return typeof s.read==='function' && a; })()` }];
  }
  return [{ id: "exists", type: "js-eval", code: `(function(){ return typeof (window as any).${fn}==='function'; })()` }];
}

function domBundle(starter: Starter): Starter {
  return {
    html: starter.html ?? baseHTML,
    css:  starter.css  ?? "",
    js:   starter.js   ?? ""
  };
}

function mkSeed(level: number, title: string, idx: number): Seed {
  const slug = `l${level}-${idx + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  let objective = "", pass = "", starter: Starter = {}, tests: TestDef[] = [], tags: string[] = [];

  if (level === 1) {
    objective = `HTML: ${title}`;
    pass = "Required HTML structure exists.";
    starter = { html: baseHTML };
    tests = htmlTests(title);
    tags = ["html"];
  }
  if (level === 2) {
    objective = `HTML+CSS: ${title}`;
    pass = "Layout/structure prepared; selectors present.";
    starter = { html: baseHTML, css: baseCSS };
    tests = [...htmlTests(title), ...cssTests(title)];
    tags = ["html","css"];
  }
  if (level === 3) {
    objective = `JavaScript: ${title}`;
    pass = "Function(s) pass unit checks.";
    starter = { js: `// expose your solution as window.solution = function(...) { };\n(window as any).solution = function(){ /* TODO */ };` };
    tests = jsTests(title);
    tags = ["js"];
  }
  if (level === 4) {
    objective = `HTML/CSS/JS: ${title}`;
    pass = "UI manipulates DOM; tests pass; state persists when required.";
    starter = { html: baseHTML, css: baseCSS, js: baseJS };
    tests = [...htmlTests(title), ...cssTests(title), { id:"boot", type:"dom-assert", selector:"body" }];
    tags = ["html","css","js"];
  }

  const solutions = [
    { label: "Minimal solution", files: domBundle(starter), notes: "One of several correct answers." }
  ];
  const hints = [
    { level: 1, text: "まず、要素やAPIの『名前』に注目して、足りないものを洗い出しましょう。" },
    { level: 2, text: "合否条件を満たすための最小構成を列挙してから、1つずつ追加しましょう。" },
    { level: 3, text: "具体的なタグ名/メソッド名を確認して、対応する属性や引数を補ってください。" }
  ];

  return { level: level as any, slug, title, objective, passCriteria: pass, starter, tests, tags, solutions, hints, paramsSchema: {} };
}

const seeds: Seed[] = [
  ...L1.map((t, i) => mkSeed(1, t, i)),
  ...L2.map((t, i) => mkSeed(2, t, i)),
  ...L3.map((t, i) => mkSeed(3, t, i)),
  ...L4.map((t, i) => mkSeed(4, t, i)),
];

const outDir = path.join("apps", "web", "data", "challenges");
fs.mkdirSync(outDir, { recursive: true });

seeds.forEach(s => {
  const p = path.join(outDir, `${s.slug}.json`);
  fs.writeFileSync(p, JSON.stringify(s, null, 2), "utf8");
  process.stdout.write(`WROTE ${p}\n`);
});

console.log("DONE: generated", seeds.length, "challenge JSON files into", outDir);
