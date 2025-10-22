# Vercel Deployment - Environment Variables

## 📍 Location
**Frontend .env file:** `frontend/.env`

## 🔐 Environment Variables for Vercel

Configure these in **Vercel Dashboard → Project Settings → Environment Variables**:

### Required Variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://vhjjibfblrkyfzcukqwa.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>

# App Configuration
VITE_APP_NAME=Prisma Talent
VITE_APP_URL=https://your-domain.vercel.app

# API Configuration (Optional - not used in direct Supabase integration)
VITE_API_URL=https://your-backend-url.com
VITE_API_BASE_URL=https://your-backend-url.com/api/v1
```

---

## 🔑 How to Get Supabase Keys

1. **Go to Supabase Dashboard**: https://app.supabase.com/project/vhjjibfblrkyfzcukqwa

2. **Navigate to:** Settings → API

3. **Copy the following:**
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public key** → Use for `VITE_SUPABASE_ANON_KEY`

**⚠️ IMPORTANT:** Use the `anon` key, NOT the `service_role` key (service_role bypasses RLS security)

---

## 📋 Step-by-Step Vercel Configuration

### 1. In Vercel Dashboard:
1. Go to your project: https://vercel.com/dashboard
2. Click on your **prisma-talent-app** project
3. Go to **Settings** → **Environment Variables**

### 2. Add Each Variable:
```
Key: VITE_SUPABASE_URL
Value: https://vhjjibfblrkyfzcukqwa.supabase.co
Environment: Production, Preview, Development (select all)
```

```
Key: VITE_SUPABASE_ANON_KEY
Value: <paste your anon key from Supabase>
Environment: Production, Preview, Development (select all)
```

```
Key: VITE_APP_NAME
Value: Prisma Talent
Environment: Production, Preview, Development (select all)
```

```
Key: VITE_APP_URL
Value: https://your-production-domain.vercel.app
Environment: Production only
```

### 3. Redeploy:
After adding variables, click **Deployments** → **Redeploy** on the latest deployment

---

## 🚀 Current .env File Contents

**File:** `frontend/.env`

```bash
# API
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Supabase
VITE_SUPABASE_URL=https://vhjjibfblrkyfzcukqwa.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# App
VITE_APP_NAME="Prisma Talent"
VITE_APP_URL=http://localhost:3000
```

**⚠️ Note:** The actual Supabase anon key is NOT committed to git (as it should be). You need to get it from Supabase dashboard.

---

## 🔒 Security Notes

✅ **Safe to expose (public):**
- `VITE_SUPABASE_URL` - Public URL
- `VITE_SUPABASE_ANON_KEY` - Public key (protected by RLS policies)
- `VITE_APP_NAME` - Just the app name
- `VITE_APP_URL` - Public URL

❌ **NEVER expose:**
- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses all security
- Database passwords
- Private API keys

---

## 🧪 Testing Deployment

After deployment, verify environment variables are loaded:

1. Open browser console on deployed site
2. Check: `import.meta.env.VITE_SUPABASE_URL`
3. Should show: `https://vhjjibfblrkyfzcukqwa.supabase.co`

If it shows `undefined`, the environment variables weren't loaded correctly.

---

## 📝 Quick Checklist for Engineer

- [ ] Get Supabase anon key from: https://app.supabase.com/project/vhjjibfblrkyfzcukqwa/settings/api
- [ ] Add `VITE_SUPABASE_URL` to Vercel env vars
- [ ] Add `VITE_SUPABASE_ANON_KEY` to Vercel env vars
- [ ] Add `VITE_APP_NAME` to Vercel env vars
- [ ] Add `VITE_APP_URL` to Vercel env vars (use your Vercel domain)
- [ ] Select "Production, Preview, Development" for all variables
- [ ] Redeploy from Vercel dashboard
- [ ] Test login at `https://your-domain.vercel.app/admin/login`

---

## 🆘 Troubleshooting

**Problem:** "Supabase client not initialized"
**Solution:** Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

**Problem:** Environment variables not loading
**Solution:** In Vercel, make sure you selected all environments (Production, Preview, Development)

**Problem:** Build fails
**Solution:** Check that all `VITE_*` variables are prefixed correctly (Vite requires `VITE_` prefix)

---

## 🔗 Useful Links

- **Supabase Dashboard:** https://app.supabase.com/project/vhjjibfblrkyfzcukqwa
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/huayaney-exe/prisma-talent-app
