-- ============================================================================
-- COMPREHENSIVE DIAGNOSIS: invite_client Configuration Issue
-- ============================================================================
-- Copy/paste this entire script into Supabase SQL Editor to diagnose all issues

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '    COMPREHENSIVE DIAGNOSIS REPORT';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. CHECK RLS STATUS ON app_config
-- ============================================================================
DO $$
DECLARE
  rls_status BOOLEAN;
BEGIN
  RAISE NOTICE '1️⃣  RLS STATUS ON app_config TABLE';
  RAISE NOTICE '────────────────────────────────────────────────────────────────────────────';

  SELECT rowsecurity INTO rls_status
  FROM pg_tables
  WHERE tablename = 'app_config';

  RAISE NOTICE 'RLS Enabled: %', CASE WHEN rls_status THEN '❌ YES (should be DISABLED)' ELSE '✅ NO (correct)' END;
  RAISE NOTICE '';
END $$;

SELECT
  tablename,
  rowsecurity AS rls_enabled,
  CASE
    WHEN rowsecurity THEN '❌ RLS is ON - should be OFF after migration 028'
    ELSE '✅ RLS is OFF - correct'
  END as status
FROM pg_tables
WHERE tablename = 'app_config';

-- ============================================================================
-- 2. CHECK RLS POLICIES (Should be 0 after migration 028)
-- ============================================================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  RLS POLICIES ON app_config';
  RAISE NOTICE '────────────────────────────────────────────────────────────────────────────';

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'app_config';

  RAISE NOTICE 'Policy Count: %', CASE WHEN policy_count = 0 THEN '✅ 0 (correct after migration 028)' ELSE '⚠️  ' || policy_count || ' (migration 028 may not have run)' END;
  RAISE NOTICE '';
END $$;

SELECT
  policyname,
  roles,
  cmd,
  CASE
    WHEN policyname IS NOT NULL THEN '⚠️  Policy still exists (migration 028 not fully applied)'
    ELSE '✅ No policies'
  END as status
FROM pg_policies
WHERE tablename = 'app_config'
ORDER BY policyname;

-- ============================================================================
-- 3. CHECK app_config VALUES
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  app_config TABLE VALUES';
  RAISE NOTICE '────────────────────────────────────────────────────────────────────────────';
END $$;

SELECT
  key,
  CASE
    WHEN key LIKE '%key%' THEN '[REDACTED ' || length(value) || ' chars]'
    ELSE value
  END as display_value,
  length(value) as actual_length,
  CASE
    WHEN key = 'frontend_url' AND value = 'https://prismatalent.vercel.app' THEN '✅ Production URL (migration 027 applied)'
    WHEN key = 'frontend_url' AND value LIKE '%localhost%' THEN '❌ Localhost URL (migration 027 NOT applied)'
    WHEN key = 'admin_dashboard_url' AND value = 'https://prismatalent.vercel.app/admin' THEN '✅ Production URL (migration 027 applied)'
    WHEN key = 'admin_dashboard_url' AND value LIKE '%localhost%' THEN '❌ Localhost URL (migration 027 NOT applied)'
    WHEN key LIKE '%key%' AND length(value) > 30 THEN '✅ Has value'
    WHEN key LIKE '%url%' AND length(value) > 10 THEN '✅ Has value'
    WHEN length(value) = 0 THEN '❌ EMPTY'
    ELSE '✅ Has value'
  END as status
FROM app_config
ORDER BY key;

-- ============================================================================
-- 4. TEST AUTHENTICATED ROLE ACCESS
-- ============================================================================
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  TEST: Can authenticated role read app_config?';
  RAISE NOTICE '────────────────────────────────────────────────────────────────────────────';
END $$;

-- Test as authenticated role
SET ROLE authenticated;
SELECT
  count(*) as readable_rows,
  CASE
    WHEN count(*) = 5 THEN '✅ Authenticated can read all config (RLS disabled or policy working)'
    WHEN count(*) = 0 THEN '❌ Authenticated CANNOT read config (RLS blocking)'
    ELSE '⚠️  Partial access: ' || count(*) || ' rows'
  END as status
FROM app_config;
RESET ROLE;

-- ============================================================================
-- 5. TEST invite_client FUNCTION EXISTS AND SIGNATURE
-- ============================================================================
DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣  CHECK: invite_client FUNCTION';
  RAISE NOTICE '────────────────────────────────────────────────────────────────────────────';

  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'invite_client'
  ) INTO func_exists;

  RAISE NOTICE 'Function Exists: %', CASE WHEN func_exists THEN '✅ YES' ELSE '❌ NO (migration 024 not applied)' END;
