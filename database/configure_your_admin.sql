-- Configure Luis Huayaney as Admin User
-- This updates the default admin record to use your email and auth ID

-- Step 1: Update the default admin record with your information
UPDATE prisma_admins
SET
  email = 'huayaney.exe@gmail.com',
  full_name = 'Luis Eduardo Huayaney',
  auth_user_id = 'e23845aa-e678-42b5-96f7-86bc3b3e80a7',
  role = 'super_admin',
  is_active = true,
  updated_at = NOW()
WHERE email = 'admin@getprisma.io';

-- Step 2: Verify the admin record
SELECT
  id,
  email,
  full_name,
  auth_user_id,
  role,
  permissions,
  is_active,
  created_at,
  updated_at
FROM prisma_admins
WHERE email = 'huayaney.exe@gmail.com';

-- Expected result:
-- email: huayaney.exe@gmail.com
-- full_name: Luis Eduardo Huayaney
-- auth_user_id: e23845aa-e678-42b5-96f7-86bc3b3e80a7
-- role: super_admin
-- is_active: true
-- permissions: {
--   "can_enroll_clients": true,
--   "can_publish_positions": true,
--   "can_qualify_candidates": true,
--   "can_manage_admins": true
-- }

-- Step 3: Verify you can query leads (testing admin permissions)
SELECT COUNT(*) as total_leads FROM leads;

-- Step 4: Check your auth user exists in Supabase Auth
-- (This is informational - you can only query this with proper permissions)
-- SELECT id, email, email_confirmed_at, created_at
-- FROM auth.users
-- WHERE id = 'e23845aa-e678-42b5-96f7-86bc3b3e80a7';
