-- ============================================================================
-- SIMPLE DIAGNOSIS: Quick Check of All Critical Components
-- ============================================================================

-- 1. Check RLS status
SELECT
  'RLS Status' as check_name,
  CASE WHEN rowsecurity THEN '❌ ENABLED' ELSE '✅ DISABLED' END as result
FROM pg_tables
WHERE tablename = 'app_config';

-- 2. Check config values exist
SELECT
  'Config Count' as check_name,
  count(*)::text || ' rows' as result
FROM app_config;

-- 3. Check specific config values
SELECT
  'Config Values' as check_name,
  key,
  CASE
    WHEN key LIKE '%key%' THEN '[REDACTED ' || length(value) || ' chars]'
    ELSE value
  END as value
FROM app_config
ORDER BY key;

-- 4. Test authenticated role can read
SET ROLE authenticated;
SELECT
  'Auth Read Test' as check_name,
  count(*)::text || ' rows readable' as result
FROM app_config;
RESET ROLE;

-- 5. Check invite_client function exists
SELECT
  'Function Exists' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'invite_client'
  ) THEN '✅ YES' ELSE '❌ NO' END as result;

-- 6. TEST: Call invite_client with dummy data
SELECT
  'invite_client Test' as check_name,
  invite_client(
    p_email := 'test@example.com',
    p_company_id := '00000000-0000-0000-0000-000000000000'::uuid,
    p_company_name := 'Test Company',
    p_hr_user_id := '00000000-0000-0000-0000-000000000000'::uuid,
    p_full_name := 'Test User'
  ) as result;

-- 7. Check table grants
SELECT
  'Table Grants' as check_name,
  grantee,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants
WHERE table_name = 'app_config'
  AND grantee IN ('authenticated', 'anon', 'postgres')
GROUP BY grantee
ORDER BY grantee;
