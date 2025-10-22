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
-- 4. Run this migration in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================================

-- Create configuration table to store secrets
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert configuration values
-- ⚠️ REPLACE PLACEHOLDER VALUES WITH ACTUAL KEYS!
INSERT INTO app_config (key, value, description) VALUES
  ('resend_api_key', 're_YOUR_RESEND_API_KEY_HERE', 'Resend API key for sending emails'),
  ('supabase_url', 'https://vhjjibfblrkyfzcukqwa.supabase.co', 'Supabase project URL'),
  ('supabase_service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_ROLE_KEY_HERE', 'Supabase service role key (Admin API)'),
  ('frontend_url', 'https://prismatalent.vercel.app', 'Frontend application URL')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Enable RLS (Row Level Security) on config table
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only service_role can read config (no one else!)
CREATE POLICY "Service role can read config"
  ON app_config FOR SELECT
  TO service_role
  USING (true);

-- Policy: Block all other access
CREATE POLICY "Block all other access"
  ON app_config FOR ALL
  TO anon, authenticated
  USING (false);

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
