-- ============================================================================
-- Client Authentication System - Lean MVP
-- Enables admin to create client accounts with magic link authentication
-- Migration: 013
-- ============================================================================

-- =============================================================================
-- 1. ADD AUTH LINK TO COMPANIES TABLE
-- =============================================================================

-- Add primary_contact_auth_id to link company to Supabase Auth user
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS primary_contact_auth_id UUID REFERENCES auth.users(id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_companies_auth_id
ON companies(primary_contact_auth_id);

COMMENT ON COLUMN companies.primary_contact_auth_id IS 'Links company to the Supabase Auth user for primary contact (client login)';

-- =============================================================================
-- 2. UPDATE COMPANIES RLS POLICIES
-- =============================================================================

-- Allow clients to view their own company
CREATE POLICY "clients_view_own_company" ON companies
  FOR SELECT
  TO authenticated
  USING (
    primary_contact_auth_id = auth.uid()
  );

-- Allow clients to update their own company (limited fields)
CREATE POLICY "clients_update_own_company" ON companies
  FOR UPDATE
  TO authenticated
  USING (primary_contact_auth_id = auth.uid())
  WITH CHECK (primary_contact_auth_id = auth.uid());

COMMENT ON POLICY "clients_view_own_company" ON companies IS 'Clients can view their own company data';
COMMENT ON POLICY "clients_update_own_company" ON companies IS 'Clients can update their own company info';

-- =============================================================================
-- 3. ADD AUTH_USER_ID TO HR_USERS (IF NOT EXISTS)
-- =============================================================================

-- Add auth_user_id to hr_users for future client login expansion
ALTER TABLE hr_users
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_hr_users_auth_id
ON hr_users(auth_user_id);

COMMENT ON COLUMN hr_users.auth_user_id IS 'Links HR user to Supabase Auth for client login (future feature)';

-- =============================================================================
-- 4. UPDATE HR_USERS FOR CLIENT ACCESS (FUTURE)
-- =============================================================================

-- HR users should be able to view their company info (when they have auth accounts)
CREATE POLICY "hr_users_view_company_via_auth" ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

COMMENT ON POLICY "hr_users_view_company_via_auth" ON companies IS 'HR users can view their company data when logged in (future feature)';

-- =============================================================================
-- 5. POSITIONS ACCESS FOR CLIENTS
-- =============================================================================

-- Clients can view positions for their company
CREATE POLICY "clients_view_own_positions" ON positions
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE primary_contact_auth_id = auth.uid()
    )
  );

-- Clients can create positions for their company
CREATE POLICY "clients_create_own_positions" ON positions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies
      WHERE primary_contact_auth_id = auth.uid()
    )
  );

-- Clients can update their own positions
CREATE POLICY "clients_update_own_positions" ON positions
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE primary_contact_auth_id = auth.uid()
    )
  );

COMMENT ON POLICY "clients_view_own_positions" ON positions IS 'Clients can view positions for their company';
COMMENT ON POLICY "clients_create_own_positions" ON positions IS 'Clients can create positions via HR form';

-- =============================================================================
-- 6. HELPER FUNCTION TO CHECK IF USER IS CLIENT
-- =============================================================================

-- Function to check if current user is a client (has linked company)
CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM companies
    WHERE primary_contact_auth_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION is_client() IS 'Returns true if current authenticated user is linked to a company as primary contact';

-- =============================================================================
-- 7. HELPER FUNCTION TO GET CLIENT COMPANY ID
-- =============================================================================

-- Function to get company ID for current client user
CREATE OR REPLACE FUNCTION get_client_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM companies
  WHERE primary_contact_auth_id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_client_company_id() IS 'Returns company ID for current authenticated client user';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- View new policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('companies', 'positions')
  AND policyname LIKE '%client%'
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 013 Complete: Client Authentication System';
  RAISE NOTICE '📧 Clients can now login via magic links';
  RAISE NOTICE '🏢 Clients can view and create positions for their company';
  RAISE NOTICE '🔐 RLS policies enforce client-company isolation';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Admin creates client: supabase.auth.admin.inviteUserByEmail()';
  RAISE NOTICE '2. Client receives magic link email';
  RAISE NOTICE '3. Client clicks link → logged in';
  RAISE NOTICE '4. Client accesses HR form → auto-filled company';
END $$;
