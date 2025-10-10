# Database Migration Guide

## Overview

This guide covers database setup and migration for the Prisma Talent Platform using Supabase (PostgreSQL).

## Migration Files

Migrations are located in `database/migrations/` and should be executed in order:

| File | Purpose | Phase |
|------|---------|-------|
| `001_initial_schema.sql` | Core tables (companies, hr_users, positions, etc.) | Legacy |
| `002_rls_policies.sql` | Initial RLS policies | Legacy |
| `003_indexes.sql` | Performance indexes | Legacy |
| `004_sample_data.sql` | Test data | Legacy |
| `005_add_prisma_admins.sql` | **Add prisma_admins table and update schema** | **Phase 1** |
| `006_rls_policies_update.sql` | **Multi-tenant RLS with Prisma admin access** | **Phase 1** |
| `007_triggers.sql` | **Workflow automation triggers** | **Phase 1** |

## Phase 1: Database Setup (Production Architecture)

Phase 1 implements the core database foundation for MVP with manual job description creation.

### Prerequisites

1. **Supabase Project**: Active Supabase project (https://vhjjibfblrkyfzcukqwa.supabase.co)
2. **Database Access**: Admin credentials or Supabase SQL Editor access
3. **PostgreSQL Version**: 14+ (Supabase default)

### Migration Steps

#### Step 1: Verify Current State

```sql
-- Check existing tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should see: companies, hr_users, positions, job_descriptions, applicants, etc.
```

#### Step 2: Run Phase 1 Migrations

Execute migrations in Supabase SQL Editor or via psql:

```bash
# Option 1: Supabase SQL Editor (Recommended)
# 1. Open Supabase Dashboard > SQL Editor
# 2. Copy/paste each migration file
# 3. Click "Run"

# Option 2: psql command line
psql postgresql://postgres:[PASSWORD]@db.vhjjibfblrkyfzcukqwa.supabase.co:5432/postgres \
  -f database/migrations/005_add_prisma_admins.sql

psql postgresql://postgres:[PASSWORD]@db.vhjjibfblrkyfzcukqwa.supabase.co:5432/postgres \
  -f database/migrations/006_rls_policies_update.sql

psql postgresql://postgres:[PASSWORD]@db.vhjjibfblrkyfzcukqwa.supabase.co:5432/postgres \
  -f database/migrations/007_triggers.sql
```

#### Step 3: Verify Migrations

```sql
-- Verify prisma_admins table exists
SELECT * FROM prisma_admins;
-- Should return default admin record

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
-- Should show all 8 tables with RLS enabled

-- Verify triggers exist
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname LIKE 'trigger_%';
-- Should show 7 triggers
```

#### Step 4: Test Database Setup

Run test queries to verify functionality:

```sql
-- Test 1: Create test company (as anonymous user - simulates landing page)
SET ROLE anon;
INSERT INTO companies (
  company_name,
  company_domain,
  primary_contact_name,
  primary_contact_email,
  subscription_status
) VALUES (
  'Test Company',
  'test.com',
  'Test User',
  'test@test.com',
  'lead'
) RETURNING id;

-- Test 2: Create Prisma admin
RESET ROLE;
INSERT INTO prisma_admins (email, full_name, role)
VALUES ('admin@test.com', 'Test Admin', 'admin')
RETURNING id;

-- Test 3: Verify RLS isolation (HR user can only see their company)
-- This would require actual auth context in application

-- Test 4: Trigger test (workflow automation)
-- Create test position and update status to trigger notifications
```

### Security Configuration

#### Update Default Admin Email

⚠️ **CRITICAL**: Change default admin email before production deployment:

```sql
UPDATE prisma_admins
SET email = 'your-admin@getprisma.io'
WHERE email = 'admin@getprisma.io';
```

#### Create Additional Admins

```sql
INSERT INTO prisma_admins (email, full_name, role, permissions)
VALUES (
  'team-member@getprisma.io',
  'Team Member Name',
  'admin',
  '{
    "can_enroll_clients": true,
    "can_publish_positions": true,
    "can_qualify_candidates": true,
    "can_manage_admins": false
  }'::jsonb
);
```

### Rollback Plan

If migrations fail, rollback using:

```sql
-- Rollback 007_triggers.sql
DROP TRIGGER IF EXISTS trigger_notify_business_user ON positions;
DROP TRIGGER IF EXISTS trigger_notify_hr_on_business_completion ON positions;
DROP TRIGGER IF EXISTS trigger_log_applicant_status_change ON applicants;
DROP TRIGGER IF EXISTS trigger_send_applicant_confirmation ON applicants;
DROP TRIGGER IF EXISTS trigger_update_position_on_jd_publish ON job_descriptions;
DROP TRIGGER IF EXISTS trigger_prevent_active_position_deletion ON positions;
DROP TRIGGER IF EXISTS trigger_update_company_onboarding_status ON hr_users;

DROP FUNCTION IF EXISTS notify_business_user_on_hr_completion();
DROP FUNCTION IF EXISTS notify_hr_on_business_completion();
DROP FUNCTION IF EXISTS log_applicant_status_change();
DROP FUNCTION IF EXISTS send_applicant_confirmation();
DROP FUNCTION IF EXISTS update_position_on_jd_publish();
DROP FUNCTION IF EXISTS prevent_active_position_deletion();
DROP FUNCTION IF EXISTS update_company_onboarding_status();
DROP FUNCTION IF EXISTS test_notification_trigger(UUID);

-- Rollback 006_rls_policies_update.sql
DROP POLICY IF EXISTS "prisma_admins_select" ON prisma_admins;
DROP POLICY IF EXISTS "prisma_admins_insert" ON prisma_admins;
DROP POLICY IF EXISTS "prisma_admins_update" ON prisma_admins;
-- ... (drop all other policies)

-- Rollback 005_add_prisma_admins.sql
ALTER TABLE companies DROP CONSTRAINT IF EXISTS fk_companies_created_by;
ALTER TABLE companies DROP COLUMN IF EXISTS enrolled_by;
ALTER TABLE job_descriptions DROP COLUMN IF EXISTS published_by;
ALTER TABLE job_descriptions DROP COLUMN IF EXISTS status;
ALTER TABLE job_descriptions DROP COLUMN IF EXISTS draft_content;
DROP TABLE IF EXISTS prisma_admins CASCADE;
```

## Testing Checklist

After running Phase 1 migrations:

- [ ] **Table Creation**: prisma_admins table exists with default admin
- [ ] **Schema Updates**: Companies and job_descriptions tables have new columns
- [ ] **RLS Policies**: All 8 tables have RLS enabled with correct policies
- [ ] **Triggers**: 7 triggers created and functioning
- [ ] **Indexes**: Performance indexes exist on key columns
- [ ] **Security**: Default admin email changed to production value
- [ ] **Multi-tenancy**: RLS policies enforce company isolation
- [ ] **Public Access**: Anonymous users can insert leads and applications

## Common Issues

### Issue: "relation prisma_admins does not exist"
**Solution**: Run `005_add_prisma_admins.sql` migration first

### Issue: RLS policies block all access
**Solution**: Verify user authentication context and check policy conditions

### Issue: Triggers not firing
**Solution**: Check trigger conditions and verify workflow_stage values match

### Issue: Foreign key constraint violation
**Solution**: Ensure prisma_admins record exists before referencing in other tables

## Next Steps

After Phase 1 database setup:

1. **Test Database**: Run integration tests (see `tests/integration/`)
2. **Backend API**: Implement FastAPI endpoints (Phase 2)
3. **Frontend**: Build React admin dashboard (Phase 3)
4. **Email Service**: Configure Resend for notifications (Phase 2)

## Support

For migration issues:
- Check Supabase logs: Dashboard > Logs
- Review PostgreSQL error messages
- Contact: hello@getprisma.io