END $$;

SELECT
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as parameters,
  CASE
    WHEN p.prosecdef THEN '✅ SECURITY DEFINER (correct)'
    ELSE '❌ Not SECURITY DEFINER'
  END as security_mode
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'invite_client';

-- ============================================================================
-- 6. TEST invite_client FUNCTION EXECUTION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '6️⃣  TEST: Execute invite_client with test data';
  RAISE NOTICE '────────────────────────────────────────────────────────────────────────────';
END $$;

-- Call invite_client with dummy data to see what error we get
SELECT invite_client(
  p_email := 'test@example.com',
  p_company_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_company_name := 'Test Company',
  p_hr_user_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_full_name := 'Test User'
) as function_result;

-- ============================================================================
-- 7. CHECK TABLE GRANTS ON app_config
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '7️⃣  TABLE-LEVEL GRANTS ON app_config';
  RAISE NOTICE '────────────────────────────────────────────────────────────────────────────';
END $$;

SELECT
  grantee,
  privilege_type,
  CASE
    WHEN grantee = 'authenticated' AND privilege_type = 'SELECT' THEN '✅ Authenticated has SELECT'
    WHEN grantee = 'authenticated' THEN '⚠️  Has: ' || privilege_type
    ELSE ''
  END as status
FROM information_schema.role_table_grants
WHERE table_name = 'app_config'
  AND grantee IN ('authenticated', 'anon', 'postgres', 'service_role')
ORDER BY grantee, privilege_type;

-- ============================================================================
-- 8. CHECK pg_net EXTENSION (for HTTP requests)
-- ============================================================================
DO $$
DECLARE
  ext_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '8️⃣  CHECK: pg_net EXTENSION';
  RAISE NOTICE '────────────────────────────────────────────────────────────────────────────';

  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) INTO ext_exists;

  RAISE NOTICE 'pg_net Installed: %', CASE WHEN ext_exists THEN '✅ YES (migration 021 applied)' ELSE '❌ NO (migration 021 not applied)' END;
END $$;

SELECT
  extname as extension_name,
  extversion as version,
  '✅ Extension installed' as status
FROM pg_extension
WHERE extname = 'pg_net';

-- ============================================================================
-- 9. SUMMARY AND RECOMMENDATIONS
-- ============================================================================
DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
  config_count INTEGER;
  func_exists BOOLEAN;
  ext_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '    DIAGNOSIS SUMMARY & RECOMMENDATIONS';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Gather all status
  SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE tablename = 'app_config';
  SELECT count(*) INTO policy_count FROM pg_policies WHERE tablename = 'app_config';
  SELECT count(*) INTO config_count FROM app_config;
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'invite_client') INTO func_exists;
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') INTO ext_exists;

  -- Check each component
  IF NOT ext_exists THEN
    RAISE NOTICE '❌ CRITICAL: pg_net extension missing';
    RAISE NOTICE '   → Run migration 021: Enable HTTP extension';
  END IF;

  IF NOT func_exists THEN
    RAISE NOTICE '❌ CRITICAL: invite_client function missing';
    RAISE NOTICE '   → Run migration 024: Create invite_client function';
  END IF;

  IF config_count = 0 THEN
    RAISE NOTICE '❌ CRITICAL: app_config table is empty';
    RAISE NOTICE '   → Run migration 025: Configure API keys';
  ELSIF config_count < 5 THEN
    RAISE NOTICE '⚠️  WARNING: app_config has only % rows (expected 5)', config_count;
  ELSE
    RAISE NOTICE '✅ app_config has all 5 configuration values';
  END IF;

  IF rls_enabled THEN
    RAISE NOTICE '❌ ISSUE: RLS is still enabled on app_config';
    RAISE NOTICE '   → Run migration 028: Disable RLS on app_config';
    RAISE NOTICE '   → Or run manually: ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;';
  ELSE
    RAISE NOTICE '✅ RLS is disabled on app_config';
  END IF;

  IF policy_count > 0 THEN
    RAISE NOTICE '⚠️  WARNING: % RLS policies still exist on app_config', policy_count;
    RAISE NOTICE '   → These should be dropped when RLS is disabled';
  ELSE
    RAISE NOTICE '✅ No RLS policies on app_config';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
END $$;
