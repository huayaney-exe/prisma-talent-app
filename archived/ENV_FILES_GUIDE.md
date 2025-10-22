# Environment Files Guide - Prisma Talent Platform

Complete guide for environment variable configuration across all environments.

---

## 📁 Environment Files Structure

```
talent-platform/
├── frontend/
│   ├── .env                    # Git-ignored, local development (auto-loaded)
│   ├── .env.local             # Template for local development
│   ├── .env.production        # Production configuration template
│   └── .env.example           # Public example (committed to git)
└── backend/
    └── .env.example           # Backend example (not used in direct Supabase)
```

---

## 🔑 How to Get Your Supabase Keys

### Step 1: Access Supabase Dashboard
Go to: https://app.supabase.com/project/vhjjibfblrkyfzcukqwa/settings/api

### Step 2: Copy Keys
You'll see two sections:

**Project URL:**
```
https://vhjjibfblrkyfzcukqwa.supabase.co
```

**API Keys:**
- **anon public** ← Use this for frontend (safe to expose)
- **service_role** ← NEVER use in frontend (bypasses security)

### Step 3: Copy the `anon` Key
It looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoampqYmZibHJreWZ6Y3VrcXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY1MjYwMzEsImV4cCI6MjA0MjEwMjAzMX0.XXXXXXXXXXXXXXXXX
```

---

## 🖥️ Local Development Setup

### 1. Create `frontend/.env` File

```bash
cd frontend
cp .env.local .env
```

### 2. Edit `frontend/.env`

Replace `YOUR_ACTUAL_KEY_HERE` with your real Supabase anon key:

```env
# Prisma Talent Frontend - Local Development

# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://vhjjibfblrkyfzcukqwa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_REAL_KEY

# App
VITE_APP_NAME=Prisma Talent
VITE_APP_URL=http://localhost:3000

# Optional
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ENABLE_DEBUG=true
```

### 3. Start Development Server

```bash
npm run dev
```

Your app will run at `http://localhost:3000` with Supabase connected.

---

## 🚀 Production Deployment (Vercel)

### Environment Variables to Add in Vercel Dashboard

**Location:** Vercel Dashboard → Your Project → Settings → Environment Variables

Add these **4 required variables**:

#### 1. VITE_SUPABASE_URL
```
Key: VITE_SUPABASE_URL
Value: https://vhjjibfblrkyfzcukqwa.supabase.co
Environments: ☑ Production ☑ Preview ☑ Development
```

#### 2. VITE_SUPABASE_ANON_KEY
```
Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_REAL_KEY
Environments: ☑ Production ☑ Preview ☑ Development
```

#### 3. VITE_APP_NAME
```
Key: VITE_APP_NAME
Value: Prisma Talent
Environments: ☑ Production ☑ Preview ☑ Development
```

#### 4. VITE_APP_URL
```
Key: VITE_APP_URL
Value: https://your-vercel-domain.vercel.app
Environments: ☑ Production ☑ Preview
```

### After Adding Variables
1. Go to **Deployments**
2. Click **Redeploy** on latest deployment
3. Wait for build to complete
4. Test: `https://your-domain.vercel.app/admin/login`

---

## 🔐 Security Best Practices

### ✅ Safe to Commit to Git
- `.env.example` - Template with placeholder values
- `.env.local` - Template with placeholder values
- `.env.production` - Template with placeholder values

### ❌ NEVER Commit to Git
- `.env` - Contains real credentials
- Any file with actual Supabase keys
- Service role keys

### .gitignore Configuration
```gitignore
# Environment variables
.env
.env.local
.env.*.local
.env.production.local

# Keep templates
!.env.example
!.env.local
!.env.production
```

**Note:** The template files (.env.local, .env.production) have placeholder keys that need to be replaced.

---

## 🧪 Testing Environment Variables

### Test Locally

```bash
# Start dev server
npm run dev

# Open browser console at http://localhost:3000
# Check if variables are loaded:
console.log(import.meta.env.VITE_SUPABASE_URL)
# Should output: https://vhjjibfblrkyfzcukqwa.supabase.co

console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
# Should output: eyJhbGc... (your key)
```

### Test Production

