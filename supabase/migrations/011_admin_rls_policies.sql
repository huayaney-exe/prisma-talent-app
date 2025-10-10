-- Admin RLS Policies Migration
-- Row Level Security policies for admin MVP tables
-- Ensures proper access control for leads, positions, and applicants

-- =============================================================================
-- ENABLE RLS ON TABLES
-- =============================================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- LEADS TABLE RLS POLICIES
-- =============================================================================

-- Policy: Anyone can insert leads (public form submission)
CREATE POLICY "leads_insert_public"
ON leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Authenticated users can view all leads
CREATE POLICY "leads_select_authenticated"
ON leads
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can update leads (approve/reject)
CREATE POLICY "leads_update_authenticated"
ON leads
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Prevent deletion of leads (audit trail)
CREATE POLICY "leads_delete_none"
ON leads
FOR DELETE
TO authenticated
USING (false);

COMMENT ON POLICY "leads_insert_public" ON leads IS 'Allow public form submissions';
COMMENT ON POLICY "leads_select_authenticated" ON leads IS 'Admins can view all leads';
COMMENT ON POLICY "leads_update_authenticated" ON leads IS 'Admins can approve/reject leads';

-- =============================================================================
-- POSITIONS TABLE RLS POLICIES
-- =============================================================================

-- Policy: Authenticated users can view all positions
CREATE POLICY "positions_select_authenticated"
ON positions
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can insert positions
CREATE POLICY "positions_insert_authenticated"
ON positions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update positions
CREATE POLICY "positions_update_authenticated"
ON positions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow deletion only for draft positions
CREATE POLICY "positions_delete_draft_only"
ON positions
FOR DELETE
TO authenticated
USING (workflow_stage IN ('hr_draft', 'hr_completed'));

COMMENT ON POLICY "positions_select_authenticated" ON positions IS 'Admins can view all positions';
COMMENT ON POLICY "positions_insert_authenticated" ON positions IS 'Admins can create positions';
COMMENT ON POLICY "positions_update_authenticated" ON positions IS 'Admins can update positions (JD, workflow)';
COMMENT ON POLICY "positions_delete_draft_only" ON positions IS 'Only draft positions can be deleted';

-- =============================================================================
-- APPLICANTS TABLE RLS POLICIES
-- =============================================================================

-- Policy: Anyone can insert applicants (public application form)
CREATE POLICY "applicants_insert_public"
ON applicants
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Authenticated users can view all applicants
CREATE POLICY "applicants_select_authenticated"
ON applicants
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can update applicants (qualification, scoring)
CREATE POLICY "applicants_update_authenticated"
ON applicants
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Prevent deletion of applicants (audit trail)
CREATE POLICY "applicants_delete_none"
ON applicants
FOR DELETE
TO authenticated
USING (false);

COMMENT ON POLICY "applicants_insert_public" ON applicants IS 'Allow public job applications';
COMMENT ON POLICY "applicants_select_authenticated" ON applicants IS 'Admins can view all applicants';
COMMENT ON POLICY "applicants_update_authenticated" ON applicants IS 'Admins can qualify/reject applicants';

-- =============================================================================
-- STORAGE BUCKET POLICIES (for CV uploads)
-- =============================================================================

-- Create storage bucket for CVs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can upload CVs
CREATE POLICY "cvs_insert_public"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'cvs');

-- Policy: Anyone can view CVs (for shortlist emails)
CREATE POLICY "cvs_select_public"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'cvs');

-- Policy: Prevent deletion of CVs (audit trail)
CREATE POLICY "cvs_delete_none"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'cvs' AND false);

-- Storage policy comments removed due to permission issues
-- COMMENT ON POLICY "cvs_insert_public" ON storage.objects IS 'Allow CV uploads from application form';
-- COMMENT ON POLICY "cvs_select_public" ON storage.objects IS 'Allow CV downloads for review';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE ON leads TO authenticated;
GRANT INSERT ON leads TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON positions TO authenticated;

GRANT SELECT, INSERT, UPDATE ON applicants TO authenticated;
GRANT INSERT ON applicants TO anon;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================================================
-- TESTING RLS POLICIES
-- =============================================================================

-- Test lead insertion (should work for anon)
-- INSERT INTO leads (contact_name, contact_email, company_name, intent)
-- VALUES ('Test User', 'test@example.com', 'Test Company', 'hiring');

-- Test position creation (should work for authenticated)
-- INSERT INTO positions (position_name, area, seniority, leader_name, leader_position, leader_email, salary_range, contract_type, timeline, position_type, created_by)
-- VALUES ('Test Position', 'Engineering-Tech', 'Senior 5-8 años', 'Test Leader', 'CTO', 'leader@example.com', '$80k-$120k', 'Tiempo completo', NOW() + INTERVAL '30 days', 'Nueva posición', auth.uid());

-- Test applicant insertion (should work for anon)
-- INSERT INTO applicants (company_id, position_id, full_name, email, phone)
-- VALUES ((SELECT id FROM companies LIMIT 1), (SELECT id FROM positions LIMIT 1), 'Test Applicant', 'applicant@example.com', '+1234567890');
