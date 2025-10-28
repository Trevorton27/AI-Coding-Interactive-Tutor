# Tasks Source: Local JSON vs Database

This app can serve coding challenges from either local JSON or a Postgres DB.

## Switch
Edit `apps/web/.env.local`:
```
TASKS_SOURCE=local   # or db
DATABASE_URL=postgresql://user:password@localhost:5432/aict
```

## Seed DB
```
npx prisma generate
npx prisma migrate dev -n init_tasks
npx ts-node prisma/seed.ts
# or: npx prisma db seed
```
