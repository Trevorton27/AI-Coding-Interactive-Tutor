# 🚀 Quick Start

## 1. Install Dependencies
```bash
pnpm install
```

## 2. Setup Environment
```bash
cp apps/web/.env.example apps/web/.env.local
# Edit with your ANTHROPIC_API_KEY and DATABASE_URL
```

## 3. Setup Database
```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

## 4. Start Development
```bash
pnpm dev
```

Visit http://localhost:3000/learn

## Troubleshooting

**Monaco not loading?** Install webpack plugin:
```bash
cd apps/web
pnpm add monaco-editor-webpack-plugin
```

**Database errors?** Check PostgreSQL is running:
```bash
pg_isready
```

**API errors?** Verify .env.local has ANTHROPIC_API_KEY set.