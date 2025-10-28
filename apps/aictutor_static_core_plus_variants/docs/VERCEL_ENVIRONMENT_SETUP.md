# Vercel Environment Setup Guide

## 🎯 One Project, Multiple Environments

This guide shows you how to set up **Production**, **Preview**, and **Development** environments within a single Vercel project.

---

## 📋 Quick Overview

```
┌─────────────────────────────────────────────────┐
│  ONE Vercel Project                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  Production Environment                         │
│  ├─ Branch: main                                │
│  ├─ URL: your-app.vercel.app                    │
│  └─ DB: Production Database                     │
│                                                 │
│  Preview Environment                            │
│  ├─ Branch: feature-*, PR branches              │
│  ├─ URL: your-app-git-feature.vercel.app        │
│  └─ DB: Preview/Staging Database                │
│                                                 │
│  Development Environment                        │
│  ├─ Local: vercel dev                           │
│  ├─ URL: localhost:3000                         │
│  └─ DB: Development Database                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🗄️ Step 1: Create Neon Databases

Create **3 separate databases** in [Neon Console](https://console.neon.tech):

### 1. Development Database
```
Project Name: aict-development
Database: aict_dev
Purpose: Local development and testing
```

### 2. Preview Database
```
Project Name: aict-preview
Database: aict_preview
Purpose: Testing PRs and feature branches
```

### 3. Production Database
```
Project Name: aict-production
Database: aict_prod
Purpose: Live production data
```

**Copy the connection strings** - you'll need them next!

---

## ⚙️ Step 2: Configure Vercel Environment Variables

Go to: [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → **Settings** → **Environment Variables**

### DATABASE_URL

Add the variable **once** but check multiple environment boxes:

```
┌─────────────────────────────────────────────────┐
│ Key: DATABASE_URL                               │
├─────────────────────────────────────────────────┤
│ Value (Production):                             │
│ postgresql://prod_user:prod_pass@               │
│   ep-prod-xxx.neon.tech/aict_prod?sslmode=require│
│                                                 │
│ Select Environments:                            │
│ ☑ Production                                    │
│ ☐ Preview                                       │
│ ☐ Development                                   │
└─────────────────────────────────────────────────┘
```

**Then add another DATABASE_URL for Preview:**

```
┌─────────────────────────────────────────────────┐
│ Key: DATABASE_URL                               │
├─────────────────────────────────────────────────┤
│ Value (Preview):                                │
│ postgresql://preview_user:preview_pass@         │
│   ep-preview-xxx.neon.tech/aict_preview?sslmode=require│
│                                                 │
│ Select Environments:                            │
│ ☐ Production                                    │
│ ☑ Preview                                       │
│ ☐ Development                                   │
└─────────────────────────────────────────────────┘
```

**And one more for Development (optional):**

```
┌─────────────────────────────────────────────────┐
│ Key: DATABASE_URL                               │
├─────────────────────────────────────────────────┤
│ Value (Development):                            │
│ postgresql://dev_user:dev_pass@                 │
│   ep-dev-xxx.neon.tech/aict_dev?sslmode=require │
│                                                 │
│ Select Environments:                            │
│ ☐ Production                                    │
│ ☐ Preview                                       │
│ ☑ Development                                   │
└─────────────────────────────────────────────────┘
```

### ANTHROPIC_API_KEY

**Production:**
```
Key: ANTHROPIC_API_KEY
Value: sk-ant-api-prod-your-production-key
Environments: ☑ Production
```

**Preview:**
```
Key: ANTHROPIC_API_KEY
Value: sk-ant-api-staging-your-staging-key
Environments: ☑ Preview
```

**Development:**
```
Key: ANTHROPIC_API_KEY
Value: sk-ant-api-dev-your-development-key
Environments: ☑ Development
```

### NEXTAUTH_SECRET

**Generate 3 different secrets:**
```bash
# Generate unique secret for each environment
openssl rand -base64 32
```

**Production:**
```
Key: NEXTAUTH_SECRET
Value: [generated-production-secret]
Environments: ☑ Production
```

**Preview:**
```
Key: NEXTAUTH_SECRET
Value: [generated-preview-secret]
Environments: ☑ Preview
```

**Development:**
```
Key: NEXTAUTH_SECRET
Value: [generated-dev-secret]
Environments: ☑ Development
```

### NEXTAUTH_URL

**Production:**
```
Key: NEXTAUTH_URL
Value: https://your-app.vercel.app
Environments: ☑ Production
```

**Preview:**
```
Key: NEXTAUTH_URL
Value: $VERCEL_URL
Environments: ☑ Preview
Note: Vercel automatically sets $VERCEL_URL for preview deployments
```

**Development:**
```
Key: NEXTAUTH_URL
Value: http://localhost:3000
Environments: ☑ Development
```

---

## 📝 Step 3: Summary View in Vercel

After setup, your environment variables should look like this:

```
DATABASE_URL
├─ Production:   postgresql://...prod.neon.tech/aict_prod
├─ Preview:      postgresql://...preview.neon.tech/aict_preview
└─ Development:  postgresql://...dev.neon.tech/aict_dev

ANTHROPIC_API_KEY
├─ Production:   sk-ant-api-prod-xxx
├─ Preview:      sk-ant-api-staging-xxx
└─ Development:  sk-ant-api-dev-xxx

NEXTAUTH_SECRET
├─ Production:   [unique-prod-secret]
├─ Preview:      [unique-preview-secret]
└─ Development:  [unique-dev-secret]

