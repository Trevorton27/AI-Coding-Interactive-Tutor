# Database Configuration Guide

This guide explains the database architecture, configuration, and how to implement API integration with the AI Coding Interactive Tutor (AICT) platform.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Database Setup](#database-setup)
- [Schema Architecture](#schema-architecture)
- [Prisma Client Configuration](#prisma-client-configuration)
- [API Integration Patterns](#api-integration-patterns)
- [Best Practices](#best-practices)
- [Common Operations](#common-operations)
- [Troubleshooting](#troubleshooting)

---

## Overview

AICT uses PostgreSQL as its primary database with Prisma as the ORM (Object-Relational Mapping) layer. The database is hosted on Neon (a serverless PostgreSQL platform) and manages:

- Educational content (Concepts, Tasks, Challenges)
- Student progress and mastery tracking
- AI agent conversations and memory
- Evaluation results and feedback
- Test attempts and dialog history

---

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Database | PostgreSQL | Latest (via Neon) |
| ORM | Prisma | 5.7.0 |
| Client | @prisma/client | 5.7.0 |
| Node.js | Required | >=18.0.0 |
| Framework | Next.js | 15.0.3 |

---

## Database Setup

### 1. Environment Configuration

Create a `.env` file in your project root:

```bash
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

**Current Production Database:**
```bash
DATABASE_URL="postgresql://neondb_owner:npg_d4qixg7BlMSt@ep-steep-cherry-a1j01qdh-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

### 2. Database Location

The Prisma schema is located at:
```
/packages/database/prisma/schema.prisma
```

### 3. Initial Setup Commands

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm db:generate
# or
npx prisma generate

# Push schema to database (development)
pnpm db:push
# or
npx prisma db push

# Seed the database with initial data
pnpm db:seed
# or
npx prisma db seed

# Open Prisma Studio (database GUI)
pnpm db:studio
# or
npx prisma studio
```

---

## Schema Architecture

### Core Models Overview

#### 1. Educational Content Models

**Concept** - Learning concepts that organize the curriculum
```typescript
{
  id: string              // Unique identifier (cuid)
  name: string            // Unique concept name
  description: string     // Optional description
  difficulty: number      // 1-5 scale
  prerequisites: string[] // Array of prerequisite concept IDs
  tasks: ConceptTask[]    // Related tasks
  progress: Progress[]    // Student progress records
}
```

**Task** - Individual coding challenges
```typescript
{
  id: string                    // Unique identifier
  title: string                 // Task title
  description: string           // Brief description
  prompt: string                // Full task prompt (Text field)
  difficulty: number            // 1-5 scale
  concepts: ConceptTask[]       // Associated concepts
  prerequisites: string[]       // Required task IDs
  scaffold: Json                // Initial code files
  solution: Json                // Complete solution files
  tests: Json                   // Test definitions
  hints: Json                   // Three-tier hint system
  detailedDescription: string   // Rich educational content
  realWorldContext: string      // Practical applications
  alternativeSolutions: Json    // Alternative approaches
  attempts: Attempt[]           // Student attempts
}
```

**Challenge** - Advanced challenges module
```typescript
{
  id: string                      // Unique identifier
  level: number                   // Challenge level
  slug: string                    // Unique URL slug
  title: string                   // Challenge title
  objective: string               // Learning objective
  passCriteria: string            // Success criteria
  starter: Json                   // Initial files (html, css, js)
  tests: Json                     // Test definitions
  tags: string[]                  // Categorization tags
  paramsSchema: Json              // Optional parameters schema
  solutions: ChallengeSolution[]  // Reference solutions
  hintTemplates: ChallengeHintTemplate[] // Hint templates
}
```

#### 2. Progress Tracking Models

**Progress** - Student mastery per concept
```typescript
{
  id: string              // Unique identifier
  userId: string          // Student identifier
  conceptId: string       // Concept reference
  mastery: number         // Elo-style score (600-1800, default: 800)
  attempts: number        // Total attempts
  successes: number       // Successful completions
  lastAttemptAt: DateTime // Last attempt timestamp
}
```

**Attempt** - Individual task submissions
```typescript
{
  id: string          // Unique identifier
  userId: string      // Student identifier
  taskId: string      // Task reference
  code: Json          // Submitted files
  passed: boolean     // Overall pass/fail
  passedTests: string[] // Passed test IDs
  failedTests: string[] // Failed test IDs
  hintsUsed: number   // Number of hints used
  maxHintLevel: number // Highest hint level (1-3)
  timeSpentMs: number // Time spent on task
  createdAt: DateTime // Submission timestamp
}
```

#### 3. AI Agent Models

**Conversation** - Chat sessions
```typescript
{
  id: string           // Unique identifier
  agentId: string      // Agent identifier
  agentVersion: string // Agent version
  studentId: string    // Student identifier
  courseId: string     // Course context
  messages: Message[]  // Conversation messages
}
```

**Message** - Individual messages
```typescript
{
  id: string              // Unique identifier
  conversationId: string  // Parent conversation
  role: string            // "system" | "user" | "assistant" | "tool" | "summary"
  text: string            // Message content
  tokens: number          // Token count
  toolCalls: Json         // Tool invocations
  language: string        // Programming language context
  feedback: Feedback      // Optional user feedback
}
```

**Memory** - Long-term student memory
```typescript
{
  id: string          // Unique identifier
  studentId: string   // Student identifier
  courseId: string    // Course context
  text: string        // Memory content
  source: string      // Memory source
  lastUsedAt: DateTime // Last access time
  embedding: Bytes    // Vector embedding (for future pgvector)
}
```

#### 4. Evaluation Models

**Feedback** - User feedback on AI responses
```typescript
{
  id: string         // Unique identifier
  messageId: string  // Message reference
  rating: number     // -1 | 0 | 1
  tags: string[]     // Categorization tags
  comment: string    // Optional comment
}
```

**EvalResult** - Agent performance metrics
```typescript
{
  id: string        // Unique identifier
  agentId: string   // Agent identifier
  agentVer: string  // Agent version
  sampleId: string  // Evaluation sample reference
  score: number     // Performance score
  metrics: Json     // Detailed metrics
}
```

### Relationships

```
Concept (1) ──< (M) ConceptTask (M) >── (1) Task
Concept (1) ──< (M) Progress
Task (1) ──< (M) Attempt
Challenge (1) ──< (M) ChallengeSolution
Challenge (1) ──< (M) ChallengeHintTemplate
Conversation (1) ──< (M) Message
Message (1) ──(1) Feedback
```

---

## Prisma Client Configuration

### Shared Client Pattern (Recommended)

For monorepos, use a shared Prisma client instance:

**Location:** `/packages/database/src/client.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
```

### App-Level Client Pattern

For single apps, create a simplified client:

**Location:** `/apps/web/app/lib/server-db.ts`

```typescript
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

### Why This Pattern?

1. **Connection Pooling:** Prevents connection exhaustion in development
2. **Hot Reload Safe:** Reuses connections during Next.js hot reloading
3. **Production Optimized:** Creates new instance per deployment
4. **Type Safety:** Full TypeScript support with generated types

---

## API Integration Patterns

### 1. Basic CRUD Operations

#### Create/Update (Upsert Pattern)

```typescript
// POST /api/mastery
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/server-db";

export async function POST(req: NextRequest) {
  try {
    const { userId, conceptName } = await req.json();

    const concept = await prisma.concept.upsert({
      where: { name: conceptName },
      update: {},
      create: {
        name: conceptName,
        description: `Concept: ${conceptName}`,
        difficulty: 2,
        prerequisites: []
      }
    });

    return NextResponse.json({ concept });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to create concept" },
      { status: 500 }
    );
  }
}
```

#### Read with Relations

```typescript
// GET /api/tasks/[id]
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/server-db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        concepts: {
          include: {
            concept: {
              select: {
                name: true,
                description: true,
                difficulty: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Task fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}
```

#### Read with Filtering

```typescript
// GET /api/mastery?userId=123
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const progress = await prisma.progress.findMany({
      where: { userId },
      include: {
        concept: {
          select: {
            name: true,
            description: true,
            difficulty: true
          }
        }
      },
      orderBy: {
        mastery: 'desc'
      }
    });

    return NextResponse.json({ userId, progress });
  } catch (error) {
    console.error("Mastery GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mastery data" },
      { status: 500 }
    );
  }
}
```

#### Hybrid Source Pattern (Local Files + Database)

Some endpoints support loading from either local JSON files or the database:

```typescript
// GET /api/tasks?difficulty=1&limit=10&offset=0
// Also accepts: ?level=1 (level and difficulty are synonymous)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // Accept both 'level' and 'difficulty' parameters
    const levelParam = searchParams.get("level") || searchParams.get("difficulty");
    const level = levelParam ? parseInt(levelParam) : undefined;
    const limit = parseInt(searchParams.get("limit") || "15");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Load from database or local files based on environment
    const rows = (process.env.TASKS_SOURCE || "local") === "db"
      ? await loadDb(level)
      : await loadLocal(level);

    const items = rows.slice(offset, offset + limit);
    return NextResponse.json({ items, total: rows.length });
  } catch (err: any) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
```

### 2. Complex Updates with Business Logic

#### Mastery Score Update (Elo Algorithm)

```typescript
const K_FACTOR = 32;
const MIN_MASTERY = 600;
const MAX_MASTERY = 1800;

function updateMasteryScore(currentScore: number, success: boolean): number {
  const expected = 0.5;
  const actual = success ? 1 : 0;
  const delta = K_FACTOR * (actual - expected);
  const newScore = currentScore + delta;
  return Math.max(MIN_MASTERY, Math.min(MAX_MASTERY, newScore));
}

export async function POST(req: NextRequest) {
  const { userId, tags, result } = await req.json();
  const success = result === "pass";
  const updates = [];

  for (const conceptName of tags) {
    const concept = await prisma.concept.upsert({
      where: { name: conceptName },
      update: {},
      create: {
        name: conceptName,
        description: `Auto-created: ${conceptName}`,
        difficulty: 2,
        prerequisites: []
      }
    });

    const existingProgress = await prisma.progress.findUnique({
      where: {
        userId_conceptId: { userId, conceptId: concept.id }
      }
    });

    const currentMastery = existingProgress?.mastery || 800;
    const newMastery = updateMasteryScore(currentMastery, success);

    const progress = await prisma.progress.upsert({
      where: {
        userId_conceptId: { userId, conceptId: concept.id }
      },
      update: {
        mastery: newMastery,
        attempts: { increment: 1 },
        successes: success ? { increment: 1 } : undefined,
        lastAttemptAt: new Date()
      },
      create: {
        userId,
        conceptId: concept.id,
        mastery: newMastery,
        attempts: 1,
        successes: success ? 1 : 0,
        lastAttemptAt: new Date()
      }
    });

    updates.push({
      concept: conceptName,
      oldMastery: currentMastery,
      newMastery: progress.mastery,
      change: progress.mastery - currentMastery
    });
  }

  return NextResponse.json({ ok: true, updates });
}
```

### 3. Error Handling Pattern

```typescript
export async function GET(req: NextRequest) {
  try {
    // Input validation
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    // Database query
    const data = await prisma.someModel.findMany({
      where: { userId }
    });

    // Success response
    return NextResponse.json({ data });

  } catch (error) {
    // Error logging
    console.error("API error:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Best Practices

### 1. Database Client Usage

**DO:**
```typescript
// Import from centralized location
import { prisma } from "@/app/lib/server-db";

// Use in server-side code only
export async function GET() {
  const data = await prisma.task.findMany();
  return NextResponse.json({ data });
}
```

**DON'T:**
```typescript
// ❌ Don't create new instances in routes
const prisma = new PrismaClient();

// ❌ Don't use Prisma in client components
"use client"
import { prisma } from "@/lib/db"; // This will fail!
```

### 2. Query Optimization

**Use Select to Limit Fields:**
```typescript
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true
    // Don't fetch everything!
  }
});
```

**Use Include for Relations:**
```typescript
const task = await prisma.task.findUnique({
  where: { id },
  include: {
    concepts: {
      include: {
        concept: true
      }
    }
  }
});
```

**Avoid N+1 Queries:**
```typescript
// ❌ Bad: N+1 queries
const tasks = await prisma.task.findMany();
for (const task of tasks) {
  const concepts = await prisma.concept.findMany({
    where: { taskId: task.id }
  });
}

// ✅ Good: Single query with include
const tasks = await prisma.task.findMany({
  include: {
    concepts: {
      include: {
        concept: true
      }
    }
  }
});
```

### 3. Transaction Handling

**For Related Updates:**
```typescript
await prisma.$transaction(async (tx) => {
  const attempt = await tx.attempt.create({
    data: { userId, taskId, code, passed }
  });

  await tx.progress.update({
    where: { userId_conceptId: { userId, conceptId } },
    data: {
      attempts: { increment: 1 },
      successes: passed ? { increment: 1 } : undefined
    }
  });
});
```

### 4. Type Safety

**Leverage Generated Types:**
```typescript
import { Task, Concept, Prisma } from '@prisma/client';

type TaskWithConcepts = Prisma.TaskGetPayload<{
  include: { concepts: { include: { concept: true } } }
}>;

async function getTask(id: string): Promise<TaskWithConcepts | null> {
  return await prisma.task.findUnique({
    where: { id },
    include: {
      concepts: {
        include: {
          concept: true
        }
      }
    }
  });
}
```

### 5. Environment Management

**Development:**
```bash
DATABASE_URL="postgresql://localhost:5432/aict_dev"
```

**Production:**
```bash
DATABASE_URL="postgresql://user:pass@production-host/aict?sslmode=require"
```

**Always use SSL in production:**
```
?sslmode=require
```

---

## Common Operations

### Initialize New Database

```bash
# 1. Set DATABASE_URL in .env
# 2. Generate Prisma Client
npx prisma generate

# 3. Push schema to database
npx prisma db push

# 4. Seed initial data
npx prisma db seed
```

### Update Schema

```bash
# 1. Edit schema.prisma
# 2. Generate updated client
npx prisma generate

# 3. Push changes to database
npx prisma db push
```

### Create Migration (Production)

```bash
# Create migration file
npx prisma migrate dev --name add_new_field

# Apply migration to production
npx prisma migrate deploy
```

### Reset Database (Development Only)

```bash
# ⚠️ This deletes all data!
npx prisma migrate reset
```

### View Database

```bash
# Opens Prisma Studio GUI
npx prisma studio
```

---

## Troubleshooting

### Connection Issues

**Error:** `Can't reach database server`

**Solution:**
1. Check DATABASE_URL format
2. Verify network connectivity
3. Ensure database is running
4. Check firewall settings

### Schema Out of Sync

**Error:** `Prisma schema does not match database`

**Solution:**
```bash
# Development
npx prisma db push

# Production
npx prisma migrate deploy
```

### Type Errors

**Error:** `Property 'X' does not exist on type 'Y'`

**Solution:**
```bash
# Regenerate Prisma Client
npx prisma generate
```

### Too Many Connections

**Error:** `Too many connections`

**Solution:**
1. Use connection pooling
2. Implement the global Prisma client pattern
3. Set connection limits in DATABASE_URL:
```
?connection_limit=5&pool_timeout=10
```

### Migration Conflicts

**Error:** `Migration conflicts detected`

**Solution:**
```bash
# Resolve conflicts in migration files
# Then:
npx prisma migrate resolve --applied <migration_name>
```

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Neon Documentation](https://neon.tech/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## Support

For issues or questions:
1. Check [API.md](./API.md) for endpoint documentation
2. Review Prisma schema at `/packages/database/prisma/schema.prisma`
3. Check application logs
4. Open an issue in the project repository
