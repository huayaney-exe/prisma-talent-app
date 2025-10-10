-- Link Supabase Auth user to prisma_admins table
-- Run this AFTER creating the user in Supabase Dashboard

-- Replace 'PASTE_USER_ID_HERE' with the actual UUID from Supabase Auth Users page

UPDATE prisma_admins
SET auth_user_id = 'PASTE_USER_ID_HERE'  -- Replace with actual auth user ID
WHERE email = 'admin@getprisma.io';

-- Verify the link
SELECT
  id,
  email,
  full_name,
  auth_user_id,
  role,
  is_active,
  created_at
FROM prisma_admins
WHERE email = 'admin@getprisma.io';

-- Expected result: auth_user_id should now have a UUID value
