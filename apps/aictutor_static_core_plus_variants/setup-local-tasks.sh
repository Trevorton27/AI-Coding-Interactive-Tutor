#!/usr/bin/env bash
set -euo pipefail
# Usage: ./setup-local-tasks.sh /abs/path/to/repo /abs/path/to/tasks.levels.120.json
REPO="${1:-}"
TASKS_JSON="${2:-}"
if [[ -z "${REPO}" || -z "${TASKS_JSON}" ]]; then
  echo "Usage: $0 /path/to/repo /path/to/tasks.levels.120.json"
  exit 1
fi
cd "$REPO"
mkdir -p apps/web/data apps/web/app/api/tasks prisma docs

# 1) Copy tasks JSON
cp "$TASKS_JSON" apps/web/data/tasks.levels.json

# 2) Create API route (overwrite if exists)
cat > apps/web/app/api/tasks/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SRC = process.env.TASKS_SOURCE || "local"; // local | db

async function loadLocal(level?: number) {
  const file = path.join(process.cwd(), "apps/web/data/tasks.levels.json");
  const raw = await fs.readFile(file, "utf-8");
  const all = JSON.parse(raw) as any[];
  return typeof level === "number" ? all.filter(t => t.difficulty === level) : all;
}

async function loadDb(level?: number) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const where = level ? { difficulty: level } : {};
    return await prisma.task.findMany({ where, orderBy: { id: "asc" } });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const levelParam = searchParams.get("level");
  const level = levelParam ? parseInt(levelParam) : undefined;
  const limit = parseInt(searchParams.get("limit") || "15");
  const offset = parseInt(searchParams.get("offset") || "0");

  const rows = SRC === "db" ? await loadDb(level) : await loadLocal(level);
  const items = rows.slice(offset, offset + limit);
  return NextResponse.json({ items, total: rows.length });
}
EOF

# 3) Ensure .env.local has toggle
if [[ ! -f apps/web/.env.local ]]; then
  cat > apps/web/.env.local <<'EOF'
TASKS_SOURCE=local   # local | db
DATABASE_URL=postgresql://user:password@localhost:5432/aict
EOF
else
  if ! grep -q "TASKS_SOURCE" apps/web/.env.local; then
    echo "TASKS_SOURCE=local" >> apps/web/.env.local
  fi
fi

# 4) Prisma schema models (append if not present)
if [[ ! -f prisma/schema.prisma ]]; then
  cat > prisma/schema.prisma <<'EOF'
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}
EOF
fi

if ! grep -q "model Task " prisma/schema.prisma; then
  cat >> prisma/schema.prisma <<'EOF'

model Task {
  id          String   @id
  title       String
  description String
  difficulty  Int
  category    String?
  scaffold    Json
  tests       Json
  createdAt   DateTime @default(now())
}

model TaskProgress {
  id          String   @id @default(cuid())
  studentId   String
  taskId      String
  passed      Boolean  @default(false)
  attempts    Int      @default(0)
  updatedAt   DateTime @updatedAt
}
EOF
fi

# 5) Seed script
cat > prisma/seed.ts <<'EOF'
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const file = path.join(process.cwd(), "apps/web/data/tasks.levels.json");
  const raw = await fs.readFile(file, "utf-8");
  const tasks = JSON.parse(raw);
  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {
        title: t.title,
        description: t.description,
        difficulty: t.difficulty || 1,
        category: t.category || null,
        scaffold: t.scaffold,
        tests: t.tests,
      },
      create: {
        id: t.id,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty || 1,
        category: t.category || null,
        scaffold: t.scaffold,
        tests: t.tests,
      }
    });
  }
  console.log(`Seeded ${tasks.length} tasks.`);
}

main().finally(() => prisma.$disconnect());
EOF

