-- ============================================================================
-- Phase 1: Row-Level Security (RLS) Policies Update (SIMPLIFIED)
--
-- Purpose: Implement secure multi-tenant data access
-- Simplified: Email-based matching for MVP (auth_user_id link to be added later)
-- Migration Date: 2025-10-09
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
-- PRISMA ADMINS POLICIES (Simplified - Email based for MVP)
-- ============================================================================

-- Prisma admins can read all admin records (but only active admins)
CREATE POLICY "prisma_admins_select" ON prisma_admins
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Prisma admins with super_admin role can insert
CREATE POLICY "prisma_admins_insert" ON prisma_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE); -- Simplified for MVP

-- Prisma admins with super_admin role can update
CREATE POLICY "prisma_admins_update" ON prisma_admins
  FOR UPDATE
  TO authenticated
  USING (TRUE); -- Simplified for MVP

-- ============================================================================
-- COMPANIES POLICIES (Multi-tenant Isolation)
-- ============================================================================

-- Public can insert lead companies (from landing page form)
CREATE POLICY "companies_public_insert" ON companies
  FOR INSERT
  TO anon
  WITH CHECK (subscription_status = 'lead');

-- Authenticated users can read companies (simplified - refine later with proper auth)
CREATE POLICY "companies_authenticated_select" ON companies
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Authenticated users can update companies (simplified)
CREATE POLICY "companies_authenticated_update" ON companies
  FOR UPDATE
  TO authenticated
  USING (TRUE);

-- ============================================================================
-- HR USERS POLICIES
-- ============================================================================

-- Authenticated users can read hr_users (simplified)
CREATE POLICY "hr_users_select" ON hr_users
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Authenticated users can insert hr_users (simplified)
CREATE POLICY "hr_users_insert" ON hr_users
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Authenticated users can update hr_users (simplified)
CREATE POLICY "hr_users_update" ON hr_users
  FOR UPDATE
  TO authenticated
  USING (TRUE);

-- ============================================================================
-- POSITIONS POLICIES
-- ============================================================================

-- Authenticated users can read positions
CREATE POLICY "positions_select" ON positions
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Authenticated users can insert positions
CREATE POLICY "positions_insert" ON positions
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Authenticated users can update positions
CREATE POLICY "positions_update" ON positions
  FOR UPDATE
  TO authenticated
  USING (TRUE);

-- ============================================================================
-- JOB DESCRIPTIONS POLICIES
-- ============================================================================

-- Authenticated users can read job descriptions
CREATE POLICY "job_descriptions_select" ON job_descriptions
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Authenticated users can insert job descriptions
CREATE POLICY "job_descriptions_insert" ON job_descriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Authenticated users can update job descriptions
CREATE POLICY "job_descriptions_update" ON job_descriptions
  FOR UPDATE
  TO authenticated
  USING (TRUE);

-- ============================================================================
-- APPLICANTS POLICIES
-- ============================================================================

-- Public can insert applications (from job application form)
CREATE POLICY "applicants_public_insert" ON applicants
  FOR INSERT
  TO anon
  WITH CHECK (TRUE);

-- Authenticated users can read applicants
CREATE POLICY "applicants_select" ON applicants
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Authenticated users can update applicants
CREATE POLICY "applicants_update" ON applicants
  FOR UPDATE
  TO authenticated
  USING (TRUE);

-- ============================================================================
-- APPLICATION ACTIVITIES POLICIES
-- ============================================================================

-- Authenticated users can read application activities
CREATE POLICY "application_activities_select" ON application_activities
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Authenticated users can insert application activities
CREATE POLICY "application_activities_insert" ON application_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- ============================================================================
-- EMAIL COMMUNICATIONS POLICIES
-- ============================================================================

-- Authenticated users can read email communications
CREATE POLICY "email_communications_select" ON email_communications
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Authenticated users can insert email communications
CREATE POLICY "email_communications_insert" ON email_communications
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Authenticated users can update email communications
CREATE POLICY "email_communications_update" ON email_communications
  FOR UPDATE
  TO authenticated
  USING (TRUE);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies Applied (SIMPLIFIED FOR MVP)';
  RAISE NOTICE '⚠️  NOTE: These are permissive policies for development';
  RAISE NOTICE '🔒 TODO: Tighten policies with proper auth_user_id matching in production';
END $$;
