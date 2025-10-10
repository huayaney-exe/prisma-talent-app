-- Admin MVP Schema Migration
-- Simplified schema for Phase 5 admin pages integration
-- This provides the tables expected by leadService, positionService, and applicantService

-- =============================================================================
-- LEADS TABLE (for LeadManagementPage)
-- =============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  company_name TEXT NOT NULL,

  -- Intent and details
  intent TEXT NOT NULL CHECK (intent IN ('hiring', 'conversation')),
  role_title TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add updated_at trigger for leads
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE leads IS 'Lead submissions from the public contact form';

-- =============================================================================
-- UPDATE POSITIONS TABLE (add missing fields for PositionPipelinePage)
-- =============================================================================

-- Add job_description field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'job_description'
  ) THEN
    ALTER TABLE positions ADD COLUMN job_description TEXT;
  END IF;
END $$;

-- Add applicant_count field if it doesn't exist (will be calculated via query)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'applicant_count'
  ) THEN
    ALTER TABLE positions ADD COLUMN applicant_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add business_area field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'business_area'
  ) THEN
    ALTER TABLE positions ADD COLUMN business_area TEXT;
  END IF;
END $$;

-- Add seniority_level field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'seniority_level'
  ) THEN
    ALTER TABLE positions ADD COLUMN seniority_level TEXT;
  END IF;
END $$;

COMMENT ON COLUMN positions.job_description IS 'Rich text job description (HTML from TipTap editor)';
COMMENT ON COLUMN positions.applicant_count IS 'Cached count of applicants for this position';

-- =============================================================================
-- UPDATE APPLICANTS TABLE (add missing fields for CandidateReviewPage)
-- =============================================================================

-- Add qualification_status field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applicants' AND column_name = 'qualification_status'
  ) THEN
    ALTER TABLE applicants ADD COLUMN qualification_status TEXT DEFAULT 'pending'
      CHECK (qualification_status IN ('pending', 'qualified', 'rejected', 'shortlisted'));
  END IF;
END $$;

-- Add score field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applicants' AND column_name = 'score'
  ) THEN
    ALTER TABLE applicants ADD COLUMN score INTEGER CHECK (score BETWEEN 0 AND 100);
  END IF;
END $$;

-- Add evaluation_notes field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applicants' AND column_name = 'evaluation_notes'
  ) THEN
    ALTER TABLE applicants ADD COLUMN evaluation_notes TEXT;
  END IF;
END $$;

-- Add cv_url field if it doesn't exist (alias for resume_url)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applicants' AND column_name = 'cv_url'
  ) THEN
    ALTER TABLE applicants ADD COLUMN cv_url TEXT;
  END IF;
END $$;

-- Add submitted_at field if it doesn't exist (alias for applied_at)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applicants' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE applicants ADD COLUMN submitted_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

COMMENT ON COLUMN applicants.qualification_status IS 'Admin qualification status for shortlist generation';
COMMENT ON COLUMN applicants.score IS 'Admin qualification score (0-100)';
COMMENT ON COLUMN applicants.evaluation_notes IS 'Admin notes from qualification process';

-- =============================================================================
-- HELPER VIEWS (for easier queries)
-- =============================================================================

-- View for positions with applicant counts
-- Note: positions table already has applicant_count column, so we calculate and update it
CREATE OR REPLACE VIEW positions_with_counts AS
SELECT
  p.*,
  COALESCE(COUNT(a.id), 0) as calculated_applicant_count
FROM positions p
LEFT JOIN applicants a ON p.id = a.position_id
GROUP BY p.id;

COMMENT ON VIEW positions_with_counts IS 'Positions with calculated applicant counts';

-- =============================================================================
-- SAMPLE DATA (for testing)
-- =============================================================================

-- Insert sample leads if table is empty
INSERT INTO leads (contact_name, contact_email, company_name, intent, role_title, status)
SELECT * FROM (VALUES
  ('María García', 'maria@techstartup.com', 'TechStartup Inc', 'hiring', 'Senior Product Manager', 'pending'),
  ('Carlos Rodríguez', 'carlos@fintech.io', 'FinTech Solutions', 'conversation', NULL, 'pending'),
  ('Ana Martínez', 'ana@ecommerce.com', 'E-Commerce Plus', 'hiring', 'Engineering Lead', 'approved')
) AS sample_data (contact_name, contact_email, company_name, intent, role_title, status)
WHERE NOT EXISTS (SELECT 1 FROM leads LIMIT 1);

-- Note: Sample positions and applicants will be added via the admin interface
