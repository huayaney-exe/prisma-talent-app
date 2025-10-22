-- Check current RLS policies on companies and hr_users tables

-- List all policies on companies table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('companies', 'hr_users', 'prisma_admins')
ORDER BY tablename, policyname;

-- Check if prisma_admins table exists and has data
SELECT
  'prisma_admins table check' as check_type,
  COUNT(*) as admin_count
FROM prisma_admins
WHERE is_active = true;

-- Check your admin user specifically
SELECT
  pa.id,
  pa.auth_user_id,
  pa.role,
  pa.is_active,
  au.email
FROM prisma_admins pa
LEFT JOIN auth.users au ON au.id = pa.auth_user_id
WHERE au.email = 'huayaney.exe@gmail.com'
   OR pa.auth_user_id = 'e23845aa-e678-42b5-96f7-86bc3b3e80a7';
