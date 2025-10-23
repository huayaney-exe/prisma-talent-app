-- Migration 034: Update trigger to use Edge Function for email sending
-- Date: 2025-10-23
-- Purpose: Replace pg_net function call with Supabase Edge Function invocation
-- Context: Following established pattern from invite-client Edge Function
-- Resolution: Trigger calls send-position-email Edge Function via pg_net http_post

-- ============================================================================
-- PROBLEM ANALYSIS
-- ============================================================================
-- Migration 022 used pg_net with send_email_via_resend() function
-- Issue: pg_net background worker not processing HTTP requests
-- Existing Pattern: invite-client Edge Function already in production
-- Correct Approach: Use Edge Functions for all email operations

-- ============================================================================
-- UPDATE TRIGGER TO CALL EDGE FUNCTION
-- ============================================================================

-- Drop old trigger first
DROP TRIGGER IF EXISTS notify_leader_on_hr_completion ON positions;

-- Create new trigger function that calls Edge Function
CREATE OR REPLACE FUNCTION trigger_send_position_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  email_id UUID;
  edge_function_url TEXT;
  supabase_service_role_key TEXT;
BEGIN
  -- Insert email record
  INSERT INTO email_communications (
    company_id,
    position_id,
    email_type,
    recipient_email,
    recipient_name,
    subject_line,
    email_content,
    template_data,
    status
  )
  SELECT
    NEW.company_id,
    NEW.id,
    'leader_form_request',
    c.business_leader_email,
    c.business_leader_name,
    format('Acción Requerida: Nueva Posición %s en %s', NEW.position_name, c.company_name),
    '',
    jsonb_build_object(
      'leader_name', c.business_leader_name,
      'company_name', c.company_name,
      'position_name', NEW.position_name,
      'position_code', NEW.position_code,
      'form_url', format('https://talent-platform.vercel.app/business-leader/positions/%s', NEW.id)
    ),
    'pending'
  FROM companies c
  WHERE c.id = NEW.company_id
  RETURNING id INTO email_id;

  -- Get Edge Function URL and service role key
  edge_function_url := current_setting('app.supabase_url', true) || '/functions/v1/send-position-email';
  supabase_service_role_key := current_setting('app.supabase_service_role_key', true);

  -- Call Edge Function via pg_net
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || supabase_service_role_key
    ),
    body := jsonb_build_object(
      'email_id', email_id
    )
  );

  -- Update position workflow stage
  UPDATE positions
  SET workflow_stage = 'leader_notified'
  WHERE id = NEW.id;

  RAISE NOTICE '📧 Edge Function invoked for email_id: % (position: %)', email_id, NEW.id;

  RETURN NEW;
END;
$function$;

-- Create trigger
CREATE TRIGGER notify_leader_on_hr_completion
  AFTER UPDATE OF workflow_stage ON positions
  FOR EACH ROW
  WHEN (OLD.workflow_stage = 'hr_draft' AND NEW.workflow_stage = 'hr_completed')
  EXECUTE FUNCTION trigger_send_position_email();

-- ============================================================================
-- SET REQUIRED DATABASE PARAMETERS
-- ============================================================================
-- Note: These need to be set once in the database

COMMENT ON FUNCTION trigger_send_position_email() IS
  'Trigger function that calls send-position-email Edge Function when position moves from hr_draft to hr_completed. Requires app.supabase_url and app.supabase_service_role_key to be set in database.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify trigger exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'notify_leader_on_hr_completion'
  ) THEN
    RAISE NOTICE '✅ Trigger notify_leader_on_hr_completion created successfully';
    RAISE NOTICE '📧 Trigger now calls send-position-email Edge Function';
    RAISE NOTICE '🔧 Edge Function deployed at: /functions/v1/send-position-email';
    RAISE NOTICE '⚠️  Ensure database parameters are set:';
    RAISE NOTICE '   - app.supabase_url = https://vhjjibfblrkyfzcukqwa.supabase.co';
    RAISE NOTICE '   - app.supabase_service_role_key = <your-service-role-key>';
  ELSE
    RAISE EXCEPTION '❌ Failed to create trigger notify_leader_on_hr_completion';
  END IF;
END $$;
