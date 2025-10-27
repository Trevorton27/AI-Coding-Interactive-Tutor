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
