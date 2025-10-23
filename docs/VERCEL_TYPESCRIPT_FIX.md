# Fixing TypeScript Dependencies for Vercel Deployment

## The Error

```
It looks like you're trying to use TypeScript but do not have the required package(s) installed.
Please install typescript, @types/react, and @types/node by running:
	pnpm install --save-dev typescript @types/react @types/node

ELIFECYCLE  Command failed with exit code 1.
Error: Command "pnpm prisma generate && pnpm build" exited with 1
```

## Root Cause

TypeScript and type definition packages (`@types/*`) were in `devDependencies`, but **Vercel's build process requires them as production dependencies**.

When pnpm runs in production mode (which Vercel does), it may skip or limit `devDependencies` installation, causing the build to fail.

## ✅ Solution Applied

### 1. Moved TypeScript Packages to Dependencies

**apps/web/package.json changes:**

```json
{
  "dependencies": {
    // ... other deps
    "typescript": "^5.3.3",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18"
  },
  "devDependencies": {
    "@types/jsdom": "^21.1.6",
    "prisma": "^5.22.0",
    "tsx": "^4.20.6"
  }
}
```

**What was moved:**
- `typescript` → dependencies (was in devDependencies)
- `@types/node` → dependencies (was in devDependencies)
- `@types/react` → dependencies (was in devDependencies)
- `@types/react-dom` → dependencies (was in devDependencies)

**What was removed:**
- Duplicate `prisma` from dependencies (kept in devDependencies only)
- Duplicate `tailwindcss` from devDependencies (kept in dependencies only)
- Duplicate `postcss` from devDependencies (kept in dependencies only)
- Duplicate `autoprefixer` from devDependencies (kept in dependencies only)

### 2. Updated vercel.json

**Changed buildCommand to run from correct directory:**

```json
{
  "buildCommand": "cd apps/web && pnpm prisma generate && pnpm build",
  "installCommand": "pnpm install --no-frozen-lockfile"
}
```

**Why these changes:**
- `cd apps/web` ensures commands run in the correct monorepo package
- `--no-frozen-lockfile` allows pnpm to update dependencies if needed

## Why This Matters

### Development vs Production Dependencies

**devDependencies** (development only):
- Testing tools
- Build tools that aren't needed at runtime
- Developer utilities
- Examples: `jest`, `eslint`, `prettier`

**dependencies** (production):
- Runtime dependencies
- **Build-time dependencies needed by hosting platforms**
- Type definitions for TypeScript compilation
- Examples: `react`, `next`, **`typescript`**, **`@types/*`**

### Vercel's Build Process

1. **Install Phase**: `pnpm install` (may limit devDependencies)
2. **Build Phase**: Runs `next build` which needs:
   - TypeScript compiler
   - Type definitions
   - All packages referenced in code

If TypeScript isn't available during the build phase, Next.js will fail.

## Best Practices for Vercel Deployment

### ✅ DO: Put these in dependencies

- `typescript` - Needed for compilation
- `@types/node` - Node.js type definitions
- `@types/react` - React type definitions
- `@types/react-dom` - React DOM type definitions
- Any other `@types/*` packages used in production code
- Build tools needed during deployment (PostCSS, Tailwind, etc.)

### ❌ DON'T: Put these in dependencies

- Development-only tools: `tsx`, `ts-node` (for local scripts)
- Testing libraries: `jest`, `vitest`, `@testing-library/*`
- Linting/formatting: `eslint`, `prettier`
- Type definitions for dev-only packages: `@types/jest`, `@types/jsdom`

### 🤔 Special Case: Prisma

- `@prisma/client` → dependencies (runtime queries)
- `prisma` (CLI) → devDependencies (migration/generation only)
- Use `pnpm prisma generate` in buildCommand to create client

## Verification

After deployment, you should see in Vercel logs:

```
✓ Compiled successfully
   Linting and checking validity of types ...
✓ No type errors found
```

**No longer seeing:**
```
It looks like you're trying to use TypeScript but do not have the required package(s) installed
```

## Related Errors

If you still see issues:

1. **Cache problems**: Redeploy without cache
2. **Lockfile issues**: Ensure `pnpm-lock.yaml` is committed
3. **Workspace issues**: Check `pnpm-workspace.yaml` configuration
4. **Build command wrong**: Verify `buildCommand` in vercel.json runs from correct directory

## Quick Reference

| Package | Location | Reason |
|---------|----------|---------|
| typescript | dependencies | Build-time compilation |
| @types/node | dependencies | Node.js types for build |
| @types/react | dependencies | React types for build |
| @types/react-dom | dependencies | React DOM types for build |
| @types/jsdom | devDependencies | Only for local testing |
| prisma (CLI) | devDependencies | Only for schema changes |
| @prisma/client | dependencies | Runtime database queries |
| tsx | devDependencies | Only for local scripts |

## Related Documentation

- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Complete deployment guide
- [VERCEL_IGNORE_COMMAND_FIX.md](./VERCEL_IGNORE_COMMAND_FIX.md) - Git diff errors
- [VERCEL_FIX.md](./VERCEL_FIX.md) - npm vs pnpm issues
