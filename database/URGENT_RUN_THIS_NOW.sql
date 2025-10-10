-- URGENT: Configure Admin Access for Luis Huayaney
-- Run this IMMEDIATELY in Supabase SQL Editor to fix "Access Denied" issue

-- Step 1: Configure your user as admin
UPDATE prisma_admins
SET
  email = 'huayaney.exe@gmail.com',
  full_name = 'Luis Eduardo Huayaney',
  auth_user_id = 'e23845aa-e678-42b5-96f7-86bc3b3e80a7',
  role = 'super_admin',
  is_active = true,
  updated_at = NOW()
WHERE email = 'admin@getprisma.io';

-- Step 2: Verify the admin record exists
SELECT
  id,
  email,
  full_name,
  auth_user_id,
  role,
  is_active
FROM prisma_admins
WHERE email = 'huayaney.exe@gmail.com';

-- Step 3: Check if RLS policies are working
-- This should return TRUE if you're recognized as admin
SELECT EXISTS (
  SELECT 1 FROM prisma_admins
  WHERE auth_user_id = 'e23845aa-e678-42b5-96f7-86bc3b3e80a7'
  AND is_active = TRUE
) as is_admin;

-- Step 4: Test access to leads table (should work after Step 1)
SELECT COUNT(*) as total_leads FROM leads;

-- Expected Results:
-- After Step 1: "UPDATE 1" (1 row updated)
-- After Step 2: Should show your admin record
-- After Step 3: Should show "is_admin: true"
-- After Step 4: Should show lead count (even if 0)

-- If Step 4 still fails with permission error, run this:
-- DROP POLICY IF EXISTS "leads_select_authenticated" ON leads;
-- CREATE POLICY "leads_select_authenticated" ON leads
--   FOR SELECT TO authenticated USING (true);
