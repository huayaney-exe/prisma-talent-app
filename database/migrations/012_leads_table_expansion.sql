-- Leads Table Expansion Migration
-- Adds missing fields to match LeadForm component
-- Enables direct Supabase integration from frontend

-- =============================================================================
-- ADD MISSING FIELDS TO LEADS TABLE
-- =============================================================================

-- Contact fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_position TEXT;

-- Company fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_size TEXT
  CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+'));

-- Position fields (when intent = 'hiring')
ALTER TABLE leads ADD COLUMN IF NOT EXISTS role_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS seniority TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS work_mode TEXT
  CHECK (work_mode IN ('remote', 'hybrid', 'onsite'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS urgency TEXT
  CHECK (urgency IN ('immediate', '1-2-weeks', '1-month+', 'not-urgent'));

-- =============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- =============================================================================

-- Common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_intent ON leads(intent);
CREATE INDEX IF NOT EXISTS idx_leads_created_desc ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(contact_email);

-- Composite index for admin filtering
CREATE INDEX IF NOT EXISTS idx_leads_status_intent ON leads(status, intent);

-- =============================================================================
-- UPDATE COMMENTS
-- =============================================================================

COMMENT ON COLUMN leads.contact_phone IS 'Lead contact phone number';
COMMENT ON COLUMN leads.contact_position IS 'Lead job title/position';
COMMENT ON COLUMN leads.industry IS 'Company industry (optional)';
COMMENT ON COLUMN leads.company_size IS 'Company size category';
COMMENT ON COLUMN leads.role_type IS 'Position type when intent=hiring (e.g., Product Management, Engineering)';
COMMENT ON COLUMN leads.seniority IS 'Position seniority level when intent=hiring';
COMMENT ON COLUMN leads.work_mode IS 'Work arrangement preference when intent=hiring';
COMMENT ON COLUMN leads.urgency IS 'Hiring urgency when intent=hiring';

-- =============================================================================
-- VERIFY SCHEMA
-- =============================================================================

-- Query to verify all columns exist
DO $$
DECLARE
  missing_columns TEXT[];
  required_columns TEXT[] := ARRAY[
    'id', 'contact_name', 'contact_email', 'contact_phone', 'contact_position',
    'company_name', 'industry', 'company_size', 'intent', 'role_title',
    'role_type', 'seniority', 'work_mode', 'urgency', 'status',
    'created_at', 'updated_at'
  ];
  col TEXT;
BEGIN
  FOREACH col IN ARRAY required_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing columns in leads table: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ All required columns exist in leads table';
  END IF;
END $$;

-- =============================================================================
-- SAMPLE DATA UPDATE
-- =============================================================================

-- Update existing sample leads with new fields
UPDATE leads
SET
  contact_phone = '+51999999999',
  contact_position = 'CEO',
  industry = 'Technology',
  company_size = '11-50'
WHERE contact_phone IS NULL;

-- Add more complete sample lead
INSERT INTO leads (
  contact_name, contact_email, contact_phone, contact_position,
  company_name, industry, company_size,
  intent, role_title, role_type, seniority, work_mode, urgency,
  status
)
SELECT * FROM (VALUES (
  'Carlos Tech',
  'carlos@techstartup.pe',
  '+51987654321',
  'CTO',
  'TechStartup SAC',
  'SaaS',
  '51-200',
  'hiring',
  'Senior Product Manager',
  'Product Management',
  'Senior 5-8 años',
  'hybrid',
  '1-2-weeks',
  'pending'
)) AS sample_data
WHERE NOT EXISTS (
  SELECT 1 FROM leads WHERE contact_email = 'carlos@techstartup.pe'
);

-- =============================================================================
-- VALIDATION QUERIES
-- =============================================================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'leads'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'leads';

-- Check sample data
-- SELECT * FROM leads LIMIT 5;
