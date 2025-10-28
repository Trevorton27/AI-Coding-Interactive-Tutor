# Vercel Deployment Fix

## Issue
Vercel is using `npm install` instead of `pnpm install` and can't find Next.js.

## Root Cause
Vercel is detecting the monorepo at the root level but needs to be configured to use pnpm properly.

---

## Solution: Configure Project Settings in Vercel Dashboard

### Step 1: Go to Project Settings

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings**

### Step 2: Update Build & Development Settings

Click on **"Build & Development Settings"** and configure:

```
Framework Preset: Next.js
─────────────────────────────────────────────────

Root Directory: aict
(leave blank if already at root, or set to your monorepo root)

Build Command:
Override: ☑ (check this box)
cd apps/web && pnpm prisma generate && pnpm build

Output Directory:
apps/web/.next

Install Command:
Override: ☑ (check this box)
pnpm install

Development Command:
pnpm dev
```

### Step 3: Enable pnpm

Still in **Settings**, scroll to find:

```
Node.js Version: 18.x (or 20.x)
Package Manager: pnpm
```

If "pnpm" is not available as an option, Vercel will auto-detect it from your `pnpm-lock.yaml` file.

---

## Alternative: Use vercel.json (Already Done)

I've already updated your `vercel.json` with the correct configuration. This should work, but if Vercel still uses npm, follow the dashboard steps above.

---

## Step 4: Redeploy

After making changes:

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger a fresh build

---

## Expected Build Output

After the fix, you should see:

```
✓ Detected pnpm-lock.yaml version 6
✓ Running "install" command: pnpm install
✓ Installing dependencies...
✓ Running "build" command: cd apps/web && pnpm prisma generate && pnpm build
✓ Generating Prisma Client...
✓ Building Next.js application...
✓ Build completed successfully
```

---

## If It Still Fails

### Check 1: Verify pnpm-lock.yaml exists
```bash
# In your repo root
ls -la pnpm-lock.yaml
```

Should show the file exists.

### Check 2: Verify package.json has packageManager field
```bash
cat package.json | grep packageManager
```

Should show:
```json
"packageManager": "pnpm@8.15.0"
```

### Check 3: Force Vercel to use pnpm

Add this to your root `package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

---

## Common Errors and Fixes

### Error: "Could not identify Next.js version"

**Cause**: Vercel is looking for `next` in root package.json

**Fix**: Configure Root Directory in Vercel Dashboard or ensure build command includes `cd apps/web`

### Error: "npm install --prefix=../.."

**Cause**: Vercel is defaulting to npm despite pnpm-lock.yaml

**Fix**:
1. Enable pnpm in Vercel project settings
2. Or add `.npmrc` with `engine-strict=true`
3. Redeploy after clearing build cache

### Error: "Module not found: Can't resolve '@aict/services'"

**Cause**: Workspace dependencies not being installed

**Fix**: Ensure `pnpm install` runs at monorepo root before build

---

## Verify Fix

Check build logs for these signs of success:

✅ `Detected pnpm-lock.yaml` (not npm)
✅ `Running "install" command: pnpm install`
✅ `Installing dependencies...` (should be fast with pnpm)
✅ `Generating Prisma Client`
✅ `Build completed successfully`

---

## Quick Commands

```bash
# Test build locally
pnpm install
cd apps/web && pnpm prisma generate && pnpm build

# Force fresh deploy in Vercel
vercel --prod --force

# Check Vercel logs
vercel logs
```

---

## Notes

- Vercel auto-detects package managers from lock files
- If you have both `package-lock.json` and `pnpm-lock.yaml`, Vercel may get confused
- Remove `package-lock.json` if it exists:
  ```bash
  rm -f package-lock.json
  git add . && git commit -m "Remove npm lock file"
  git push
  ```
