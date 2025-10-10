-- ============================================================================
-- Phase 1: Database Triggers for Business Logic Automation
--
-- Purpose: Automated workflow updates and notification triggers
-- Key Principle: Database-driven state management for reliability
-- Migration Date: 2025-01-09
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: Auto-notify Business User when HR completes form
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_business_user_on_hr_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When HR form is completed (workflow_stage changes to 'hr_completed')
  IF NEW.workflow_stage = 'hr_completed' AND OLD.workflow_stage = 'hr_draft' THEN
    -- Insert email notification record
    INSERT INTO email_communications (
      company_id,
      position_id,
      email_type,
      recipient_email,
      recipient_name,
      subject_line,
      email_content,
      template_used
    ) VALUES (
      NEW.company_id,
      NEW.id,
      'leader_form_request',
      NEW.leader_email,
      NEW.leader_name,
      'Nueva apertura en ' || (SELECT company_name FROM companies WHERE id = NEW.company_id) || ' - Tu input es requerido',
      'Business user notification pending template rendering',
      'business_user_request'
    );

    -- Update workflow stage to 'leader_notified'
    NEW.workflow_stage := 'leader_notified';
    NEW.leader_notified_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_business_user
  BEFORE UPDATE ON positions
  FOR EACH ROW
  WHEN (NEW.workflow_stage = 'hr_completed' AND OLD.workflow_stage = 'hr_draft')
  EXECUTE FUNCTION notify_business_user_on_hr_completion();

-- ============================================================================
-- TRIGGER 2: Auto-notify HR when Business User completes specs
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_hr_on_business_completion()
RETURNS TRIGGER AS $$
DECLARE
  hr_user_email TEXT;
  hr_user_name TEXT;
BEGIN
  -- When Business User completes specs (workflow_stage changes to 'leader_completed')
  IF NEW.workflow_stage = 'leader_completed' AND OLD.workflow_stage IN ('leader_notified', 'leader_in_progress') THEN
    -- Get HR user who created the position
    SELECT email, full_name INTO hr_user_email, hr_user_name
    FROM hr_users
    WHERE id = NEW.created_by;

    -- Insert email notification to HR
    INSERT INTO email_communications (
      company_id,
      position_id,
      email_type,
      recipient_email,
      recipient_name,
      subject_line,
      email_content,
      template_used
    ) VALUES (
      NEW.company_id,
      NEW.id,
      'job_description_validation',
      hr_user_email,
      hr_user_name,
      'Especificaciones completadas para ' || NEW.position_name,
      'HR notification pending template rendering',
      'business_specs_completed'
    );

    -- Update workflow stage
    NEW.leader_completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_hr_on_business_completion
  BEFORE UPDATE ON positions
  FOR EACH ROW
  WHEN (NEW.workflow_stage = 'leader_completed')
  EXECUTE FUNCTION notify_hr_on_business_completion();

-- ============================================================================
-- TRIGGER 3: Auto-create activity log on applicant status change
-- ============================================================================

