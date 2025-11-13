# AICT Documentation

Welcome to the AI Coding Interactive Tutor (AICT) documentation hub. This directory contains comprehensive guides for developers working with the platform.

## Quick Start

New to the project? Start here:
1. [SETUP.md](./SETUP.md) - Initial project setup
2. [DATABASE_CONFIG.md](./DATABASE_CONFIG.md) - Database configuration
3. [API.md](./API.md) - API endpoint reference

## Documentation Index

### Core Development

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and design patterns |
| [DATABASE_CONFIG.md](./DATABASE_CONFIG.md) | **NEW!** Complete database setup, schema, and API integration guide |
| [API.md](./API.md) | REST API endpoints and usage examples |
| [MASTER_PROMPT.md](./MASTER_PROMPT.md) | AI agent system prompts and behavior |

### Setup & Configuration

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Project installation and configuration |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide and best practices |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Pre-deployment verification checklist |

### Deployment & Fixes

| Document | Description |
|----------|-------------|
| [VERCEL_ENVIRONMENT_SETUP.md](./VERCEL_ENVIRONMENT_SETUP.md) | Vercel environment configuration |
| [VERCEL_FIX.md](./VERCEL_FIX.md) | Common Vercel deployment issues |
| [VERCEL_IGNORE_COMMAND_FIX.md](./VERCEL_IGNORE_COMMAND_FIX.md) | Fix for Vercel ignore command errors |
| [VERCEL_TYPESCRIPT_FIX.md](./VERCEL_TYPESCRIPT_FIX.md) | TypeScript build issues on Vercel |
| [ANTHROPIC_API_KEY_FIX.md](./ANTHROPIC_API_KEY_FIX.md) | Anthropic API key configuration |

### Feature Integration

| Document | Description |
|----------|-------------|
| [CHALLENGES_MODULE_INTEGRATION.md](./CHALLENGES_MODULE_INTEGRATION.md) | Challenges module setup and usage |
| [TASKS_DB_SWITCH.md](./TASKS_DB_SWITCH.md) | Database migration for tasks system |

## Common Developer Tasks

### Working with the Database

**Initial Setup:**
```bash
# 1. Configure DATABASE_URL in .env
# 2. Generate Prisma Client
pnpm db:generate

# 3. Push schema to database
pnpm db:push

# 4. Seed with sample data
pnpm db:seed
```

**View Database:**
```bash
pnpm db:studio
```

See [DATABASE_CONFIG.md](./DATABASE_CONFIG.md) for complete database documentation.

### API Development

**Example API Route:**
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/server-db";

export async function GET() {
  const tasks = await prisma.task.findMany();
  return NextResponse.json({ tasks });
}
```

See [API.md](./API.md) for all available endpoints.

### Deployment

**Deploy to Vercel:**
```bash
# Ensure environment variables are set
# See VERCEL_ENVIRONMENT_SETUP.md

vercel deploy --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete deployment workflow.

## Key Technologies

| Technology | Version | Documentation |
|------------|---------|---------------|
| Next.js | 15.0.3 | [docs](https://nextjs.org/docs) |
| React | 19.0.0 | [docs](https://react.dev) |
| Prisma | 5.7.0 | [docs](https://www.prisma.io/docs) |
| PostgreSQL | Latest | [docs](https://www.postgresql.org/docs/) |
| TypeScript | 5.3.3 | [docs](https://www.typescriptlang.org/docs/) |
| Anthropic Claude | Latest | [docs](https://docs.anthropic.com/) |

## Database Schema Overview

The platform uses PostgreSQL with Prisma ORM. Key models:

**Educational Content:**
- `Concept` - Learning concepts
- `Task` - Coding challenges
- `Challenge` - Advanced challenges

**Progress Tracking:**
- `Progress` - Student mastery per concept (Elo-based)
- `Attempt` - Individual task submissions

**AI Agent:**
- `Conversation` - Chat sessions
- `Message` - Individual messages
- `Memory` - Long-term student memory

**Evaluation:**
- `Feedback` - User feedback
- `EvalResult` - Agent performance metrics

See [DATABASE_CONFIG.md](./DATABASE_CONFIG.md) for complete schema documentation and API integration patterns.

## Project Structure

```
aict/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── app/
│       │   ├── api/           # API routes
│       │   └── lib/           # Shared utilities
│       └── prisma/            # Prisma schema
├── packages/
│   └── database/              # Shared database package
│       ├── prisma/
│       │   └── schema.prisma  # Database schema
│       └── src/
│           └── client.ts      # Shared Prisma client
└── docs/                      # You are here!
```

## Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL="postgresql://..."

# Anthropic AI
ANTHROPIC_API_KEY="sk-ant-..."

# NextAuth (if using authentication)
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

See [SETUP.md](./SETUP.md) for complete environment configuration.

## Getting Help

1. Check relevant documentation above
2. Review [API.md](./API.md) for endpoint issues
3. Check [DATABASE_CONFIG.md](./DATABASE_CONFIG.md) for database issues
4. Review troubleshooting sections in each guide
5. Check application logs for error details

## Contributing

When adding new features:
1. Update relevant documentation
2. Add API endpoints to [API.md](./API.md)
3. Update database schema in Prisma file
4. Run `pnpm db:generate` after schema changes
5. Update this README if adding new documentation files

---

**Last Updated:** 2025-11-11