NEXTAUTH_URL
├─ Production:   https://your-app.vercel.app
├─ Preview:      $VERCEL_URL (auto)
└─ Development:  http://localhost:3000

NEXT_PUBLIC_APP_URL
├─ Production:   https://your-app.vercel.app
├─ Preview:      $VERCEL_URL (auto)
└─ Development:  http://localhost:3000
```

---

## 🚀 Step 4: Deploy & Test

### Deploy to Production
```bash
# Push to main branch
git push origin main

# Or use Vercel CLI
vercel --prod
```

### Test Preview Deployments
```bash
# Create feature branch
git checkout -b feature/new-feature

# Push to trigger preview deploy
git push origin feature/new-feature

# Vercel will create: your-app-git-feature-new-feature.vercel.app
```

### Test Local Development
```bash
# Pull environment variables
vercel env pull .env.local

# Start dev server
pnpm dev
```

---

## 🔍 Step 5: Verify Each Environment

### Check Production
```bash
# Visit your production URL
https://your-app.vercel.app

# Check logs
vercel logs --prod
```

### Check Preview
```bash
# Visit preview URL (from PR or branch)
https://your-app-git-feature.vercel.app

# Check logs
vercel logs [preview-url]
```

### Check Development
```bash
# Run locally
pnpm dev

# Visit
http://localhost:3000
```

---

## 🎨 Environment-Specific Behavior

### How Vercel Determines the Environment

| Deploy Type | Environment | Trigger |
|-------------|-------------|---------|
| **Production** | Production | Push to `main` branch |
| **Preview** | Preview | Push to any other branch / PR |
| **Development** | Development | Running `vercel dev` locally |

### Example Workflow

```bash
# Feature development
git checkout -b feature/add-hints
# Uses: Development DB, Development API key
pnpm dev

# Push feature branch
git push origin feature/add-hints
# Vercel creates preview deploy
# Uses: Preview DB, Preview API key

# Merge to main
git checkout main
git merge feature/add-hints
git push origin main
# Vercel deploys to production
# Uses: Production DB, Production API key
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Use separate databases for each environment
- Use different API keys per environment
- Generate unique secrets for each environment
- Keep Production keys secure and limited
- Use Preview environment to test before production

### ❌ DON'T:
- Use production database in preview/dev
- Share API keys across environments
- Commit secrets to git
- Use same NEXTAUTH_SECRET everywhere
- Skip testing in preview environment

---

## 🛠️ Troubleshooting

### Issue: Wrong database being used

**Check which environment Vercel assigned:**
```bash
# View deployment info
vercel inspect [deployment-url]
```

**Solution:**
- Verify branch name triggers correct environment
- Check environment variable is set for that environment
- Redeploy if needed

### Issue: Environment variable not found

**Check in Vercel Dashboard:**
- Settings → Environment Variables
- Verify variable exists for that environment
- Click "Redeploy" if you just added it

### Issue: Preview uses production database

**Common mistake:**
- DATABASE_URL only checked for "Production"
- Need to add separate DATABASE_URL entry for "Preview"

**Fix:**
- Add new environment variable entry
- Set Preview database connection string
- Check only "Preview" box

---

## 🔄 Database Migration Strategy

### For Each Environment

**Production:**
```bash
# Never run migrations directly!
# They run automatically on deploy via prisma generate
# Or use Vercel CLI:
vercel env pull .env.production
pnpm --filter @aict/web prisma migrate deploy
```

**Preview:**
```bash
# Preview environments should auto-migrate
# Or manually:
vercel env pull .env.preview --environment=preview
pnpm --filter @aict/web prisma migrate deploy
```

**Development:**
```bash
# Safe to experiment
pnpm --filter @aict/web prisma migrate dev --name new_feature
```

---

## 📊 Monitoring

### Check Database Usage Per Environment

**Neon Dashboard:**
- aict-development → Check queries, storage
- aict-preview → Check queries, storage
- aict-production → Monitor closely!

### Check API Usage Per Environment

**Anthropic Console:**
- Track usage per API key
- Set usage limits per environment
- Monitor costs

---

## 💰 Cost Optimization

### Neon Free Tier Strategy

Each Neon project gets:
- 10 GB storage
- 1 compute hour/day

**Recommendations:**
- **Development**: Free tier OK (suspend when idle)
- **Preview**: Free tier OK (temporary deploys)
- **Production**: Consider Pro tier for always-on

### Anthropic API Strategy

- **Development**: Low rate limits
- **Preview**: Medium limits for testing
- **Production**: Full limits

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Add env var | Vercel Dashboard → Settings → Env Variables |
| Pull env locally | `vercel env pull .env.local` |
| Deploy prod | `git push origin main` |
| Deploy preview | `git push origin feature-branch` |
| Test locally | `pnpm dev` |
| View logs | `vercel logs [url]` |
| Redeploy | Vercel Dashboard → Deployments → Redeploy |

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Neon Database Docs](https://neon.tech/docs/introduction)
- [Prisma Deployment Docs](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

## ✅ Checklist

Before going to production:

- [ ] Created 3 separate Neon databases
- [ ] Added DATABASE_URL for all 3 environments
- [ ] Added ANTHROPIC_API_KEY for all 3 environments
- [ ] Generated unique NEXTAUTH_SECRET for each
- [ ] Set NEXTAUTH_URL correctly for each
- [ ] Tested preview deployment
- [ ] Ran migrations on production
- [ ] Seeded production database
- [ ] Verified production deployment works
- [ ] Set up monitoring/alerts
- [ ] Documented production URL

🎉 **You're ready to deploy!**
