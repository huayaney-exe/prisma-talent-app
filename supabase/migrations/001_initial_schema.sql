-- Prisma Talent ATS - Initial Schema Migration
-- Multi-tenant database architecture for talent platform
-- Project: prisma-talent (vhjjibfblrkyfzcukqwa)

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Companies table (tenant isolation root)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core company data
  company_name TEXT NOT NULL,
  company_domain TEXT UNIQUE NOT NULL,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),

  -- Business details
  website_url TEXT,
  linkedin_url TEXT,
  company_description TEXT,

  -- Subscription & status
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_plan TEXT DEFAULT 'basic',
  trial_end_date TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),

  -- Primary contact
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP,

  -- Standard audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID -- Prisma admin who onboarded
);

-- HR Users table (flat role model)
CREATE TABLE IF NOT EXISTS hr_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- User identity
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  position_title TEXT,
  phone TEXT,

  -- Simple flat role model
  role TEXT DEFAULT 'hr_user' CHECK (role IN ('company_admin', 'hr_manager', 'hr_user')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,

  -- Basic permissions (avoid complex permission tables)
  can_create_positions BOOLEAN DEFAULT TRUE,
  can_manage_team BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,

  -- Standard audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES hr_users(id), -- Who invited this user
  invitation_accepted_at TIMESTAMP
);

-- Positions table (core workflow tracking)
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  position_code TEXT UNIQUE NOT NULL DEFAULT ('POS_' || upper(substring(gen_random_uuid()::text, 1, 8))),

  -- Workflow tracking
  workflow_stage TEXT DEFAULT 'hr_draft' CHECK (workflow_stage IN (
    'hr_draft', 'hr_completed', 'leader_notified', 'leader_in_progress',
    'leader_completed', 'job_desc_generated', 'validation_pending',
    'validated', 'active', 'filled', 'cancelled'
  )),

  -- HR Form 1 Fields
  position_name TEXT NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('Product Management', 'Engineering-Tech', 'Growth', 'Design')),
  seniority TEXT NOT NULL CHECK (seniority IN ('Mid-level 3-5 años', 'Senior 5-8 años', 'Lead-Staff 8+ años', 'Director+ 10+ años')),

  -- Leader information
  leader_name TEXT NOT NULL,
  leader_position TEXT NOT NULL,
  leader_email TEXT NOT NULL,

  -- Position details
  salary_range TEXT NOT NULL,
  equity_included BOOLEAN DEFAULT FALSE,
  equity_details TEXT,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('Tiempo completo', 'Part-time')),
  timeline DATE NOT NULL,
  position_type TEXT NOT NULL CHECK (position_type IN ('Nueva posición', 'Reemplazo')),
  critical_notes TEXT,

  -- Leader Form 2 Universal Fields
  work_arrangement TEXT,
  core_hours TEXT,
  meeting_culture TEXT,
  team_size INTEGER,
  autonomy_level TEXT,
  mentoring_required BOOLEAN,
  hands_on_vs_strategic TEXT,
  success_kpi TEXT,

  -- JSONB for flexible area-specific data
  area_specific_data JSONB DEFAULT '{}',

  -- Process timestamps
  hr_completed_at TIMESTAMP,
  leader_notified_at TIMESTAMP,
  leader_completed_at TIMESTAMP,

  -- Standard audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES hr_users(id)
);

-- Job Descriptions table (AI generation and validation)
CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,

  -- Generated content
  generated_content TEXT NOT NULL,
  generation_prompt TEXT,
  generation_model TEXT DEFAULT 'gpt-4',

  -- Validation workflow
  hr_approved BOOLEAN DEFAULT FALSE,
  leader_approved BOOLEAN DEFAULT FALSE,
  hr_feedback TEXT,
  leader_feedback TEXT,
  hr_approved_at TIMESTAMP,
  leader_approved_at TIMESTAMP,

  -- Versioning
  version_number INTEGER DEFAULT 1,
  is_current_version BOOLEAN DEFAULT TRUE,
  final_approved_at TIMESTAMP,
  published_at TIMESTAMP,

  -- Standard audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES hr_users(id)
);

-- Applicants table (candidate tracking)
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,

  -- Candidate information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  location TEXT,

  -- Application details
  cover_letter TEXT,
  resume_url TEXT,
  portfolio_files JSONB DEFAULT '[]', -- Array of file URLs

  -- Sourcing (use JSONB for flexibility)
  source_type TEXT DEFAULT 'direct_application' CHECK (source_type IN (
    'direct_application', 'community_referral', 'prisma_sourced', 'headhunter_referred'
  )),
  referrer_info JSONB DEFAULT '{}',

  -- Status tracking
  application_status TEXT DEFAULT 'applied' CHECK (application_status IN (
    'applied', 'hr_reviewing', 'hr_approved', 'technical_review',
    'interview_scheduled', 'interview_completed', 'offer_extended',
    'offer_accepted', 'offer_declined', 'hired', 'rejected'
  )),

  -- Evaluation scores
  hr_score INTEGER CHECK (hr_score BETWEEN 1 AND 10),
  technical_score INTEGER CHECK (technical_score BETWEEN 1 AND 10),
  overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 10),

  -- Notes and feedback
  hr_notes TEXT,
  technical_notes TEXT,
  rejection_reason TEXT,

  -- Standard audit fields
  applied_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES hr_users(id), -- Who processed the application
  reviewed_at TIMESTAMP
);

-- Application Activities table (audit trail)
CREATE TABLE IF NOT EXISTS application_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,

  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'status_change', 'note_added', 'document_uploaded',
    'interview_scheduled', 'email_sent', 'score_updated'
  )),
  activity_description TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}', -- Flexible additional data

  -- Actor tracking
  performed_by_user UUID REFERENCES hr_users(id),
  performed_by_type TEXT DEFAULT 'hr_user' CHECK (performed_by_type IN ('hr_user', 'system', 'applicant')),

  -- Standard audit fields
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email Communications table (email tracking)
CREATE TABLE IF NOT EXISTS email_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id),
  applicant_id UUID REFERENCES applicants(id),

  -- Email details
  email_type TEXT NOT NULL CHECK (email_type IN (
    'company_onboarding', 'hr_user_invitation', 'leader_form_request',
    'job_description_validation', 'applicant_status_update',
    'interview_invitation', 'offer_notification'
  )),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject_line TEXT NOT NULL,
  email_content TEXT NOT NULL,
  template_used TEXT,

  -- Email tracking
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  replied_at TIMESTAMP,
  reply_content TEXT,

  -- Standard audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES hr_users(id)
);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_users_updated_at BEFORE UPDATE ON hr_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON job_descriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON applicants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE companies IS 'Root tenant table - each company is a separate tenant';
COMMENT ON TABLE hr_users IS 'Company employees with role-based access to the platform';
COMMENT ON TABLE positions IS 'Job positions with progressive workflow completion';
COMMENT ON TABLE job_descriptions IS 'AI-generated job descriptions with validation workflow';
COMMENT ON TABLE applicants IS 'Candidate applications for positions';
COMMENT ON TABLE application_activities IS 'Audit trail for all applicant-related activities';
COMMENT ON TABLE email_communications IS 'Email tracking and communication history';

COMMENT ON COLUMN positions.position_code IS 'Unique code like POS_A1B2C3D4 used in leader form URLs';
COMMENT ON COLUMN positions.area_specific_data IS 'JSONB field for Product/Engineering/Growth/Design specific responses';
COMMENT ON COLUMN applicants.referrer_info IS 'JSONB field for flexible referral source tracking';
COMMENT ON COLUMN application_activities.metadata IS 'JSONB field for flexible activity-specific data';