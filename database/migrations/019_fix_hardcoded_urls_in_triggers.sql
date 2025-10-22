-- Migration 019: Fix hardcoded URLs in email triggers
-- Date: 2025-10-20
-- Purpose: Replace hardcoded production URLs with environment-based configuration
-- Critical: Allows triggers to work in dev/staging/production environments

-- ============================================================================
-- STEP 1: Create app_config table for environment variables
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default configuration (will be overridden by environment)
INSERT INTO app_config (key, value, description)
VALUES
  ('frontend_url', 'http://localhost:3000', 'Base frontend URL for email links'),
  ('admin_dashboard_url', 'http://localhost:3000/admin', 'Admin dashboard base URL')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- STEP 2: Helper function to get config value
-- ============================================================================

CREATE OR REPLACE FUNCTION get_config(config_key TEXT)
RETURNS TEXT AS $$
DECLARE
  config_value TEXT;
BEGIN
  SELECT value INTO config_value
  FROM app_config
  WHERE key = config_key;

  RETURN config_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 3: Update TRIGGER 1 - Remove hardcoded form_url
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_business_user_on_hr_completion()
RETURNS TRIGGER AS $$
DECLARE
  company_name_var TEXT;
  form_url TEXT;
  frontend_base_url TEXT;
BEGIN
  -- When HR form is completed (workflow_stage changes to 'hr_completed')
  IF NEW.workflow_stage = 'hr_completed' AND OLD.workflow_stage = 'hr_draft' THEN
    -- Get company name
    SELECT company_name INTO company_name_var
    FROM companies WHERE id = NEW.company_id;

    -- Get frontend URL from config
    frontend_base_url := get_config('frontend_url');

    -- Build form URL with position code using config value
    form_url := frontend_base_url || '/business-form?code=' || NEW.position_code;

    -- Insert email notification record with template_data
    INSERT INTO email_communications (
      company_id,
      position_id,
      email_type,
      recipient_email,
      recipient_name,
      subject_line,
      email_content,
      template_used,
      template_data,
      sent_at
    ) VALUES (
      NEW.company_id,
      NEW.id,
      'leader_form_request',
      NEW.leader_email,
      NEW.leader_name,
      'Nueva apertura en ' || company_name_var || ' - Tu input es requerido',
      'Email pending worker processing',
      'leader_form_request',
      jsonb_build_object(
        'leader_name', NEW.leader_name,
        'company_name', company_name_var,
        'position_name', NEW.position_name,
        'position_code', NEW.position_code,
        'form_url', form_url
      ),
      NULL
    );

    -- Update workflow stage to 'leader_notified'
    NEW.workflow_stage := 'leader_notified';
    NEW.leader_notified_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Update TRIGGER 2 - Remove hardcoded admin_url
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_hr_on_business_completion()
RETURNS TRIGGER AS $$
DECLARE
  hr_user_email TEXT;
  hr_user_name TEXT;
  company_name_var TEXT;
  admin_url TEXT;
  admin_base_url TEXT;
BEGIN
  -- When Business User completes specs
  IF NEW.workflow_stage = 'leader_completed' AND OLD.workflow_stage IN ('leader_notified', 'leader_in_progress') THEN
    -- Get HR user who created the position
    SELECT email, full_name INTO hr_user_email, hr_user_name
    FROM hr_users
    WHERE id = NEW.created_by;

    -- Get company name
    SELECT company_name INTO company_name_var
    FROM companies WHERE id = NEW.company_id;

    -- Get admin dashboard URL from config
    admin_base_url := get_config('admin_dashboard_url');

    -- Build admin URL using config value
    admin_url := admin_base_url || '/positions/' || NEW.id;

    -- Insert email notification to HR with template_data
    INSERT INTO email_communications (
      company_id,
      position_id,
      email_type,
      recipient_email,
      recipient_name,
      subject_line,
      email_content,
      template_used,
      template_data,
      sent_at
    ) VALUES (
      NEW.company_id,
      NEW.id,
      'job_description_validation',
      hr_user_email,
      hr_user_name,
      'Especificaciones completadas para ' || NEW.position_name,
      'Email pending worker processing',
      'job_description_validation',
      jsonb_build_object(
        'hr_name', hr_user_name,
        'position_name', NEW.position_name,
        'position_code', NEW.position_code,
        'company_name', company_name_var,
        'leader_name', NEW.leader_name,
        'admin_url', admin_url
      ),
      NULL
    );

    -- Update workflow stage
    NEW.leader_completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 019 complete: Hardcoded URLs removed from triggers';
  RAISE NOTICE '📋 Created app_config table for environment configuration';
  RAISE NOTICE '🔧 Updated notify_business_user_on_hr_completion() function';
  RAISE NOTICE '🔧 Updated notify_hr_on_business_completion() function';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Update app_config values for production:';
  RAISE NOTICE '   UPDATE app_config SET value = ''https://talent.prisma.pe'' WHERE key = ''frontend_url'';';
  RAISE NOTICE '   UPDATE app_config SET value = ''https://talent.prisma.pe/admin'' WHERE key = ''admin_dashboard_url'';';
END $$;
