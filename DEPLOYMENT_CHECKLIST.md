# 🚀 Production Deployment Checklist

**Quick reference for deploying Prisma Talent Platform to production**

---

## ⏱️ Estimated Time: 30-45 minutes

---

## 📋 Pre-Flight Checks

### Code Quality
- [ ] `npm run build` passes without errors
- [ ] `npm run dev` runs without console errors
- [ ] All TypeScript types correct
- [ ] All forms tested locally

### Git
- [ ] All changes committed
- [ ] Pushed to `main` branch
- [ ] GitHub repository accessible

---

## 🗄️ Supabase Setup (15-20 min)

### 1. Create Project
- [ ] Go to [supabase.com/dashboard](https://supabase.com/dashboard)
- [ ] Click "New Project"
- [ ] Name: `prisma-talent-production`
- [ ] Region: **South America (São Paulo)**
- [ ] Generate strong database password
- [ ] **⚠️ SAVE PASSWORD IMMEDIATELY**

### 2. Run Migrations (SQL Editor)
- [ ] Run `001_initial_schema.sql` ✅
- [ ] Run `010_admin_mvp_schema.sql` ✅
- [ ] Run `011_admin_rls_policies.sql` ✅
- [ ] Run `012_leads_table_expansion.sql` ✅

### 3. Verify Database
```sql
-- Run this query - should return 4 tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
- [ ] Tables exist: `applicants`, `companies`, `leads`, `positions`

### 4. Create Storage Buckets

**CVs Bucket:**
- [ ] Name: `cvs`
- [ ] Public: ❌ **No**
- [ ] File size: **5MB**
- [ ] MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Portfolios Bucket:**
- [ ] Name: `portfolios`
- [ ] Public: ❌ **No**
- [ ] File size: **5MB**
- [ ] MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/gif`, `application/zip`

### 5. Get API Keys
Navigate to **Settings → API**:
- [ ] Copy **Project URL**: `https://[ref].supabase.co`
- [ ] Copy **anon public key**: `eyJhbG...`
- [ ] ⚠️ **DO NOT** copy service_role key (security risk)

---

## ▲ Vercel Deployment (10-15 min)

### 1. Connect Repository
- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Import GitHub repository
- [ ] Select `prisma-ecosystem` repo

### 2. Configure Build
- [ ] Framework: **Vite**
- [ ] Root Directory: `03-personal-professional-tools/talent-platform/frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

### 3. Environment Variables

Add these in Vercel project settings:

| Variable | Value | Source |
|----------|-------|--------|
| `VITE_SUPABASE_URL` | `https://[ref].supabase.co` | Supabase Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Settings → API |

- [ ] `VITE_SUPABASE_URL` added ✅
- [ ] `VITE_SUPABASE_ANON_KEY` added ✅
- [ ] Environment set to **Production** ✅

### 4. Deploy
- [ ] Click **"Deploy"** button
- [ ] Wait for build (~2-3 minutes)
- [ ] Build succeeds ✅
- [ ] Visit deployment URL

---

## ✅ Post-Deployment Testing (10-15 min)

### Automated Checks
- [ ] Deployment URL loads without errors
- [ ] No console errors in browser DevTools (F12)
- [ ] CSS and images load correctly
- [ ] Navigation works

### Form Testing

**Lead Form** (`/lead-form`)
1. [ ] Fill contact info
2. [ ] Select intent: "Quiero contratar talento"
3. [ ] Fill position details
4. [ ] Submit form
5. [ ] Success modal appears
6. [ ] Verify in Supabase: `SELECT * FROM leads ORDER BY created_at DESC LIMIT 1`

**Application Form** (`/apply?code=TEST001`)
1. [ ] Fill personal info
2. [ ] Upload CV (PDF)
3. [ ] Upload portfolio (optional)
4. [ ] Submit form
5. [ ] Success confirmation
6. [ ] Verify in Supabase: `SELECT * FROM applicants ORDER BY created_at DESC LIMIT 1`
7. [ ] Check files in Storage → cvs bucket

### Admin Pages (After Phase 8 Auth)
- [ ] `/admin/login` - Login form displays
- [ ] `/admin/dashboard` - Protected route redirects
- [ ] `/admin/leads` - Leads table loads
- [ ] `/admin/positions` - Positions pipeline loads
- [ ] `/admin/candidates` - Applicants table loads

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ Frontend accessible at Vercel URL
- ✅ Database migrations applied
- ✅ Storage buckets created
- ✅ Environment variables configured
- ✅ Lead form submits successfully
- ✅ Application form uploads files
- ✅ No console errors
- ✅ Data appears in Supabase tables

---

## 🔥 Rollback Plan

### If deployment fails:

**Vercel:**
1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click **"Promote to Production"**

**Database:**
1. Supabase has automatic point-in-time recovery (7 days)
2. Or drop tables and re-run migrations

**Quick Rollback:**
```bash
# Revert to previous commit
git revert HEAD
git push origin main
# Vercel auto-deploys
```

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Deployment Guide**: `docs/PHASE_7_DEPLOYMENT_GUIDE.md` (detailed walkthrough)

---

## 🎉 Post-Deployment

After successful deployment:

1. **Share URL** with stakeholders
2. **Monitor analytics** (Vercel Dashboard)
3. **Check database usage** (Supabase Dashboard)
4. **Plan Phase 8**: Authentication implementation

---

**Deployment completed?** Proceed to **Phase 8: Authentication** 🔐