# 6) Modify LearnPage to fetch by level (idempotent—only if file exists and patch not applied)
LP="apps/web/app/learn/page.tsx"
if [[ -f "$LP" ]]; then
  if ! grep -q "const \\[difficulty" "$LP"; then
    # Insert difficulty state after title state
    sed -i '' 's/const \\[currentTask, setCurrentTask\\].*/&\n  const [difficulty, setDifficulty] = useState<number>(1);\n  const [taskList, setTaskList] = useState<Task[]>([]);/' "$LP" 2>/dev/null || sed -i 's/const \[currentTask, setCurrentTask\].*/&\n  const [difficulty, setDifficulty] = useState<number>(1);\n  const [taskList, setTaskList] = useState<Task[]>([]);/' "$LP"
  fi

  # Add loader function
  if ! grep -q "async function loadTasksByLevel" "$LP"; then
    cat >> "$LP" <<'EOF'

  async function loadTasksByLevel(level: number) {
    const res = await fetch(`/api/tasks?level=${level}&limit=15`);
    const data = await res.json();
    setTaskList(data.items);
    const first = data.items?.[0];
    if (first) {
      setCurrentTask(first);
      setEditorFiles(first.scaffold);
      setActivePath(Object.keys(first.scaffold)[0] || "index.html");
    }
  }
EOF
  fi

  # Hook level change
  if ! grep -q "useEffect(() => {\\s*loadTasksByLevel" "$LP"; then
    sed -i '' 's/useEffect(() => {\\n\\s*loadInitialTask();\\n\\s*}, \\[\\]);/useEffect(() => { loadInitialTask(); }, []);\n  useEffect(() => { loadTasksByLevel(difficulty); }, [difficulty]);/' "$LP" 2>/dev/null || \
    perl -0777 -pe 's/useEffect\(\s*\(\)\s*=>\s*\{\s*loadInitialTask\(\);\s*\},\s*\[\]\);\s*/useEffect(() => { loadInitialTask(); }, []);\n  useEffect(() => { loadTasksByLevel(difficulty); }, [difficulty]);\n/s' -i "$LP"
  fi

  # Add difficulty selector in header
  if ! grep -q "Level" "$LP"; then
    perl -0777 -pe 's/(<div>\s*<h1[^>]*>[^<]*<\/h1>[\s\S]*?<\/div>)/$1\n          <div className="flex items-center gap-2"><label className="text-sm text-gray-600">Level<\/label><select value={difficulty} onChange={(e)=>setDifficulty(parseInt(e.target.value))} className="border rounded px-2 py-1 text-sm">{[1,2,3,4,5,6,7,8].map(l=>(<option key={l} value={l}>Level {l}<\/option>))}<\/select><\/div>/s' -i "$LP"
  fi
fi

# 7) Docs
cat > docs/TASKS_DB_SWITCH.md <<'EOF'
# Tasks Source: Local JSON vs Database

This app can serve coding challenges from either:
- **Local JSON**: `apps/web/data/tasks.levels.json`
- **Database (PostgreSQL)** via Prisma models

## Switch source

Edit `apps/web/.env.local`:
```
TASKS_SOURCE=local   # or: db
DATABASE_URL=postgresql://user:password@localhost:5432/aict
```

## Local JSON (default)
- File: `apps/web/data/tasks.levels.json`
- API: `GET /api/tasks?level=1&limit=15`

## Database
1. Ensure Postgres is running and `DATABASE_URL` is set.
2. Install deps: `pnpm add -w @prisma/client prisma`
3. Generate client & migrate:
   ```bash
   npx prisma generate
   npx prisma migrate dev -n init_tasks
   ```
4. Seed tasks from the JSON:
   ```bash
   npx ts-node prisma/seed.ts
   # or configure "prisma": { "seed": "ts-node prisma/seed.ts" } in package.json
   npx prisma db seed
   ```
5. Switch `.env.local` to `TASKS_SOURCE=db`.
6. Restart the dev server.

## Client usage
`/app/learn/page.tsx` requests tasks by selected **level**. The first challenge of that level is loaded into the editor.
EOF

echo "✅ Setup complete. Next steps:"
echo "1) Open VS Code: code \"$REPO\""
echo "2) Run dev: pnpm dev (or your workspace command)"
echo "3) Hit http://localhost:3000/learn and pick a Level 1–8."
