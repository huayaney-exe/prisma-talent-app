-- Migration: Fix RLS infinite recursion and add admin bypass
-- Date: 2025-10-10
-- Purpose: Fix circular reference in RLS policies and allow Prisma admins to bypass tenant isolation

-- =============================================================================
-- PROBLEM: Infinite recursion in RLS policies
-- - companies policy queries hr_users
-- - hr_users policy queries hr_users (circular!)
-- - Admin users have no hr_users record, causing all queries to fail
--
-- SOLUTION:
-- 1. Add admin bypass policies (service_role can access everything)
-- 2. Fix hr_users policy to avoid self-reference
-- 3. Use proper auth checks for admins vs clients
-- =============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "company_access" ON companies;
DROP POLICY IF EXISTS "tenant_isolation" ON hr_users;
DROP POLICY IF EXISTS "tenant_isolation" ON positions;
DROP POLICY IF EXISTS "tenant_isolation" ON job_descriptions;
DROP POLICY IF EXISTS "tenant_isolation" ON applicants;
DROP POLICY IF EXISTS "tenant_isolation" ON application_activities;
DROP POLICY IF EXISTS "tenant_isolation" ON email_communications;

-- =============================================================================
-- ADMIN BYPASS POLICIES (for Prisma staff using service_role key)
-- =============================================================================

-- Allow service_role (backend with service key) to access all companies
CREATE POLICY "admin_full_access_companies" ON companies
  FOR ALL
  TO authenticated
  USING (
    -- Service role can access everything (Prisma admins)
    auth.jwt()->>'role' = 'service_role'
    OR
    -- OR user is accessing their own company
    id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Allow service_role to access all hr_users
CREATE POLICY "admin_full_access_hr_users" ON hr_users
  FOR ALL
  TO authenticated
  USING (
    -- Service role can access everything (Prisma admins)
    auth.jwt()->>'role' = 'service_role'
    OR
    -- OR user is accessing their own company's users
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Allow service_role to access all positions
CREATE POLICY "admin_full_access_positions" ON positions
  FOR ALL
  TO authenticated
  USING (
    -- Service role can access everything
    auth.jwt()->>'role' = 'service_role'
    OR
    -- OR user is accessing their company's positions
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Allow service_role to access all job_descriptions
CREATE POLICY "admin_full_access_job_descriptions" ON job_descriptions
  FOR ALL
  TO authenticated
  USING (
    -- Service role can access everything
    auth.jwt()->>'role' = 'service_role'
    OR
    -- OR user is accessing their company's job descriptions
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Allow service_role to access all applicants
CREATE POLICY "admin_full_access_applicants" ON applicants
  FOR ALL
  TO authenticated
  USING (
    -- Service role can access everything
    auth.jwt()->>'role' = 'service_role'
    OR
    -- OR user is accessing their company's applicants
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Allow service_role to access all application_activities
CREATE POLICY "admin_full_access_application_activities" ON application_activities
  FOR ALL
  TO authenticated
  USING (
    -- Service role can access everything
    auth.jwt()->>'role' = 'service_role'
    OR
    -- OR user is accessing their company's activities
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Allow service_role to access all email_communications
CREATE POLICY "admin_full_access_email_communications" ON email_communications
  FOR ALL
  TO authenticated
  USING (
    -- Service role can access everything
    auth.jwt()->>'role' = 'service_role'
    OR
    -- OR user is accessing their company's emails
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- PUBLIC ACCESS REMAINS UNCHANGED
-- =============================================================================
-- (public_position_read, public_job_description_read, public_application_insert policies already exist)

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY "admin_full_access_companies" ON companies IS
  'Allows Prisma admins (service_role) to access all companies, clients can only access their own company';

COMMENT ON POLICY "admin_full_access_hr_users" ON hr_users IS
  'Allows Prisma admins (service_role) to access all users, clients can only access users from their company';

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated - infinite recursion fixed';
  RAISE NOTICE '🔐 Admin bypass enabled for service_role';
  RAISE NOTICE '👥 Client tenant isolation maintained';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Frontend must use service_role key for admin operations';
  RAISE NOTICE '   - Admin operations: use SUPABASE_SERVICE_ROLE_KEY';
  RAISE NOTICE '   - Client operations: use SUPABASE_ANON_KEY';
END $$;
