-- Migration 023: Trigger Email Sender on INSERT
-- Date: 2025-10-22
-- Purpose: Automatically send emails when new records are inserted into email_communications table
-- Architecture: INSERT → This trigger → send_email_via_resend() → Resend API

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_send_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if email hasn't been sent yet
  IF NEW.sent_at IS NULL THEN
    -- Call email sender function asynchronously
    -- Note: This executes immediately in the same transaction
    PERFORM send_email_via_resend(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_email_insert ON email_communications;

-- Create trigger that fires after INSERT
CREATE TRIGGER on_email_insert
  AFTER INSERT ON email_communications
  FOR EACH ROW
  WHEN (NEW.sent_at IS NULL)
  EXECUTE FUNCTION trigger_send_email();

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ Email trigger created successfully';
  RAISE NOTICE '📧 Emails will be sent automatically when inserted into email_communications';
  RAISE NOTICE '🚀 No polling needed - instant email delivery!';
END $$;
