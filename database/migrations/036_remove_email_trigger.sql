-- Migration 036: Remove database trigger approach for email notifications
-- Date: 2025-10-23
-- Purpose: Clean up incorrect trigger-based email architecture
-- Context: Email notifications now handled by Edge Function called from frontend
-- Resolution: DROP trigger and function, follow invite-client pattern

-- ============================================================================
-- ARCHITECTURE CHANGE EXPLANATION
-- ============================================================================
-- OLD (INCORRECT): Database Trigger → pg_net → Edge Function
--   Problems:
--   - Unreliable pg_net background worker
--   - Hardcoded service_role_key in database (security risk)
--   - No user feedback on email success/failure
--   - Inconsistent with existing invite-client pattern
--
-- NEW (CORRECT): Frontend → Edge Function
--   Benefits:
--   - Direct call from frontend (matches invite-client)
--   - Proper error handling with user feedback
--   - No pg_net reliability issues
--   - Consistent architecture across all email operations
--   - No security concerns with keys in database

-- ============================================================================
-- DROP OLD TRIGGER-BASED EMAIL SYSTEM
-- ============================================================================

-- Drop trigger first
DROP TRIGGER IF EXISTS notify_leader_on_hr_completion ON positions;

-- Drop trigger function
DROP FUNCTION IF EXISTS trigger_send_position_email();

-- Drop old email function from migration 022 (no longer needed)
DROP FUNCTION IF EXISTS send_email_on_position_complete();

-- Drop pg_net-based resend function from migration 033 (no longer needed)
DROP FUNCTION IF EXISTS send_email_via_resend(uuid);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify trigger removed
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'notify_leader_on_hr_completion'
  ) THEN
    RAISE NOTICE '✅ Trigger notify_leader_on_hr_completion removed successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to remove trigger notify_leader_on_hr_completion';
  END IF;

  -- Verify functions removed
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname IN ('trigger_send_position_email', 'send_email_on_position_complete', 'send_email_via_resend')
  ) THEN
    RAISE NOTICE '✅ All old email functions removed successfully';
  ELSE
    RAISE WARNING '⚠️ Some email functions may still exist';
  END IF;

  RAISE NOTICE '📧 Email notifications now handled by Edge Function: send-position-email';
  RAISE NOTICE '🔧 Frontend calls Edge Function directly after position creation';
  RAISE NOTICE '✅ Architecture now consistent with invite-client pattern';
END $$;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE email_communications IS
  'Email tracking table. Emails sent via Edge Functions (send-position-email, invite-client). Edge Functions create records here after sending via Resend API.';
