# Execute Migrations via Supabase Web Dashboard

**Easiest method - No CLI required, no passwords needed**

---

## 🌐 Step-by-Step Guide

### 1. Open Supabase SQL Editor
🔗 **Direct Link:** https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/sql/new

### 2. Execute Migrations in Order

Copy and paste each migration file content into the SQL Editor and click **RUN**.

**⚠️ Important:** Run migrations in this exact order!

---

## 📋 Migration Execution Checklist

### ✅ Migration 001: Initial Schema
**File:** `migrations/001_initial_schema.sql`

**What it does:** Creates core tables (companies, hr_users, positions, job_descriptions, applicants)

**Steps:**
1. Open file: `database/migrations/001_initial_schema.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. ✅ Verify: Should see "Success. No rows returned"

---

### ✅ Migration 002: RLS Policies
**File:** `migrations/002_rls_policies.sql`

**What it does:** Sets up Row Level Security policies

**Steps:**
1. Open file: `database/migrations/002_rls_policies.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. ✅ Verify: Should see "Success" message

---

### ✅ Migration 003: Indexes
**File:** `migrations/003_indexes.sql`

**What it does:** Creates performance indexes

**Steps:**
1. Open file: `database/migrations/003_indexes.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. ✅ Verify: Should see "Success" message

---

### ✅ Migration 004: Sample Data
**File:** `migrations/004_sample_data.sql`

**What it does:** Inserts sample/seed data for testing

**Steps:**
1. Open file: `database/migrations/004_sample_data.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. ✅ Verify: Should see row counts (e.g., "INSERT 0 3")

---

### ✅ Migration 005: Prisma Admins
**File:** `migrations/005_add_prisma_admins.sql`

**What it does:** Sets up admin user configuration

**Steps:**
1. Open file: `database/migrations/005_add_prisma_admins.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. ✅ Verify: Should see "Success" message

---

### ✅ Migration 006: RLS Policies Update
**File:** `migrations/006_rls_policies_update.sql`

**What it does:** Updates RLS policies for admin access

**Steps:**
1. Open file: `database/migrations/006_rls_policies_update.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. ✅ Verify: Should see "Success" message

---

### ✅ Migration 007: Triggers
**File:** `migrations/007_triggers.sql`

**What it does:** Creates database triggers (updated_at, etc.)

**Steps:**
1. Open file: `database/migrations/007_triggers.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. ✅ Verify: Should see "Success. No rows returned"

---

### ✅ Migration 010: Admin MVP Schema
**File:** `migrations/010_admin_mvp_schema.sql`

**What it does:** Creates leads table and admin-specific fields

**Steps:**
1. Open file: `database/migrations/010_admin_mvp_schema.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. ✅ Verify: Should see "Success" and sample data insert messages

---

### ✅ Migration 011: Admin RLS Policies
**File:** `migrations/011_admin_rls_policies.sql`

**What it does:** RLS policies for admin dashboard access

**Steps:**
1. Open file: `database/migrations/011_admin_rls_policies.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. ✅ Verify: Should see "Success" message

---

### ✅ Migration 012: Leads Table Expansion
**File:** `migrations/012_leads_table_expansion.sql`

**What it does:** Adds additional fields to leads table

**Steps:**
1. Open file: `database/migrations/012_leads_table_expansion.sql`
2. Copy entire content
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. ✅ Verify: Should see "✅ All required columns exist in leads table"

---

## 🔍 Verification After All Migrations

### Check Tables Created

Run this query in SQL Editor:

```sql
SELECT
    schemaname as schema,
    tablename as table_name,
    tableowner as owner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected tables:**
- ✅ applicants
- ✅ application_activities
- ✅ companies
- ✅ email_communications
- ✅ hr_users
- ✅ job_descriptions
- ✅ leads
- ✅ positions

### Check Sample Data

```sql
-- Check leads
SELECT COUNT(*) as lead_count FROM leads;
-- Expected: 3-4 leads

-- Check companies
SELECT COUNT(*) as company_count FROM companies;
-- Expected: 1-3 companies

-- Check positions
SELECT COUNT(*) as position_count FROM positions;
-- Expected: 0-2 positions
```

### Check RLS Policies

```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected:** Multiple policies for each table

---

## ⚠️ Common Issues & Solutions

### Issue: "relation already exists"
**Cause:** Migration already run previously
**Solution:** Skip to next migration (all migrations use `IF NOT EXISTS`)

### Issue: "permission denied"
**Cause:** Not enough privileges
**Solution:** Make sure you're logged in as the project owner

### Issue: "syntax error"
**Cause:** Copy-paste formatting issue
**Solution:** Re-copy the migration file content carefully

### Issue: Migration fails partway through
**Cause:** Data constraint violation or missing dependency
**Solution:**
1. Read the error message carefully
2. Fix the issue (usually in previous migration)
3. Re-run the failed migration

---

## 📊 Migration Progress Tracker

Use this checklist to track your progress:

- [ ] Migration 001: Initial Schema
- [ ] Migration 002: RLS Policies
- [ ] Migration 003: Indexes
- [ ] Migration 004: Sample Data
- [ ] Migration 005: Prisma Admins
- [ ] Migration 006: RLS Policies Update
- [ ] Migration 007: Triggers
- [ ] Migration 010: Admin MVP Schema
- [ ] Migration 011: Admin RLS Policies
- [ ] Migration 012: Leads Table Expansion
- [ ] Verification: All tables exist
- [ ] Verification: Sample data loaded
- [ ] Verification: RLS policies active

---

## ⏱️ Estimated Time

- **Total migration execution:** 10-15 minutes
- **Verification:** 5 minutes
- **Total:** 15-20 minutes

---

## 🎯 After Migrations Complete

### Next Steps:

1. **Create Storage Buckets** (5 min)
   - Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/storage/buckets
   - Create `resumes` bucket (private)
   - Create `portfolios` bucket (private)

2. **Create Admin User** (2 min)
   - Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/auth/users
   - Add user with @prisma email
   - Set password

3. **Get Environment Variables** (2 min)
   - Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/settings/api
   - Copy anon key
   - Add to Vercel

4. **Deploy to Vercel** (5 min)
   - Configure environment variables
   - Deploy

**Total Time to Production: ~30 minutes**

---

## 📞 Support

If you encounter issues:

1. Check the error message in SQL Editor
2. Review the migration file for syntax errors
3. Ensure previous migrations completed successfully
4. Check Supabase documentation: https://supabase.com/docs

**Database Status Dashboard:**
🔗 https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa
