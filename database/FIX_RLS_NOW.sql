-- ============================================================================
-- IMMEDIATE FIX: Disable RLS and Drop All Policies on app_config
-- ============================================================================

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Service role can read config" ON app_config;
DROP POLICY IF EXISTS "Authenticated can read config" ON app_config;
DROP POLICY IF EXISTS "Prevent authenticated writes to config" ON app_config;
DROP POLICY IF EXISTS "Prevent authenticated updates to config" ON app_config;
DROP POLICY IF EXISTS "Prevent authenticated deletes from config" ON app_config;
DROP POLICY IF EXISTS "Block all other access" ON app_config;
DROP POLICY IF EXISTS "Allow all authenticated reads" ON app_config;
DROP POLICY IF EXISTS "Block all writes except service_role" ON app_config;

-- Step 2: Disable RLS entirely
ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant explicit SELECT to authenticated and anon
GRANT SELECT ON app_config TO authenticated, anon;

-- Step 4: Verify it worked
SELECT
  'RLS Status' as check,
  CASE WHEN rowsecurity THEN '❌ STILL ENABLED' ELSE '✅ DISABLED' END as result
FROM pg_tables
WHERE tablename = 'app_config';

-- Step 5: Test that function can now read config
SELECT invite_client(
  p_email := 'test@example.com',
  p_company_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_company_name := 'Test Company',
  p_hr_user_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_full_name := 'Test User'
) as function_test_result;
