-- Migration: Fix admin RLS check to use prisma_admins table
-- Date: 2025-10-10
-- Purpose: Properly identify admin users via prisma_admins table instead of JWT role

-- =============================================================================
-- PROBLEM: Admin users identified by prisma_admins table, not JWT role
-- - Previous migration checked for auth.jwt()->>'role' = 'service_role'
-- - But frontend uses anon key with authenticated role
-- - Need to check prisma_admins table instead
-- =============================================================================

-- Drop the service_role based policies
DROP POLICY IF EXISTS "admin_full_access_companies" ON companies;
DROP POLICY IF EXISTS "admin_full_access_hr_users" ON hr_users;
DROP POLICY IF EXISTS "admin_full_access_positions" ON positions;
DROP POLICY IF EXISTS "admin_full_access_job_descriptions" ON job_descriptions;
DROP POLICY IF EXISTS "admin_full_access_applicants" ON applicants;
DROP POLICY IF EXISTS "admin_full_access_application_activities" ON application_activities;
DROP POLICY IF EXISTS "admin_full_access_email_communications" ON email_communications;

-- =============================================================================
-- CORRECTED ADMIN BYPASS POLICIES (check prisma_admins table)
-- =============================================================================

-- Companies: Admin can access all, clients only their own
CREATE POLICY "admin_and_client_access_companies" ON companies
  FOR ALL
  TO authenticated
  USING (
    -- Prisma admins (in prisma_admins table) can access everything
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
    OR
    -- Clients can access their own company
    id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
    OR
    -- Clients linked via primary_contact_auth_id
    primary_contact_auth_id = auth.uid()
  );

-- HR Users: Admin can access all, clients only their company's users
CREATE POLICY "admin_and_client_access_hr_users" ON hr_users
  FOR ALL
  TO authenticated
  USING (
    -- Prisma admins can access everything
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
    OR
    -- Clients can access users from their company
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Positions: Admin can access all, clients only their company's positions
CREATE POLICY "admin_and_client_access_positions" ON positions
  FOR ALL
  TO authenticated
  USING (
    -- Prisma admins can access everything
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
    OR
    -- Clients can access their company's positions
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Job Descriptions: Admin can access all, clients only their company's JDs
CREATE POLICY "admin_and_client_access_job_descriptions" ON job_descriptions
  FOR ALL
  TO authenticated
  USING (
    -- Prisma admins can access everything
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
    OR
    -- Clients can access their company's job descriptions
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Applicants: Admin can access all, clients only their company's applicants
CREATE POLICY "admin_and_client_access_applicants" ON applicants
  FOR ALL
  TO authenticated
  USING (
    -- Prisma admins can access everything
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
    OR
    -- Clients can access their company's applicants
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Application Activities: Admin can access all, clients only their company's activities
CREATE POLICY "admin_and_client_access_application_activities" ON application_activities
  FOR ALL
  TO authenticated
  USING (
    -- Prisma admins can access everything
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
    OR
    -- Clients can access their company's activities
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- Email Communications: Admin can access all, clients only their company's emails
CREATE POLICY "admin_and_client_access_email_communications" ON email_communications
  FOR ALL
  TO authenticated
  USING (
    -- Prisma admins can access everything
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
    OR
    -- Clients can access their company's emails
    company_id IN (
      SELECT company_id FROM hr_users WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index on prisma_admins for fast admin check
CREATE INDEX IF NOT EXISTS idx_prisma_admins_auth_user_active
  ON prisma_admins(auth_user_id, is_active)
  WHERE is_active = true;

-- Index on hr_users for fast company lookup
CREATE INDEX IF NOT EXISTS idx_hr_users_auth_uid
  ON hr_users(id)
  WHERE id IS NOT NULL;

-- Index on companies for primary_contact_auth_id lookup
CREATE INDEX IF NOT EXISTS idx_companies_primary_contact_auth_id
  ON companies(primary_contact_auth_id)
  WHERE primary_contact_auth_id IS NOT NULL;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY "admin_and_client_access_companies" ON companies IS
  'Allows Prisma admins (in prisma_admins table) to access all companies, clients can only access their own company';

COMMENT ON POLICY "admin_and_client_access_hr_users" ON hr_users IS
  'Allows Prisma admins to access all users, clients can only access users from their company';

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated - admin check now uses prisma_admins table';
  RAISE NOTICE '🔐 Admin users verified via: EXISTS(SELECT 1 FROM prisma_admins WHERE auth_user_id = auth.uid())';
  RAISE NOTICE '👥 Client tenant isolation maintained';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Performance indexes created for fast RLS checks';
END $$;
