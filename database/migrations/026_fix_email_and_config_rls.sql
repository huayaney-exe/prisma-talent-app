-- Migration 026: Fix Email Constraint and Config RLS Policies
-- Date: 2025-10-22
-- Purpose:
--   1. Allow same email across different companies (multi-tenant fix)
--   2. Fix RLS policy blocking SECURITY DEFINER functions from reading app_config
--
-- Issues Fixed:
--   - Error: "duplicate key value violates unique constraint hr_users_email_key"
--   - Error: "Supabase configuration not set" (RLS blocking config reads)

-- ============================================================================
-- FIX 1: Email Constraint - Allow Multi-Tenant Email Usage
-- ============================================================================

-- Drop the global UNIQUE constraint on email
-- This was preventing the same email from being used across multiple companies
ALTER TABLE hr_users DROP CONSTRAINT IF EXISTS hr_users_email_key;

-- Add composite UNIQUE constraint: (company_id, email)
-- Same email can exist across different companies, but not within the same company
ALTER TABLE hr_users
  ADD CONSTRAINT hr_users_company_email_key
  UNIQUE(company_id, email);

-- ============================================================================
-- FIX 2: Config RLS Policy - Allow Functions to Read Configuration
-- ============================================================================

-- Drop the overly restrictive "Block all other access" policy
-- This policy was preventing SECURITY DEFINER functions from reading config
DROP POLICY IF EXISTS "Block all other access" ON app_config;

-- Create more permissive read policy for authenticated users
-- SECURITY DEFINER functions execute as authenticated, so they need read access
CREATE POLICY "Authenticated can read config"
  ON app_config FOR SELECT
  TO authenticated
  USING (true);

-- Keep the service_role policy (already exists from migration 025)
-- This ensures service_role still has full access

-- Prevent writes from authenticated users (only service_role can write)
CREATE POLICY "Prevent authenticated writes to config"
  ON app_config FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Prevent authenticated updates to config"
  ON app_config FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Prevent authenticated deletes from config"
  ON app_config FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After running this migration, verify the fixes:

-- 1. Check new constraint exists:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'hr_users' AND constraint_name LIKE '%email%';

-- 2. Check RLS policies on app_config:
-- SELECT policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'app_config';

-- 3. Test config read from function (should return values, not NULL):
-- SELECT key, length(value) as value_length, description
-- FROM app_config;

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- Configuration Security Model:
-- - READ: authenticated users (needed for SECURITY DEFINER functions)
-- - WRITE: service_role only (prevents tampering)
-- - Frontend (anon key) cannot read config due to authentication requirement
-- ============================================================================

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 026 completed successfully';
  RAISE NOTICE '📧 Email constraint updated: Same email allowed across companies';
  RAISE NOTICE '🔐 RLS policies updated: Functions can now read app_config';
  RAISE NOTICE '🧪 Test 1: Try creating HR user with existing email in different company';
  RAISE NOTICE '🧪 Test 2: Try creating new client (magic link should send)';
END $$;
