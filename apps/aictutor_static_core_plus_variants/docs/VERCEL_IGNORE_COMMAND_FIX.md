# Fixing Vercel ignoreCommand Error

## The Error

```
Command failed with exit code 126: bash git diff --quiet HEAD^ HEAD -- apps/web packages
/usr/bin/git: /usr/bin/git: cannot execute binary file
```

## Root Cause

Vercel is trying to execute an `ignoreCommand` that either:
1. Exists in the Vercel Project Settings (Dashboard)
2. Was cached from a previous deployment
3. Has incorrect syntax

## ✅ Solution: Remove ignoreCommand from Vercel Dashboard

The `ignoreCommand` in vercel.json has been removed, but Vercel Project Settings in the Dashboard can override the vercel.json file.

### Step-by-Step Fix

#### 1. Go to Vercel Dashboard Settings

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings**
4. Click on **Git** in the left sidebar

#### 2. Check "Ignored Build Step"

Look for a section called **"Ignored Build Step"** or **"Custom Build Ignore Command"**

You might see:
```bash
git diff --quiet HEAD^ HEAD ./apps/web ./packages
```

#### 3. Clear the Ignore Command

**Option A: Remove Completely (Recommended)**
- Delete the entire command
- Leave the field empty
- Click **Save**

**Option B: Use Simple Check**
If you want to prevent unnecessary deploys, use:
```bash
[[ "$VERCEL_ENV" == "production" ]]
```
This will only build on production deployments.

#### 4. Redeploy

After saving:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Select **"Redeploy"**
4. Check **"Use existing Build Cache"** should be **UNCHECKED**
5. Click **"Redeploy"**

## Why the Original Command Failed

The original command had multiple issues:

```bash
git diff --quiet HEAD^ HEAD ./apps/web ./packages
```

### Issue 1: First Deployment
- `HEAD^` means "previous commit"
- On first deployment, there IS no previous commit
- Result: `fatal: ambiguous argument './apps/web': unknown revision or path not in the working tree`

### Issue 2: Binary Execution Error
- Vercel's build environment sometimes has issues with certain git commands
- Result: `/usr/bin/git: /usr/bin/git: cannot execute binary file`

### Issue 3: Monorepo Pathing
- The path syntax `./apps/web ./packages` can be ambiguous in Vercel's build context
- May not correctly resolve relative paths

## ✅ Recommended Approach

**For monorepos, DO NOT use ignoreCommand.** Instead:

1. Let Vercel deploy every push to main (simplest, most reliable)
2. Use Vercel's built-in change detection (works automatically)
3. If needed, control deploys with branch protections in Git

## Alternative: Environment-Based Ignore

If you MUST have an ignore command, use environment-based logic:

```bash
# Only deploy to production, skip all previews
[[ "$VERCEL_ENV" != "production" ]]
```

This returns 0 (ignore) for non-production, 1 (build) for production.

## Verification

After making changes:

1. **Check Build Logs**: Should see "Building..." instead of "Ignored Build Step"
2. **No Git Errors**: Build logs should not show any git diff errors
3. **Build Completes**: Next.js build should run and complete successfully

## Related Documentation

- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Complete deployment guide
- [VERCEL_FIX.md](./VERCEL_FIX.md) - npm vs pnpm troubleshooting
- [Vercel Ignored Build Step Docs](https://vercel.com/docs/deployments/configure-a-build#ignored-build-step)

## Quick Reference

| Problem | Solution |
|---------|----------|
| ignoreCommand in vercel.json | Remove it from the file (already done) |
| ignoreCommand in Dashboard | Remove from Settings → Git |
| Cached build using old config | Redeploy without cache |
| Want to skip some deploys | Use `[[ "$VERCEL_ENV" == "production" ]]` |

## Summary

✅ **vercel.json**: Already fixed (no ignoreCommand)
⚠️ **Vercel Dashboard**: Check Settings → Git → Ignored Build Step
🔄 **Redeploy**: Without build cache after clearing
