# Fix: Anthropic API Key Not Detected in Vercel

## 🔴 Problem
Vercel is not detecting `ANTHROPIC_API_KEY` even though it's configured.

## 🎯 Root Cause
The old `vercel.json` syntax with `@` prefixes (like `"@anthropic_api_key"`) is outdated. Vercel now uses the Dashboard UI for environment variables, not vercel.json.

---

## ✅ Solution: Set Environment Variables in Vercel Dashboard

### Step 1: Go to Vercel Environment Variables

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **AI-Coding-Interactive-Tutor**
3. Go to **Settings** → **Environment Variables**

### Step 2: Add ANTHROPIC_API_KEY

Click **"Add New"** and configure:

```
┌──────────────────────────────────────────────┐
│ Key                                          │
│ ANTHROPIC_API_KEY                            │
├──────────────────────────────────────────────┤
│ Value                                        │
│ sk-ant-api03-your-actual-key-here            │
├──────────────────────────────────────────────┤
│ Environment                                  │
│ ☑ Production                                 │
│ ☑ Preview                                    │
│ ☑ Development                                │
└──────────────────────────────────────────────┘
```

**Important**:
- ✅ Check **all three** environments for now (you can use different keys later)
- ✅ Use the **actual key value**, not a reference like `@anthropic_api_key`
- ✅ Make sure there are **no extra spaces** before or after the key

### Step 3: Add Other Required Variables

Repeat for all required variables:

#### DATABASE_URL
```
Key:   DATABASE_URL
Value: postgresql://user:pass@host.neon.tech/database?sslmode=require
Envs:  ☑ Production ☑ Preview ☑ Development
```

#### NEXTAUTH_SECRET
```
Key:   NEXTAUTH_SECRET
Value: [Generate with: openssl rand -base64 32]
Envs:  ☑ Production ☑ Preview ☑ Development
```

#### NEXTAUTH_URL
```
Key:   NEXTAUTH_URL
Value: https://your-app.vercel.app
Envs:  ☑ Production
```

```
Key:   NEXTAUTH_URL
Value: http://localhost:3000
Envs:  ☑ Development
```

For Preview, you can use:
```
Key:   NEXTAUTH_URL
Value: https://$VERCEL_URL
Envs:  ☑ Preview
```

#### NEXT_PUBLIC_APP_URL (Optional)
```
Key:   NEXT_PUBLIC_APP_URL
Value: https://your-app.vercel.app
Envs:  ☑ Production
```

### Step 4: Save All Variables

After adding each variable, click **"Save"**.

Your final list should look like this:

```
Environment Variables (4-5 total)

ANTHROPIC_API_KEY
└─ Set for Production, Preview, Development

DATABASE_URL
└─ Set for Production, Preview, Development

NEXTAUTH_SECRET
└─ Set for Production, Preview, Development

NEXTAUTH_URL
└─ Set for Production, Preview, Development

NEXT_PUBLIC_APP_URL (optional)
└─ Set for Production
```

---

## 🔄 Step 5: Redeploy

After adding environment variables:

### Option A: Automatic Redeploy
```bash
# Push any change to trigger redeploy
git commit --allow-empty -m "Trigger redeploy with env vars"
git push origin main
```

### Option B: Manual Redeploy
1. Go to **Deployments** tab in Vercel
2. Find your latest deployment
3. Click **"..."** menu → **"Redeploy"**
4. Check **"Use existing Build Cache"** → **Redeploy**

---

## 🔍 Step 6: Verify Environment Variables

### Check Deployment Logs

1. Go to **Deployments** tab
2. Click on the running deployment
3. Click **"View Function Logs"**
4. Look for any errors mentioning `ANTHROPIC_API_KEY`

### Test the API Route

After deployment, test the tutor endpoint:

```bash
# Replace with your Vercel URL
curl https://your-app.vercel.app/api/tutor \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userText":"Hello","context":{}}'
```

Should return a valid response, not an API key error.

---

## 🐛 Troubleshooting

### Issue: "ANTHROPIC_API_KEY is not defined"

**Possible causes:**

1. **Variable not saved in Vercel**
   - Go back to Settings → Environment Variables
   - Verify `ANTHROPIC_API_KEY` is listed
   - Check it's enabled for "Production" environment

