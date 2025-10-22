# Database Readiness Report - Supabase Production

**Project:** Prisma Talent Platform
**Supabase Project:** vhjjibfblrkyfzcukqwa
**Date:** October 2025
**Status:** ⚠️ REQUIRES MIGRATION EXECUTION

---

## 📊 Current State

### Supabase Project URL
```
https://vhjjibfblrkyfzcukqwa.supabase.co
```

### Migration Files Available (12 total)
✅ Local migrations exist and ready to run:

1. `001_initial_schema.sql` - Core tables (companies, hr_users, positions, job_descriptions, applicants)
2. `002_rls_policies.sql` - Row Level Security policies
3. `003_indexes.sql` - Performance indexes
4. `004_sample_data.sql` - Sample/seed data for testing
5. `005_add_prisma_admins.sql` - Admin user setup
6. `006_rls_policies_update.sql` - Updated RLS policies
7. `007_triggers.sql` - Database triggers (updated_at, etc.)
8. `010_admin_mvp_schema.sql` - Admin dashboard tables (leads table)
9. `011_admin_rls_policies.sql` - Admin RLS policies
10. `012_leads_table_expansion.sql` - Additional lead fields

---

## 🔍 Database Schema Analysis

### Core Tables (from 001_initial_schema.sql)

#### 1. `companies` Table
- Multi-tenant root table
- Fields: company_name, company_domain, industry, subscription_status
- Primary contact information
- Trial/subscription management

#### 2. `hr_users` Table
- HR user accounts (linked to companies)
- Flat role model: company_admin, hr_manager, hr_user
- Permission flags: can_create_positions, can_manage_team, can_view_analytics

#### 3. `positions` Table
- Core position/job tracking
- Workflow stages: hr_draft → hr_completed → leader_completed → validated → active → filled
- HR Form 1 fields: position_name, area, seniority, leader info, salary, contract
- Leader Form 2 fields: work_arrangement, team_size, autonomy_level, success_kpi
- JSONB for area-specific data (flexible schema)

#### 4. `job_descriptions` Table
- AI-generated job descriptions
- Validation workflow (HR + Leader approval)
- Versioning support
- Generation metadata (prompt, model used)

#### 5. `applicants` Table
- Candidate applications
- Personal info: name, email, phone, LinkedIn, portfolio
- File storage: resume_url, portfolio_files (JSONB array)
- Status tracking: applied → hr_reviewing → interview → hired/rejected
- Scoring: hr_score, technical_score, overall_score

#### 6. `application_activities` Table
- Audit trail for applicant actions
- Activity types: status_change, note_added, document_uploaded, interview_scheduled
- Actor tracking (who performed the action)

#### 7. `email_communications` Table
- Email tracking and history
- Email types: onboarding, invitations, status updates, offers
- Delivery status tracking

### Additional Tables (from later migrations)

#### 8. `leads` Table (010_admin_mvp_schema.sql)
- Public lead submissions from landing page
- Fields: contact_name, contact_email, company_name, intent, role_title
- Status: pending, approved, rejected
- **Expanded fields (012_leads_table_expansion.sql):**
  - contact_phone, contact_position
  - industry, company_size
  - role_type, seniority, work_mode, urgency

---

## ✅ What's Working (Frontend Integration)

### Direct Supabase Integration
The frontend directly connects to Supabase (no backend API needed for core features):

1. **Lead Submission** → `leadService.ts` → Direct INSERT to `leads` table
2. **Position Creation** → `positionService.ts` → Direct INSERT to `positions` table
3. **Position Updates** → Direct UPDATE to `positions` table
4. **Admin Queries** → Direct SELECT from all tables

### Row Level Security (RLS)
- Public can INSERT to `leads` (lead form)
- Authenticated users (@prisma emails) have full access to admin tables
- Applicants can read public job listings but not other applicants

---

## ❌ What's Missing (Not Yet Deployed)

