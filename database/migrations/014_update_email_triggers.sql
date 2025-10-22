-- Migration: Update email triggers to include template_data
-- Date: 2025-10-10
-- Purpose: Add template_data JSONB to email notification triggers for email worker

-- ============================================================================
-- TRIGGER 1 UPDATE: Auto-notify Business User when HR completes form
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_business_user_on_hr_completion()
RETURNS TRIGGER AS $$
DECLARE
  company_name_var TEXT;
  form_url TEXT;
BEGIN
  -- When HR form is completed (workflow_stage changes to 'hr_completed')
  IF NEW.workflow_stage = 'hr_completed' AND OLD.workflow_stage = 'hr_draft' THEN
    -- Get company name
    SELECT company_name INTO company_name_var
    FROM companies WHERE id = NEW.company_id;

    -- Build form URL with position code
    form_url := 'https://talent.getprisma.io/business-form?code=' || NEW.position_code;

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
      sent_at  -- Set to NULL so worker can process it
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
      NULL  -- Worker will set sent_at after sending
    );

    -- Update workflow stage to 'leader_notified'
    NEW.workflow_stage := 'leader_notified';
    NEW.leader_notified_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_notify_business_user ON positions;

CREATE TRIGGER trigger_notify_business_user
  BEFORE UPDATE ON positions
  FOR EACH ROW
  WHEN (NEW.workflow_stage = 'hr_completed' AND OLD.workflow_stage = 'hr_draft')
  EXECUTE FUNCTION notify_business_user_on_hr_completion();

-- ============================================================================
-- TRIGGER 2 UPDATE: Auto-notify HR when Business User completes specs
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_hr_on_business_completion()
RETURNS TRIGGER AS $$
DECLARE
  hr_user_email TEXT;
  hr_user_name TEXT;
  company_name_var TEXT;
  admin_url TEXT;
BEGIN
  -- When Business User completes specs (workflow_stage changes to 'leader_completed')
  IF NEW.workflow_stage = 'leader_completed' AND OLD.workflow_stage IN ('leader_notified', 'leader_in_progress') THEN
    -- Get HR user who created the position
    SELECT email, full_name INTO hr_user_email, hr_user_name
    FROM hr_users
    WHERE id = NEW.created_by;

    -- Get company name
    SELECT company_name INTO company_name_var
    FROM companies WHERE id = NEW.company_id;

    -- Build admin URL
    admin_url := 'https://talent.getprisma.io/admin/positions/' || NEW.id;

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
      sent_at  -- Set to NULL so worker can process it
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
      NULL  -- Worker will set sent_at after sending
    );

    -- Update workflow stage
    NEW.leader_completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_notify_hr_on_business_completion ON positions;

CREATE TRIGGER trigger_notify_hr_on_business_completion
  BEFORE UPDATE ON positions
  FOR EACH ROW
  WHEN (NEW.workflow_stage = 'leader_completed')
  EXECUTE FUNCTION notify_hr_on_business_completion();

-- ============================================================================
-- TRIGGER 3 UPDATE: Auto-send confirmation email to new applicants
-- ============================================================================

CREATE OR REPLACE FUNCTION send_applicant_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  position_name_var TEXT;
  company_name_var TEXT;
  position_code_var TEXT;
BEGIN
  -- Get position and company details
  SELECT p.position_name, c.company_name, p.position_code
  INTO position_name_var, company_name_var, position_code_var
  FROM positions p
  JOIN companies c ON c.id = p.company_id
  WHERE p.id = NEW.position_id;

  -- Insert email notification with template_data
  INSERT INTO email_communications (
    company_id,
    position_id,
    applicant_id,
    email_type,
    recipient_email,
    recipient_name,
    subject_line,
    email_content,
    template_used,
    template_data,
    sent_at  -- Set to NULL so worker can process it
  ) VALUES (
    NEW.company_id,
    NEW.position_id,
    NEW.id,
    'applicant_status_update',
    NEW.email,
    NEW.full_name,
    'Aplicación recibida: ' || position_name_var || ' en ' || company_name_var,
    'Email pending worker processing',
    'applicant_status_update',
    jsonb_build_object(
      'applicant_name', NEW.full_name,
      'position_name', position_name_var,
      'company_name', company_name_var,
      'position_code', position_code_var
    ),
    NULL  -- Worker will set sent_at after sending
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_send_applicant_confirmation ON applicants;

CREATE TRIGGER trigger_send_applicant_confirmation
  AFTER INSERT ON applicants
  FOR EACH ROW
  EXECUTE FUNCTION send_applicant_confirmation();

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ Email triggers updated with template_data support';
  RAISE NOTICE '📧 Email worker can now render templates with proper data';
  RAISE NOTICE '🔄 Triggers now set sent_at = NULL for worker processing';
END $$;
