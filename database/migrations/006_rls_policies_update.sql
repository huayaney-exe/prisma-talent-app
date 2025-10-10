-- ============================================================================
-- Phase 1: Row-Level Security (RLS) Policies Update
--
-- Purpose: Implement secure multi-tenant data access with Prisma admin control
-- Key Principle: Each company only sees their own data, Prisma admins see all
-- Migration Date: 2025-01-09
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prisma_admins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PRISMA ADMINS POLICIES (Full Access)
-- ============================================================================

-- Prisma admins can read all admin records (but only active admins)
CREATE POLICY "prisma_admins_select" ON prisma_admins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- Prisma admins can insert new admins (super_admins only)
CREATE POLICY "prisma_admins_insert" ON prisma_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
      AND role = 'super_admin'
    )
  );

-- Prisma admins can update admin records (super_admins only)
CREATE POLICY "prisma_admins_update" ON prisma_admins
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
      AND role = 'super_admin'
    )
  );

-- ============================================================================
-- COMPANIES POLICIES (Multi-tenant Isolation)
-- ============================================================================

-- Public can insert lead companies (from landing page form)
CREATE POLICY "companies_public_insert" ON companies
  FOR INSERT
  TO anon
  WITH CHECK (subscription_status = 'lead');

-- Prisma admins can read all companies
CREATE POLICY "companies_admin_select" ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- HR users can only read their own company
CREATE POLICY "companies_hr_select" ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hr_users
      WHERE hr_users.auth_user_id = auth.uid()
      AND hr_users.company_id = companies.id
      AND hr_users.is_active = TRUE
    )
  );

-- Prisma admins can update any company
CREATE POLICY "companies_admin_update" ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- ============================================================================
-- HR USERS POLICIES (Company Isolation)
-- ============================================================================

-- Prisma admins can read all HR users
CREATE POLICY "hr_users_admin_select" ON hr_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- HR users can read users in their company
CREATE POLICY "hr_users_company_select" ON hr_users
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- Prisma admins can insert HR users (during enrollment)
CREATE POLICY "hr_users_admin_insert" ON hr_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- HR users with can_manage_team can insert in their company
CREATE POLICY "hr_users_manager_insert" ON hr_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND company_id = hr_users.company_id
      AND can_manage_team = TRUE
      AND is_active = TRUE
    )
  );

-- ============================================================================
-- POSITIONS POLICIES (Company + Prisma Admin Access)
-- ============================================================================

-- Prisma admins can read all positions
CREATE POLICY "positions_admin_select" ON positions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- HR users can read positions in their company
CREATE POLICY "positions_hr_select" ON positions
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- HR users with can_create_positions can insert
CREATE POLICY "positions_hr_insert" ON positions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND company_id = positions.company_id
      AND can_create_positions = TRUE
      AND is_active = TRUE
    )
  );

-- HR users can update positions in their company
CREATE POLICY "positions_hr_update" ON positions
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- Prisma admins can update any position
CREATE POLICY "positions_admin_update" ON positions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- ============================================================================
-- JOB DESCRIPTIONS POLICIES (Prisma Admin Controlled)
-- ============================================================================

-- Prisma admins can read all job descriptions
CREATE POLICY "job_descriptions_admin_select" ON job_descriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- HR users can read job descriptions for their company positions
CREATE POLICY "job_descriptions_hr_select" ON job_descriptions
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- Prisma admins can insert/update job descriptions (manual creation in MVP)
CREATE POLICY "job_descriptions_admin_insert" ON job_descriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

CREATE POLICY "job_descriptions_admin_update" ON job_descriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- Public can read published job descriptions (for job listings page)
CREATE POLICY "job_descriptions_public_select" ON job_descriptions
  FOR SELECT
  TO anon
  USING (status = 'published');

-- ============================================================================
-- APPLICANTS POLICIES (Company + Prisma Admin Access)
-- ============================================================================

-- Public can insert applicants (from application forms)
CREATE POLICY "applicants_public_insert" ON applicants
  FOR INSERT
  TO anon
  WITH CHECK (TRUE);

-- Prisma admins can read all applicants
CREATE POLICY "applicants_admin_select" ON applicants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- HR users can read applicants for their company
CREATE POLICY "applicants_hr_select" ON applicants
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- HR users and Prisma admins can update applicants
CREATE POLICY "applicants_update" ON applicants
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- ============================================================================
-- ACTIVITY & EMAIL LOGS POLICIES (Read/Insert Only)
-- ============================================================================

-- Application activities: Company-scoped read access
CREATE POLICY "activities_company_select" ON application_activities
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

CREATE POLICY "activities_insert" ON application_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Email communications: Company-scoped read access
CREATE POLICY "emails_company_select" ON email_communications
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

CREATE POLICY "emails_insert" ON email_communications
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Success Message
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1 RLS Policies Complete';
  RAISE NOTICE '🔒 Multi-tenant isolation configured';
  RAISE NOTICE '🔐 Prisma admins have full access, HR users see only their company';
  RAISE NOTICE '👥 Public can submit leads and applications';
  RAISE NOTICE '📄 Next: Run triggers migration (007_triggers.sql)';
END $$;