### 1. Storage Buckets (CRITICAL)
**Status:** ❌ NOT CREATED

**Needed for:**
- Resume uploads (`resumes` bucket)
- Portfolio file uploads (`portfolios` bucket)

**Action Required:**
```sql
-- Run in Supabase Dashboard → Storage
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('resumes', 'resumes', false),
  ('portfolios', 'portfolios', false);
```

**RLS Policies for Storage:**
```sql
-- Allow public uploads
CREATE POLICY "Allow public resume uploads"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'resumes');

-- Allow admin reads
CREATE POLICY "Allow admin resume reads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes');

-- Same for portfolios bucket
```

### 2. Publishing Workflow Tables (MISSING)
**Status:** ❌ NOT CREATED (documented in ATS_PUBLISHING_WORKFLOW_ARCHITECTURE.md)

**Tables Needed:**
- `application_questions` - Custom screening questions per position
- `applicant_answers` - Candidate responses to screening questions

**Position Table Updates Needed:**
```sql
ALTER TABLE positions ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS public_url TEXT;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS application_deadline DATE;
```

### 3. Admin User Setup
**Status:** ❌ NEEDS MANUAL CREATION

**Required for deployment:**
- Create admin user with @prisma email
- Test authentication flow
- Verify RLS policies allow admin access

---

## 🚀 Deployment Readiness Checklist

### Phase 1: Run Existing Migrations ⏳ PENDING
- [ ] Connect to Supabase SQL Editor: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/editor
- [ ] Run migrations in order (001 → 012)
- [ ] Verify tables created successfully
- [ ] Check RLS policies enabled

### Phase 2: Storage Setup ⏳ PENDING
- [ ] Create `resumes` storage bucket
- [ ] Create `portfolios` storage bucket
- [ ] Add storage RLS policies
- [ ] Test file upload from frontend

### Phase 3: Admin User Setup ⏳ PENDING
- [ ] Create admin user via Supabase Auth dashboard
- [ ] Email: `admin@prisma.com` (or your @prisma email)
- [ ] Test login at deployed URL
- [ ] Verify admin dashboard access

### Phase 4: Publishing Workflow (FUTURE) 🔜 NOT REQUIRED FOR MVP
- [ ] Create migration 013_publishing_workflow.sql
- [ ] Add application_questions table
- [ ] Add applicant_answers table
- [ ] Update positions table with publishing fields

---

## 🔧 Migration Execution Instructions

### Option 1: Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/editor
2. Open SQL Editor (left sidebar)
3. Create new query
4. Copy/paste each migration file in order (001 → 012)
5. Click "Run" for each migration
6. Verify success messages

### Option 2: Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref vhjjibfblrkyfzcukqwa

# Run migrations
supabase db push
```

### Option 3: Manual SQL Execution Script
```bash
cd database/migrations

# Run each migration
for file in *.sql; do
  echo "Running $file..."
  # Copy content and paste into Supabase SQL Editor