2. **Typo in variable name**
   - Vercel key: `ANTHROPIC_API_KEY` (with underscore)
   - Code expects: `ANTHROPIC_API_KEY` (must match exactly)
   - Check your API route code

3. **Not redeployed after adding variable**
   - New env vars require a redeploy to take effect
   - Click "Redeploy" in Vercel dashboard

4. **API key is invalid**
   - Test your key at [Anthropic Console](https://console.anthropic.com)
   - Regenerate if needed
   - Update in Vercel

### Issue: "Invalid API Key"

**Check your key format:**
```
✅ Correct: sk-ant-api03-XXXXXXXXXXXXXXX
❌ Wrong:   ant-api03-XXXXXXXXXXXXXXX (missing sk-)
❌ Wrong:   sk-ant-XXXXXXXXXXXXXXX (missing api03)
```

**Verify in Anthropic Console:**
1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Check if key is active
3. Copy the correct key
4. Update in Vercel

### Issue: Variable shows in Vercel but not in app

**Check environment scope:**
- If testing production: Must be checked for "Production"
- If testing preview: Must be checked for "Preview"
- Variable must match the deployment type

**Force clear cache:**
1. Settings → General → Clear Build Cache
2. Redeploy

---

## 📋 Checklist

Before your app will work:

- [ ] ANTHROPIC_API_KEY added in Vercel
- [ ] DATABASE_URL added in Vercel
- [ ] NEXTAUTH_SECRET added in Vercel
- [ ] NEXTAUTH_URL added in Vercel
- [ ] All variables checked for correct environments
- [ ] Redeployed after adding variables
- [ ] Tested API endpoint returns valid response
- [ ] No errors in Function Logs

---

## 🧪 Test Locally First

Before deploying, test that your API key works locally:

```bash
# In your project root
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key" >> apps/web/.env.local

# Start dev server
pnpm dev

# Test in browser
# Visit http://localhost:3000/learn
# Try asking the AI tutor a question
```

If it works locally but not on Vercel:
- Double-check the key in Vercel matches your local `.env.local`
- Verify you've redeployed after adding the variable

---

## 🔐 Security Best Practices

### DO:
✅ Use different API keys for dev/staging/production
✅ Set usage limits in Anthropic Console
✅ Monitor API usage regularly
✅ Rotate keys periodically
✅ Never commit API keys to git

### DON'T:
❌ Use production keys in development
❌ Share API keys publicly
❌ Commit `.env.local` to git
❌ Use the same key across multiple projects
❌ Leave keys in screenshots/logs

---

## 📊 Verify Setup

After completing all steps, your Vercel deployment should:

✅ Build successfully
✅ Have all environment variables set
✅ API routes work without errors
✅ Anthropic API calls succeed
✅ Database connections work

Test by visiting: `https://your-app.vercel.app/learn`

---

## 🆘 Still Having Issues?

### Check Vercel Function Logs

1. Deployments → [Latest Deployment]
2. Click "View Function Logs"
3. Look for error messages
4. Common errors:
   - `ANTHROPIC_API_KEY is not defined` → Variable not set
   - `Invalid API key` → Wrong key or format
   - `401 Unauthorized` → Key is invalid/expired

### Check Anthropic API Status

Visit [Anthropic Status Page](https://status.anthropic.com) to ensure API is operational.

### Get API Key Details

```bash
# Check key format (should show masked version)
echo $ANTHROPIC_API_KEY | cut -c1-20

# Should show: sk-ant-api03-XXXXXX
```

---

## 📚 Related Documentation

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Anthropic API Keys](https://console.anthropic.com/settings/keys)
- [VERCEL_ENVIRONMENT_SETUP.md](./VERCEL_ENVIRONMENT_SETUP.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## ✅ Quick Reference

| Step | Command/Action |
|------|----------------|
| Add env var | Vercel Dashboard → Settings → Environment Variables |
| Test locally | `echo "ANTHROPIC_API_KEY=..." >> .env.local` |
| Redeploy | Vercel Dashboard → Deployments → Redeploy |
| Check logs | Deployments → View Function Logs |
| Test API | `curl https://your-app.vercel.app/api/tutor` |

🎉 **Your API key should now work!**
