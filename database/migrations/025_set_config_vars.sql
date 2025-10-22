-- Migration 025: Set Database Configuration Variables
-- Date: 2025-10-22
-- Purpose: Configure API keys and URLs for email sender and client invitation functions
-- ⚠️ IMPORTANT: Replace placeholder values with actual keys before running!

-- ============================================================================
-- CONFIGURATION INSTRUCTIONS
-- ============================================================================
-- 1. Get your Resend API key from: https://resend.com/api-keys
-- 2. Get your Supabase service_role_key from: Supabase Dashboard → Settings → API
-- 3. Replace the placeholder values below with your actual keys
-- 4. Run this migration: psql $SUPABASE_DATABASE_URL -f 025_set_config_vars.sql
-- ============================================================================

-- Set Resend API Key
ALTER DATABASE postgres SET app.resend_api_key = 're_YOUR_RESEND_API_KEY_HERE';

-- Set Supabase configuration
ALTER DATABASE postgres SET app.supabase_url = 'https://vhjjibfblrkyfzcukqwa.supabase.co';
ALTER DATABASE postgres SET app.supabase_service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_ROLE_KEY_HERE';

-- Set Frontend URL
ALTER DATABASE postgres SET app.frontend_url = 'https://prismatalent.vercel.app';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify configuration was set correctly:
-- SELECT name, setting FROM pg_settings WHERE name LIKE 'app.%';

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- These configuration values are stored in the database and accessible to:
-- - Functions with SECURITY DEFINER (send_email_via_resend, invite_client)
-- - Database superuser (postgres role)
--
-- They are NOT accessible to:
-- - Frontend (anon key users)
-- - Regular authenticated users
-- - RLS policies
--
-- Best practice: Use database-level config for sensitive keys that should
-- only be accessed by trusted database functions.
-- ============================================================================

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ Database configuration variables set';
  RAISE NOTICE '⚠️  IMPORTANT: Verify you replaced placeholder values with actual keys!';
  RAISE NOTICE '🔐 Check config: SELECT name, setting FROM pg_settings WHERE name LIKE ''app.%%'';';
  RAISE NOTICE '📧 Resend API key: app.resend_api_key';
  RAISE NOTICE '🔑 Supabase service_role_key: app.supabase_service_role_key';
  RAISE NOTICE '🌐 Frontend URL: app.frontend_url';
END $$;
