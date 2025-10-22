-- Migration 020: Add client_invitation email type
-- Description: Adds 'client_invitation' to the email_type enum constraint
-- Date: 2025-10-21
-- Author: Claude Code

-- Drop existing constraint
ALTER TABLE email_communications
  DROP CONSTRAINT IF EXISTS email_communications_email_type_check;

-- Recreate constraint with new email_type
ALTER TABLE email_communications
  ADD CONSTRAINT email_communications_email_type_check
  CHECK (email_type IN (
    'company_onboarding',
    'hr_user_invitation',
    'leader_form_request',
    'job_description_validation',
    'applicant_status_update',
    'interview_invitation',
    'offer_notification',
    'client_invitation'  -- NEW: For magic link invitations to new clients
  ));

-- Add comment
COMMENT ON CONSTRAINT email_communications_email_type_check ON email_communications IS
  'Valid email types including client_invitation for magic link invitations';
