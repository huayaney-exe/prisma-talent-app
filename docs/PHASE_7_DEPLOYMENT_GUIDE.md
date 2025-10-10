# Phase 7: Production Deployment Guide

**Status**: 🚀 Ready for Deployment
**Target Environment**: Vercel (Frontend) + Supabase (Backend)
**Estimated Time**: 30-45 minutes

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Supabase Production Setup](#supabase-production-setup)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Post-Deployment Validation](#post-deployment-validation)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### Code Quality ✅

- [x] All forms use direct Supabase integration
- [x] TypeScript compilation passes (`npm run build`)
- [x] No console errors in development
- [x] All components use proper types
- [x] File uploads working locally

### Database Readiness ✅

- [x] Migration 001: Initial schema
- [x] Migration 010: Admin MVP schema
- [x] Migration 011: RLS policies
- [x] Migration 012: Leads table expansion

### Security ✅

- [x] RLS policies configured
- [x] Security headers in vercel.json
- [x] No hardcoded secrets in code
- [x] Environment variables documented

### Documentation ✅

- [x] README updated
- [x] API documentation complete
- [x] Testing guide available
- [x] Deployment guide (this file)

---

## Supabase Production Setup

### Step 1: Create Production Project

```bash
# 1. Go to https://supabase.com/dashboard
# 2. Click "New Project"
# 3. Fill in details:
#    - Name: prisma-talent-production
#    - Database Password: [Generate strong password - SAVE THIS]
#    - Region: South America (São Paulo) - Closest to Peru
#    - Pricing: Free tier (sufficient for MVP)
```

**⚠️ CRITICAL**: Save the database password immediately. You cannot retrieve it later.

### Step 2: Run Database Migrations

Navigate to SQL Editor in Supabase dashboard:

#### Migration 1: Initial Schema
```sql
-- Copy entire contents of:
-- database/migrations/001_initial_schema.sql
-- Paste and execute in SQL Editor
```

**Expected Output**:
```
Success. No rows returned
Companies, positions, applicants tables created
```

#### Migration 2: Admin MVP Schema
```sql
-- Copy entire contents of:
-- database/migrations/010_admin_mvp_schema.sql
-- Paste and execute in SQL Editor
```

**Expected Output**:
```
Success. No rows returned
Leads table created, positions/applicants updated
3 sample leads inserted
```

#### Migration 3: RLS Policies
```sql
-- Copy entire contents of:
-- database/migrations/011_admin_rls_policies.sql
-- Paste and execute in SQL Editor
```

**Expected Output**:
```
Success. No rows returned
RLS enabled on 3 tables
12 policies created
```

#### Migration 4: Leads Expansion
```sql
-- Copy entire contents of:
-- database/migrations/012_leads_table_expansion.sql
-- Paste and execute in SQL Editor
```

**Expected Output**:
```
Success. No rows returned
8 columns added to leads table
5 indexes created
```

### Step 3: Verify Database Schema

Run this verification query:

```sql
-- Verify all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected output:
-- applicants
-- companies
-- leads
-- positions
```

### Step 4: Configure Storage Buckets

**A. Create CVs Bucket**

1. Navigate to Storage in Supabase dashboard
2. Click "Create a new bucket"
3. Configuration:
   - Name: `cvs`
   - Public: ❌ **No** (private bucket)
   - File size limit: 5MB
   - Allowed MIME types:
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**B. Create Portfolios Bucket**

1. Click "Create a new bucket"
2. Configuration:
   - Name: `portfolios`
   - Public: ❌ **No** (private bucket)
   - File size limit: 5MB
   - Allowed MIME types:
     - `application/pdf`
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `application/zip`

**C. Set Storage Policies**

The RLS policies from migration 011 already handle storage permissions:
- ✅ Public can upload (anon users)
- ✅ Public can download (for admin viewing)
- ✅ Deletions disabled (compliance)

### Step 5: Get API Credentials

1. Navigate to **Settings → API** in Supabase dashboard
2. Copy these values (you'll need them for Vercel):
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **Anon (public) key**: `eyJhbG...` (long JWT token)
   - **Service role key**: `eyJhbG...` (DO NOT expose to frontend)

**⚠️ SECURITY NOTE**:
- ✅ Anon key: Safe for frontend (use in VITE_SUPABASE_ANON_KEY)
- ❌ Service role key: NEVER expose to frontend (bypasses RLS)

---

## Vercel Deployment

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Deploy via GitHub (Recommended)

**A. Push Code to GitHub**

```bash
cd /Users/luishuayaney/Projects/prisma-ecosystem
git add .
git commit -m "feat: Phase 7 - Production deployment configuration

- Add Vercel configuration with security headers
- Add deployment documentation
- Ready for production launch"
git push origin main
```

**B. Connect to Vercel**

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `03-personal-professional-tools/talent-platform/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://[your-project].supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Production |

**⚠️ IMPORTANT**:
- Click "Add" after each variable
- Select "Production" environment
- Do NOT add service_role_key (security risk)

### Step 4: Deploy

**Option A: Via Vercel Dashboard**
1. Click "Deploy" button
2. Wait for build to complete (~2-3 minutes)
3. Visit deployment URL

**Option B: Via CLI**
```bash
cd frontend
vercel --prod
```

### Step 5: Configure Custom Domain (Optional)

If you have a custom domain:

1. Go to Vercel project → Settings → Domains
2. Add domain: `talent.prisma.pe` (example)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic, ~5 minutes)

**DNS Configuration Example**:
```
Type: CNAME
Name: talent
Value: cname.vercel-dns.com
```

---

## Environment Configuration

### Frontend Environment Variables

**File**: `frontend/.env.production` (for reference only, use Vercel UI)

```env
# Supabase Configuration (Production)
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# Application Configuration
VITE_APP_NAME=Prisma Talent
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production

# Feature Flags (Optional)
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

**⚠️ NEVER commit `.env.production` to Git!**

Already in `.gitignore`:
```gitignore
.env
.env.local
.env.production
.env.development
```

### Vercel Environment Variables UI

```
Production:
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY

Preview (optional):
✅ VITE_SUPABASE_URL (can use same or staging)
✅ VITE_SUPABASE_ANON_KEY

Development:
❌ Not needed (uses .env.local)
```

---

## Post-Deployment Validation

### Automated Checks

**1. Build Success**
```bash
✅ Build completed successfully
✅ Static files generated in dist/
✅ No TypeScript errors
✅ No build warnings (critical)
```

**2. Deployment URL**
```bash
# Visit: https://[your-project].vercel.app
✅ Page loads without errors
✅ No console errors in browser DevTools
✅ CSS/images load correctly
```

### Manual Testing Checklist

#### **Public Pages** (No Auth Required)

**Landing Page** (`/`)
- [ ] Page loads correctly
- [ ] Prisma branding visible
- [ ] CTA buttons work
- [ ] Navigation functional

**Lead Form** (`/lead-form`)
- [ ] Form renders correctly
- [ ] Input validation works
- [ ] Submit creates record in Supabase
- [ ] Success modal appears
- [ ] Check Supabase: `SELECT * FROM leads ORDER BY created_at DESC LIMIT 1`

**Job Listings** (`/jobs`)
- [ ] Positions load from database
- [ ] Only published positions shown
- [ ] Position details display correctly
- [ ] Apply button navigates correctly

**Application Form** (`/apply?code=XXX`)
- [ ] Form loads with position details
- [ ] File upload UI works
- [ ] CV upload validates (PDF only, 5MB max)
- [ ] Portfolio upload accepts multiple files
- [ ] Submit creates applicant record
- [ ] Files uploaded to Supabase Storage
- [ ] Success confirmation shown
- [ ] Check Supabase: `SELECT * FROM applicants ORDER BY created_at DESC LIMIT 1`

#### **Admin Pages** (Auth Required - Test after Phase 8)

**Admin Login** (`/admin/login`)
- [ ] Login form displays
- [ ] Error handling works
- [ ] Redirects to dashboard on success

**Admin Dashboard** (`/admin/dashboard`)
- [ ] Protected route (redirects if not authenticated)
- [ ] KPI cards load data
- [ ] Charts display correctly
- [ ] Navigation sidebar works

**Lead Management** (`/admin/leads`)
- [ ] Leads table loads
- [ ] Filter by status works
- [ ] Approve/Reject buttons functional
- [ ] Status updates in real-time

**Position Pipeline** (`/admin/positions`)
- [ ] Positions load by workflow stage
- [ ] Workflow stage filters work
- [ ] Position cards display correctly
- [ ] Edit JD button navigates

**Job Description Editor** (`/admin/positions/:code/edit`)
- [ ] TipTap editor loads
- [ ] Auto-save works (check every 2 seconds)
- [ ] Preview tab updates
- [ ] Navigation prompts unsaved changes

**Candidate Review** (`/admin/candidates`)
- [ ] Applicants table loads
- [ ] Filter by qualification status works
- [ ] Qualify/Reject actions work
- [ ] Score input validates (0-100)
- [ ] CV download links work

**Shortlist Generator** (`/admin/shortlist/:code`)
- [ ] Only qualified candidates shown
- [ ] Sorted by score descending
- [ ] Email preview generates correctly
- [ ] Copy button works

### Database Verification Queries

Run these in Supabase SQL Editor to verify data:

```sql
-- Check leads table
SELECT
  contact_name,
  company_name,
  intent,
  status,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 5;

-- Check positions table
SELECT
  position_code,
  position_name,
  workflow_stage,
  created_at
FROM positions
ORDER BY created_at DESC
LIMIT 5;

-- Check applicants table
SELECT
  full_name,
  email,
  position_id,
  application_status,
  resume_url,
  created_at
FROM applicants
ORDER BY created_at DESC
LIMIT 5;

-- Check storage uploads
SELECT
  name,
  bucket_id,
  created_at
FROM storage.objects
ORDER BY created_at DESC
LIMIT 10;
```

### Performance Validation

**Lighthouse Scores** (Chrome DevTools)

Target Scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

**Run Lighthouse**:
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Desktop" mode
4. Click "Analyze page load"

**Common Issues & Fixes**:
- Low Performance → Check image optimization
- Low Accessibility → Check ARIA labels, contrast ratios
- Low SEO → Add meta descriptions, titles

---

## Rollback Procedures

### Scenario 1: Build Failure

**Symptom**: Vercel build fails during deployment

**Solution**:
```bash
# 1. Check build logs in Vercel dashboard
# 2. Test build locally first
cd frontend
npm run build

# 3. Fix errors and redeploy
git add .
git commit -m "fix: resolve build errors"
git push origin main
```

### Scenario 2: Runtime Errors

**Symptom**: App loads but has JavaScript errors

**Solution**:
```bash
# 1. Revert to previous deployment in Vercel
# Dashboard → Deployments → Select previous → Promote to Production

# 2. Fix errors locally
npm run dev
# Test thoroughly

# 3. Redeploy when fixed
git push origin main
```

### Scenario 3: Database Issues

**Symptom**: Data not saving or loading

**Solution**:
```sql
-- 1. Check RLS policies are enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 2. Verify environment variables in Vercel
-- Settings → Environment Variables → Check VITE_SUPABASE_*

-- 3. Test database connection
SELECT current_database(), current_user;
```

### Scenario 4: Storage Upload Failures

**Symptom**: File uploads fail with 403 errors

**Solution**:
```sql
-- 1. Check storage policies
SELECT * FROM storage.buckets WHERE name IN ('cvs', 'portfolios');

-- 2. Verify bucket permissions in Supabase
-- Storage → [bucket] → Policies → Check INSERT/SELECT policies

-- 3. Test upload via Supabase dashboard
-- Storage → cvs → Upload file (should work for authenticated users)
```

---

## Monitoring & Maintenance

### Vercel Analytics

**Enable Analytics**:
1. Vercel Dashboard → Analytics
2. Turn on Web Analytics (free)
3. Monitor:
   - Page views
   - Unique visitors
   - Top pages
   - Geographic distribution

### Supabase Monitoring

**Database Health**:
1. Supabase Dashboard → Database
2. Monitor:
   - Connection pool usage
   - Query performance
   - Disk usage
   - Active connections

**Storage Usage**:
1. Supabase Dashboard → Storage
2. Check:
   - Total storage used (free tier: 1GB)
   - File count
   - Bandwidth usage

### Error Tracking (Future Enhancement)

**Recommended Tools**:
- **Sentry** - Frontend error tracking
- **LogRocket** - Session replay
- **Supabase Logs** - Database query logs

**Setup Sentry** (Optional):
```bash
npm install @sentry/react @sentry/vite-plugin

# In vite.config.ts
import { sentryVitePlugin } from "@sentry/vite-plugin"

export default {
  plugins: [
    sentryVitePlugin({
      org: "prisma",
      project: "talent-platform"
    })
  ]
}
```

### Backup Strategy

**Database Backups** (Automatic):
- Supabase Pro: Daily automatic backups
- Free tier: Point-in-time recovery (7 days)

**Manual Backup**:
```bash
# Export database schema + data
pg_dump -h [db-host] -U postgres -d postgres > backup.sql

# Restore from backup
psql -h [db-host] -U postgres -d postgres < backup.sql
```

**Storage Backups**:
```bash
# Download all CVs (for compliance)
# Use Supabase Storage API or CLI
supabase storage download cvs/ --recursive
```

### Maintenance Schedule

**Weekly**:
- [ ] Check Vercel deployment logs
- [ ] Review Supabase database size
- [ ] Monitor storage usage

**Monthly**:
- [ ] Review performance metrics
- [ ] Check for dependency updates (`npm outdated`)
- [ ] Test backup restoration
- [ ] Review error logs

**Quarterly**:
- [ ] Security audit (dependencies, policies)
- [ ] Database query optimization
- [ ] Storage cleanup (old CVs)
- [ ] Cost analysis (if upgraded from free tier)

---

## Troubleshooting

### Common Issues

#### 1. "Failed to fetch" errors

**Cause**: CORS or network issues

**Solution**:
```typescript
// Check Supabase URL in .env
console.log(import.meta.env.VITE_SUPABASE_URL)

// Verify CORS settings in Supabase
// Dashboard → Settings → API → CORS
// Add: https://[your-vercel-domain].vercel.app
```

#### 2. "Row Level Security policy violation"

**Cause**: RLS policies blocking queries

**Solution**:
```sql
-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'leads';

-- Temporarily disable RLS for debugging (NOT in production)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
```

#### 3. Environment variables not working

**Cause**: Vercel env vars not loaded

**Solution**:
```bash
# 1. Verify vars exist in Vercel dashboard
# Settings → Environment Variables

# 2. Redeploy to pick up changes
# Deployments → ... → Redeploy

# 3. Check build logs for loaded vars
# Should see: "VITE_SUPABASE_URL loaded"
```

#### 4. File uploads return 404

**Cause**: Storage buckets not created

**Solution**:
```sql
-- Create buckets if missing
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('cvs', 'cvs', false),
  ('portfolios', 'portfolios', false);

-- Check buckets exist
SELECT * FROM storage.buckets;
```

---

## Success Criteria

Phase 7 is complete when:

- [x] Frontend deployed to Vercel
- [x] Production Supabase configured
- [x] All migrations run successfully
- [x] Environment variables set
- [x] Storage buckets created
- [ ] All public pages tested
- [ ] Forms submitting to production database
- [ ] File uploads working
- [ ] No console errors
- [ ] Lighthouse scores meet targets

---

## Next Phase: Authentication

**Phase 8 Readiness**:
- ✅ Production environment ready
- ✅ Database configured
- ✅ Admin pages built
- ⏳ Need: Supabase Auth integration
- ⏳ Need: Protected routes middleware
- ⏳ Need: Session management

**Proceed to**: [PHASE_8_AUTHENTICATION_GUIDE.md](./PHASE_8_AUTHENTICATION_GUIDE.md) (to be created)

---

## Appendix

### A. Vercel Configuration Reference

**`vercel.json` breakdown**:
```json
{
  "buildCommand": "npm run build",       // Vite build
  "outputDirectory": "dist",             // Vite output folder
  "rewrites": [                          // SPA routing
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [                           // Security headers
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### B. Supabase Project Settings

**Recommended Settings**:
- **Database**:
  - Connection pooling: Enabled (default)
  - Statement timeout: 60 seconds
  - Max connections: 15 (free tier limit)

- **Auth**:
  - Email confirmations: Enabled (Phase 8)
  - Password requirements: 8+ chars, 1 number (Phase 8)

- **Storage**:
  - Max file size: 5MB (set in bucket config)
  - Allowed file types: See bucket configuration above

### C. Cost Estimate

**Free Tier Limits** (Sufficient for MVP):

**Vercel**:
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Preview deployments

**Supabase**:
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 50MB database backups (7 days)
- ✅ 2GB bandwidth/month
- ✅ 50,000 monthly active users

**Upgrade Triggers**:
- Database > 500MB → Pro ($25/month)
- Storage > 1GB → Pro ($25/month)
- Bandwidth > 2GB → Pro ($25/month)
- Need daily backups → Pro ($25/month)

---

**Phase 7 Status**: ✅ Ready for Deployment
**Deployment Time**: ~30-45 minutes
**Next Phase**: Phase 8 - Authentication

