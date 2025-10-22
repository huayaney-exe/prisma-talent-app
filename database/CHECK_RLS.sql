-- Check RLS status on app_config
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '❌ RLS IS ENABLED (BAD)'
    ELSE '✅ RLS IS DISABLED (GOOD)'
  END as status
FROM pg_tables
WHERE tablename = 'app_config';

-- Check if any policies still exist
SELECT
  count(*) as policy_count,
  CASE
    WHEN count(*) > 0 THEN '❌ POLICIES EXIST (should be 0)'
    ELSE '✅ NO POLICIES (correct)'
  END as status
FROM pg_policies
WHERE tablename = 'app_config';

-- List any existing policies
SELECT
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'app_config';
