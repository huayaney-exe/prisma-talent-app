-- Verify admin record is properly linked to auth user
SELECT 
  pa.id as admin_id,
  pa.email as admin_email,
  pa.full_name,
  pa.auth_user_id,
  pa.role,
  pa.is_active,
  pa.created_at,
  au.email as auth_email,
  au.created_at as auth_created
FROM prisma_admins pa
LEFT JOIN auth.users au ON pa.auth_user_id = au.id
WHERE pa.email = 'huayaney.exe@gmail.com'
   OR pa.auth_user_id = 'e23845aa-e678-42b5-96f7-86bc3b3e80a7';

-- Also check if the RLS policy allows reading
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'prisma_admins'
ORDER BY policyname;