done
```

---

## 📋 Environment Variables Status

### Current .env Configuration

**File:** `frontend/.env`

```env
# API (not used in direct Supabase integration)
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Supabase
VITE_SUPABASE_URL=https://vhjjibfblrkyfzcukqwa.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# App
VITE_APP_NAME="Prisma Talent"
VITE_APP_URL=http://localhost:3000
```

### Production Environment Variables Needed

**For Vercel Deployment:**

```env
VITE_SUPABASE_URL=https://vhjjibfblrkyfzcukqwa.supabase.co
VITE_SUPABASE_ANON_KEY=<GET_FROM_SUPABASE_DASHBOARD>
VITE_APP_NAME=Prisma Talent
VITE_APP_URL=https://your-vercel-domain.vercel.app
```

**How to get VITE_SUPABASE_ANON_KEY:**
1. Go to: https://app.supabase.com/project/vhjjibfblrkyfzcukqwa/settings/api
2. Copy the **"anon public"** key (NOT service_role)
3. Add to Vercel environment variables

---

## 🔒 Security Review

### ✅ Secure Configurations
- RLS enabled on all tables
- Public can only INSERT to `leads` (contact form)
- Authenticated users (@prisma emails) have admin access
- Storage buckets are private (not public)
- Service role key never exposed to frontend

### ⚠️ Security Considerations
- **Admin Access:** Currently based on email domain (`@prisma`)
- **Storage:** Files are private, require signed URLs for access
- **CORS:** Ensure Supabase allows your Vercel domain

### 🔐 Recommended Security Updates
```sql
-- Add IP-based restrictions (optional)
-- Add rate limiting for lead submissions
-- Add email verification for new users
-- Add 2FA for admin accounts (via Supabase Auth)
```

---

## 📊 Database Schema Diagram (Simplified)

```
companies (tenant root)
  ↓
  ├── hr_users (company admins, HR managers)
  ↓
  ├── positions (job openings)
  │     ↓
  │     ├── job_descriptions (AI-generated content)
  │     ↓
  │     └── applicants (candidate applications)
  │           ↓
  │           └── application_activities (audit trail)
  ↓
  └── email_communications (email tracking)

leads (independent - public contact form)
```

---

## 🎯 Immediate Action Items

### For Database Readiness (Before Vercel Deployment):

1. **Run Migrations** (15-20 min)
   - Execute migrations 001-012 in Supabase SQL Editor
   - Verify all tables created
   - Check for error messages

2. **Create Storage Buckets** (5 min)
   - Create `resumes` bucket
   - Create `portfolios` bucket
   - Add RLS policies

3. **Create Admin User** (2 min)
   - Add user via Supabase Auth dashboard
   - Use @prisma email domain
   - Test login locally

4. **Get Environment Variables** (2 min)
   - Copy Supabase URL (already have)
   - Copy anon key from settings
   - Prepare for Vercel configuration

**Total Time: ~25-30 minutes**

---

## 🚦 Deployment Readiness Status

### Current Status: ⚠️ YELLOW - Ready with Prerequisites

**What's Ready:**
- ✅ Frontend code complete
- ✅ Direct Supabase integration implemented
- ✅ Migration files prepared
- ✅ Vercel configuration ready

**What's Needed:**
- ⏳ Run database migrations (15 min)
- ⏳ Create storage buckets (5 min)
- ⏳ Create admin user (2 min)
- ⏳ Add environment variables to Vercel (5 min)

**After Prerequisites: 🟢 GREEN - Ready to Deploy**

---

## 📞 Next Steps

### Recommended Order:
1. **Run database migrations** → Use Supabase SQL Editor
2. **Create storage buckets** → Use Supabase Storage dashboard
3. **Create admin user** → Use Supabase Auth dashboard
4. **Get anon key** → Use Supabase Settings → API
5. **Configure Vercel** → Add environment variables
6. **Deploy** → Push to GitHub or manual deploy
7. **Test** → Login, submit lead, create position

### Support Resources:
- **Supabase Dashboard:** https://app.supabase.com/project/vhjjibfblrkyfzcukqwa
- **Migration Files:** `database/migrations/`
- **Deployment Guide:** `VERCEL_DEPLOYMENT_ENV.md`
- **Architecture Doc:** `ATS_PUBLISHING_WORKFLOW_ARCHITECTURE.md`

---

## 🔄 Future Enhancements (Post-MVP)

### Phase 2: Publishing Workflow
- Application questions table
- Custom screening per position
- Public job board at `/jobs`
- Individual job pages at `/job/:code`

### Phase 3: Advanced Features
- Email notifications (Resend/SendGrid)
- Candidate scoring algorithms
- Interview scheduling
- Offer management
- Analytics dashboard

**Current Focus:** Deploy MVP with core lead capture and position management functionality.