CREATE OR REPLACE FUNCTION log_applicant_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any status change
  IF NEW.application_status != OLD.application_status THEN
    INSERT INTO application_activities (
      company_id,
      applicant_id,
      activity_type,
      activity_description,
      previous_value,
      new_value,
      performed_by_user,
      performed_by_type
    ) VALUES (
      NEW.company_id,
      NEW.id,
      'status_change',
      'Application status changed from ' || OLD.application_status || ' to ' || NEW.application_status,
      OLD.application_status,
      NEW.application_status,
      NEW.created_by,
      'hr_user'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_applicant_status_change
  AFTER UPDATE ON applicants
  FOR EACH ROW
  WHEN (NEW.application_status != OLD.application_status)
  EXECUTE FUNCTION log_applicant_status_change();

-- ============================================================================
-- TRIGGER 4: Auto-send confirmation email to new applicants
-- ============================================================================

CREATE OR REPLACE FUNCTION send_applicant_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  position_name TEXT;
  company_name TEXT;
BEGIN
  -- Get position and company details
  SELECT p.position_name, c.company_name
  INTO position_name, company_name
  FROM positions p
  JOIN companies c ON c.id = p.company_id
  WHERE p.id = NEW.position_id;

  -- Insert email notification
  INSERT INTO email_communications (
    company_id,
    position_id,
    applicant_id,
    email_type,
    recipient_email,
    recipient_name,
    subject_line,
    email_content,
    template_used
  ) VALUES (
    NEW.company_id,
    NEW.position_id,
    NEW.id,
    'applicant_status_update',
    NEW.email,
    NEW.full_name,
    'Aplicación recibida: ' || position_name || ' en ' || company_name,
    'Applicant confirmation email pending template rendering',
    'application_received'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_send_applicant_confirmation
  AFTER INSERT ON applicants
  FOR EACH ROW
  EXECUTE FUNCTION send_applicant_confirmation();

-- ============================================================================
-- TRIGGER 5: Update position workflow on JD publication
-- ============================================================================

CREATE OR REPLACE FUNCTION update_position_on_jd_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- When JD is published, update position workflow to 'active'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status = 'draft') THEN
    UPDATE positions
    SET workflow_stage = 'active'
    WHERE id = NEW.position_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_position_on_jd_publish
  AFTER UPDATE ON job_descriptions
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION update_position_on_jd_publish();

-- ============================================================================
-- TRIGGER 6: Prevent deletion of active positions
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_active_position_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.workflow_stage = 'active' THEN
    RAISE EXCEPTION 'Cannot delete active position. Change status to cancelled first.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_active_position_deletion
  BEFORE DELETE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_active_position_deletion();

-- ============================================================================
-- TRIGGER 7: Auto-update company onboarding status
-- ============================================================================

CREATE OR REPLACE FUNCTION update_company_onboarding_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When first HR user is created, mark company as onboarded
  IF NOT EXISTS (
    SELECT 1 FROM hr_users
    WHERE company_id = NEW.company_id
    AND id != NEW.id
  ) THEN
    UPDATE companies
    SET
      onboarding_completed = TRUE,
      onboarding_completed_at = NOW(),
      subscription_status = CASE
        WHEN subscription_status = 'lead' THEN 'trial'
        ELSE subscription_status
      END
    WHERE id = NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_onboarding_status
  AFTER INSERT ON hr_users
  FOR EACH ROW
  EXECUTE FUNCTION update_company_onboarding_status();

-- ============================================================================
-- Helper Functions for Manual Trigger Testing
-- ============================================================================

-- Function to manually trigger notification (useful for testing)
CREATE OR REPLACE FUNCTION test_notification_trigger(position_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  result_message TEXT;
BEGIN
  -- Simulate HR completion
  UPDATE positions
  SET workflow_stage = 'hr_completed'
  WHERE id = position_id_param
  AND workflow_stage = 'hr_draft';

  GET DIAGNOSTICS result_message = ROW_COUNT;

  IF result_message::INTEGER > 0 THEN
    RETURN '✅ Notification trigger executed for position ' || position_id_param;
  ELSE
    RETURN '❌ No position found or already completed: ' || position_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Success Message
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1 Database Triggers Complete';
  RAISE NOTICE '🔔 Notification triggers configured:';
  RAISE NOTICE '   1. Business user notified when HR completes form';
  RAISE NOTICE '   2. HR notified when Business user completes specs';
  RAISE NOTICE '   3. Activity log on applicant status change';
  RAISE NOTICE '   4. Confirmation email to new applicants';
  RAISE NOTICE '   5. Position status updated on JD publish';
  RAISE NOTICE '   6. Active positions protected from deletion';
  RAISE NOTICE '   7. Company onboarding auto-completed';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test triggers with: SELECT test_notification_trigger(''position-uuid'');';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Phase 1 Complete - Database Setup Finished';
  RAISE NOTICE '📋 Next: Test database setup (see tests/integration/)';
END $$;
