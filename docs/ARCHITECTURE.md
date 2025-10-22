# Architecture Overview

## System Design
```
┌─────────────┐
│   Student   │
└──────┬──────┘
       │
       ├─ asks question
       │
┌──────▼────────────┐
│   ChatPanel       │  ← React Component
└──────┬────────────┘
       │
       ├─ sends context
       │
┌──────▼────────────┐
│  /api/tutor       │  ← Next.js API Route
└──────┬────────────┘
       │
       ├─ calls Claude
       │
┌──────▼────────────┐
│  Claude API       │  ← Anthropic
└──────┬────────────┘
       │
       ├─ returns JSON
       │
┌──────▼────────────┐
│  Orchestrator     │  ← packages/services
└──────┬────────────┘
       │
       ├─ executes actions
       │
┌──────▼────────────┐
│  HostCapabilities │  ← apps/web/lib/host.ts
└──────┬────────────┘
       │
       ├─ updates UI
       │
┌──────▼────────────┐
│  Components       │  ← Editor, Preview, Tests
└───────────────────┘
```

## Key Components

### 1. Frontend Layer (React)

**Location:** `apps/web/app/components/`

- **ChatPanel**: User input → API calls → Display responses
- **CodeEditor**: Monaco editor with file tabs
- **PreviewSandbox**: Iframe executing student code
- **TestPanel**: Visual test results

**State Management:**
- React useState/useRef (no Redux needed for MVP)
- Context passed to AI each turn
- Test results stored for next interaction

### 2. API Layer (Next.js Routes)

**Location:** `apps/web/app/api/`

- **tutor/route.ts**: Claude integration
- **eval/route.ts**: JSDOM test execution
- **mastery/route.ts**: Elo scoring
- **tasks/**: CRUD operations

**Why Next.js API Routes?**
- Co-located with frontend
- Easy deployment (single Vercel app)
- TypeScript end-to-end

### 3. Orchestrator (Business Logic)

**Location:** `packages/services/src/orchestrator.ts`

**Responsibilities:**
- Parse AI response JSON
- Execute actions sequentially
- Return side effects to UI

**Why separate package?**
- Testable without Next.js
- Reusable across different frontends
- Clear separation of concerns

### 4. Database Layer (Prisma)

**Location:** `apps/web/prisma/` or `packages/database/`

**Schema:**
```
Concept ──┐
          ├─→ Task ──→ Attempt
          │            └─→ Dialog
          └─→ Progress
```

**Why Prisma?**
- Type-safe queries
- Easy migrations
- Great DX with Prisma Studio

## Data Flow

### Student asks question:
```
1. User types in ChatPanel
2. ChatPanel builds context object
3. POST to /api/tutor with {userText, context}
4. API calls Claude with system prompt + context
5. Claude returns JSON: {ui_messages, actions}
6. Orchestrator.runActions() executes each action
7. Actions update editor/preview/tests
8. Test results stored for next turn
```

### Test execution:
```
1. User clicks "Run Tests" OR AI triggers run_tests action
2. POST to /api/eval with {task, files}
3. JSDOM creates virtual DOM from HTML
4. Each test.code executed in DOM context
5. Results collected: {passed, passedIds, failedIds, messages}
6. TestPanel displays results
7. Results included in next AI context
```

## Scalability Considerations

### Current (MVP):
- Single Next.js app
- PostgreSQL database
- API calls to Claude
- ~100 concurrent users

### Future (Production):
- Separate API server (Express/Fastify)
- Redis for session storage
- Queue system for test execution (Bull/BullMQ)
- CDN for static assets
- Horizontal scaling with load balancer

## Security

### Current:
- API keys in .env (server-side only)
- JSDOM sandbox for code execution
- No user auth (use demo user ID)

### Production TODO:
- Add authentication (Clerk/NextAuth)
- Rate limiting per user
- Input sanitization
- CSP headers
- HTTPS only

## Testing Strategy

### Unit Tests:
- Orchestrator action execution
- Test runner logic
- Mastery scoring algorithm

### Integration Tests:
- API route responses
- Database queries
- Claude integration (mocked)

### E2E Tests:
- Full user flow (Playwright)
- Chat → Code → Test → Pass

## Deployment

### Development:
```bash
pnpm dev  # Runs on localhost:3000
```

### Production (Vercel):
```bash
pnpm build
vercel deploy
```

**Environment Variables:**
- Set in Vercel dashboard
- DATABASE_URL points to hosted Postgres
- ANTHROPIC_API_KEY added as secret

## Monitoring

### Recommended Tools:
- **Errors**: Sentry
- **Analytics**: PostHog
- **Logging**: Axiom or Datadog
- **Uptime**: Better Uptime

### Key Metrics:
- Response time (API calls)
- Test execution time
- Student success rate
- Hint effectiveness

## Future Architecture

### Phase 2: Microservices
```
┌─────────────────┐
│   Next.js App   │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
┌───▼──┐   ┌──▼────┐
│ API  │   │ Test  │
│Server│   │Runner │
└───┬──┘   └──┬────┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │Database │
    └─────────┘
```

**Benefits:**
- Independent scaling
- Language flexibility (Python for ML)
- Better fault isolation