```bash
# After Vercel deployment
# Open browser console at your Vercel URL
console.log(import.meta.env.VITE_SUPABASE_URL)
# Should output: https://vhjjibfblrkyfzcukqwa.supabase.co
```

If you see `undefined`, the environment variables weren't loaded.

---

## 📋 Environment Variable Reference

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key | `eyJhbGc...` | ✅ Yes |
| `VITE_APP_NAME` | Application name | `Prisma Talent` | ✅ Yes |
| `VITE_APP_URL` | App base URL | `https://talent.prisma.pe` | ✅ Yes |

### Optional Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL (if used) | `https://api.prisma.pe` | ❌ No |
| `VITE_API_BASE_URL` | API base path | `https://api.prisma.pe/v1` | ❌ No |
| `VITE_ENABLE_DEBUG` | Debug mode | `true` / `false` | ❌ No |
| `VITE_ENABLE_ANALYTICS` | Analytics tracking | `true` / `false` | ❌ No |

### Future Variables (Not Yet Used)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_GA_TRACKING_ID` | Google Analytics | `G-XXXXXXXXXX` |
| `VITE_HOTJAR_ID` | Hotjar tracking | `1234567` |
| `VITE_SENTRY_DSN` | Error tracking | `https://xxx@sentry.io/xxx` |

---

## 🔄 Updating Environment Variables

### Local Development
1. Edit `frontend/.env`
2. Restart dev server (`npm run dev`)
3. Refresh browser

### Vercel Production
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Edit the variable value
3. Click **Save**
4. Go to Deployments → **Redeploy** latest deployment
5. Wait for rebuild

**Important:** Changing env vars requires a redeploy to take effect.

---

## 🐛 Troubleshooting

### Problem: "Supabase client not initialized"
**Cause:** Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`

**Solution:**
1. Check `.env` file exists in `frontend/` directory
2. Verify both variables are set with real values
3. Restart dev server

### Problem: Environment variables are `undefined`
**Cause:** Variables don't have `VITE_` prefix or not loaded correctly

**Solution:**
1. All Vite env vars MUST start with `VITE_`
2. Restart dev server after editing `.env`
3. Check for typos in variable names

### Problem: "Invalid API key" from Supabase
**Cause:** Using wrong key or expired key

**Solution:**
1. Go to Supabase dashboard
2. Copy fresh anon key from Settings → API
3. Update `.env` file
4. Restart server

### Problem: Vercel build succeeds but app doesn't work
**Cause:** Environment variables not set in Vercel

**Solution:**
1. Verify all 4 required variables in Vercel dashboard
2. Check that "Production" environment is selected
3. Redeploy after adding variables

### Problem: RLS policies blocking database access
**Cause:** Using wrong Supabase key or RLS not configured

**Solution:**
1. Ensure using `anon` key, not `service_role`
2. Check RLS policies in Supabase dashboard
3. Verify admin user has @prisma email domain

---

## 📞 Quick Reference

### Get Supabase Keys
🔗 https://app.supabase.com/project/vhjjibfblrkyfzcukqwa/settings/api

### Configure Vercel
🔗 https://vercel.com/dashboard → Your Project → Settings → Environment Variables

### Test Deployment
🔗 https://your-domain.vercel.app/admin/login

### Database Dashboard
🔗 https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/editor

---

## ✅ Environment Setup Checklist

### Local Development
- [ ] Created `frontend/.env` from template
- [ ] Added real Supabase URL
- [ ] Added real Supabase anon key
- [ ] Tested: `npm run dev` starts successfully
- [ ] Tested: Can access http://localhost:3000
- [ ] Tested: Supabase connection works (submit lead form)

### Vercel Production
- [ ] Added `VITE_SUPABASE_URL` to Vercel
- [ ] Added `VITE_SUPABASE_ANON_KEY` to Vercel
- [ ] Added `VITE_APP_NAME` to Vercel
- [ ] Added `VITE_APP_URL` to Vercel
- [ ] Selected all environments for each variable
- [ ] Redeployed after adding variables
- [ ] Tested: Production URL loads
- [ ] Tested: Admin login works
- [ ] Tested: Lead form submission works

---

**Last Updated:** October 2025
**Status:** ✅ Ready for deployment
**Next Steps:** Run database migrations, create admin user, deploy to Vercel
