# Complete Setup Guide

## System Requirements

- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+
- Git

## Installation Steps

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd aict
```

### 2. Create Project Structure

Run the setup script to create all folders and package.json files:
```bash
chmod +x scripts/setup-project.sh
./scripts/setup-project.sh
```

This creates:
- All necessary folders
- Package.json files for root, apps/web, and all packages
- pnpm-workspace.yaml
- .gitignore

### 3. Install Dependencies

Run the installation script to install npm packages in all directories:
```bash
chmod +x scripts/install-all.js
node scripts/install-all.js
```

This will:
- Find all package.json files in the project
- Run `npm install` in each directory
- Show a summary of successful/failed installations

**Alternative:** Use pnpm from the root (recommended for monorepos):
```bash
pnpm install
```

### 4. Copy Artifact Code

Copy all the artifact code provided into their respective files:

**Critical files to create:**
- `packages/services/src/orchestrator.ts`
- `packages/services/src/types.ts`
- `apps/web/prisma/schema.prisma`
- `apps/web/prisma/seed.ts`
- `apps/web/app/components/*.tsx` (5 components)
- `apps/web/app/api/**/route.ts` (8 API routes)
- `apps/web/app/learn/page.tsx`
- `apps/web/next.config.js`
- All other files from the artifact list

### 5. Environment Configuration
```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:
```bash
# Required
ANTHROPIC_API_KEY="sk-ant-api-..." # Get from https://console.anthropic.com

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aict"

# Optional (for authentication)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 6. Database Setup

**Create database:**
```bash
createdb aict
```

**Initialize schema:**
```bash
cd apps/web
npm run prisma generate  # Generate Prisma client
npm run prisma db push   # Push schema to database
```

**Seed initial data:**
```bash
npm run prisma db seed   # Seed 3 starter tasks
```

**Verify:**
```bash
npm run prisma studio    # Opens Prisma Studio at localhost:5555
```

### 7. Start Development Server
```bash
cd apps/web
npm run dev
```

Visit **http://localhost:3000/learn**

---

## Project Structure
```
aict/
├── apps/web/              # Next.js application
├── packages/
│   ├── services/          # Orchestrator logic
│   ├── database/          # Prisma client (optional)
│   └── ui/                # Shared components (optional)
├── scripts/               # Utility scripts
│   ├── setup-project.sh   # Create folder structure
│   └── install-all.js     # Install all dependencies
└── docs/                  # Documentation
```

---

## Common Tasks

### Add New Tasks
```bash
# Edit apps/web/prisma/seed.ts or scripts/seed-tasks.ts
cd apps/web
npm run prisma db seed
```

### Reset Database
```bash
cd apps/web
npm run prisma migrate reset
```

### Type Checking
```bash
# Check all packages
cd apps/web
npm run type-check

# Or from root with pnpm
pnpm type-check
```

### Build for Production
```bash
cd apps/web
npm run build
npm start
```

### Clean Install (if issues occur)
```bash
# Remove all node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove lock files
rm -f package-lock.json pnpm-lock.yaml

# Reinstall everything
node scripts/install-all.js
# or
pnpm install
```

---

## Troubleshooting

### Installation Script Issues

**Script not executable:**
```bash
chmod +x scripts/install-all.js
chmod +x scripts/setup-project.sh
```

**Script finds 0 package.json files:**
- Run `./scripts/setup-project.sh` first
- Verify package.json files exist in root, apps/web, and packages/*

**Installation fails in specific package:**
```bash
# Install manually in that directory
cd apps/web
npm install
```

### Monaco Editor Not Loading

Install webpack plugin:
```bash
cd apps/web
npm install monaco-editor-webpack-plugin
```

Then update `next.config.js` (already included in artifacts).

### Database Connection Fails

Check:
1. PostgreSQL is running: `pg_isready`
2. Database exists: `psql -l | grep aict`
3. Connection string is correct in .env.local
4. User has permissions

Create database if needed:
```bash
createdb aict
```

### API Returns Errors

Check server logs in terminal where `npm run dev` is running.

Common issues:
- Missing `ANTHROPIC_API_KEY` in .env.local
- Prisma client not generated: `npm run prisma generate`
- JSDOM not installed: `npm install jsdom @types/jsdom`

### Tests Don't Run

Verify:
1. Task has tests defined in database
2. `/api/eval` route exists
3. JSDOM is installed
4. Files are properly formatted

Test manually:
```bash
curl -X POST http://localhost:3000/api/eval \
  -H "Content-Type: application/json" \
  -d '{"task": {...}, "files": {...}}'
```

### Workspace/Monorepo Issues

If you have issues with workspace resolution:
```bash
# Using npm (workspaces must be in package.json)
npm install --workspaces

# Using pnpm (recommended)
pnpm install
```

Ensure `pnpm-workspace.yaml` exists with:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## Next Steps

### Add More Tasks

Edit `apps/web/prisma/seed.ts` and add new tasks, then:
```bash
cd apps/web
npm run prisma db seed
```

### Customize AI Behavior

Edit the system prompt in `apps/web/app/api/tutor/route.ts`

### View Database
```bash
cd apps/web
npm run prisma studio
```

Opens Prisma Studio at http://localhost:5555

### Add Authentication

Install Clerk or NextAuth:
```bash
cd apps/web
npm install @clerk/nextjs
# or
npm install next-auth
```

Follow their setup guides.

---

## Development Workflow
```bash
# Create structure (first time only)
./scripts/setup-project.sh

# Install all dependencies
node scripts/install-all.js
# or
pnpm install

# Start dev server with auto-reload
cd apps/web
npm run dev

# Check types across all packages
npm run type-check

# View database
npm run prisma studio

# Reset database (careful!)
npm run prisma db push --force-reset
npm run prisma db seed

# Build for production
npm run build

# Start production server
npm start
```

---

## File Structure Quick Reference
```
apps/web/
├── app/
│   ├── api/              # API routes (tutor, eval, mastery, tasks)
│   ├── components/       # React components
│   ├── learn/page.tsx    # Main interface
│   └── lib/              # Utilities (host, test-runner, task-loader)
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Initial data
└── .env.local            # Secrets (gitignored)

packages/services/
└── src/
    ├── orchestrator.ts   # Action executor
    └── types.ts          # Shared types

scripts/
├── setup-project.sh      # Create project structure
└── install-all.js        # Install all npm dependencies
```

---

## Production Deployment

### Environment Variables

Set in your hosting platform (Vercel, Railway, etc.):
```bash
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
```

### Build Command
```bash
cd apps/web && npm run build
```

### Start Command
```bash
cd apps/web && npm start
```

### Database Migrations

For production, use Prisma migrations instead of `db push`:
```bash
cd apps/web
npm run prisma migrate dev --name init
npm run prisma migrate deploy  # In production
```

---

## Getting Help

If stuck:

1. Check server logs in terminal
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure database is seeded
5. Try restarting dev server
6. Run `node scripts/install-all.js` again

---

## Success! 🎉

You should now have a working AI coding tutor. Students can:

- Work through progressively harder tasks
- Get hints at 3 levels (concept → API → code)
- See live previews of their code
- Run tests to validate solutions
- Track progress across concepts

**Happy teaching!** 🚀