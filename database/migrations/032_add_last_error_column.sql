-- Migration 032: Add last_error column to email_communications
-- Date: 2025-10-23
-- Purpose: Fix schema mismatch - send_email_via_resend() function expects last_error column
-- Context: Migration 013 added error_message, but migration 022's function uses last_error
-- Resolution: Add last_error column to match function expectations

-- ============================================================================
-- PROBLEM ANALYSIS
-- ============================================================================
-- Migration 013 added: error_message TEXT
-- Migration 022 function uses: last_error (lines 131, 151)
-- Result: Column "last_error" does not exist error when email trigger fires
-- Impact: Position creation fails at hr_draft → hr_completed transition

-- ============================================================================
-- ADD MISSING COLUMN
-- ============================================================================

ALTER TABLE email_communications
  ADD COLUMN IF NOT EXISTS last_error TEXT;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN email_communications.last_error IS
  'Last error message from email send attempt. Used by send_email_via_resend() function for retry logic and debugging. Contains HTTP error details or PostgreSQL SQLERRM on exceptions.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_communications'
    AND column_name = 'last_error'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: Column last_error added to email_communications';
    RAISE NOTICE '📧 Email trigger workflow now functional';
    RAISE NOTICE '🔄 Position creation hr_draft → hr_completed will work';
    RAISE NOTICE 'Migration 032 completed successfully';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Could not add last_error column to email_communications';
  END IF;
END $$;
