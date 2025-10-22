-- Migration 018: Add Luis Huayaney as Prisma Admin
-- Purpose: Ensure primary admin user is properly registered in prisma_admins table
-- This is required for foreign key constraint on companies.created_by

-- Add Luis as Prisma admin (safe upsert)
INSERT INTO prisma_admins (
  auth_user_id,
  email,
  full_name,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'e23845aa-e678-42b5-96f7-86bc3b3e80a7',
  'huayaney.exe@gmail.com',
  'Luis Huayaney',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (auth_user_id)
DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- Verify admin was added
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM prisma_admins
  WHERE auth_user_id = 'e23845aa-e678-42b5-96f7-86bc3b3e80a7';

  IF admin_count = 0 THEN
    RAISE EXCEPTION 'Failed to add admin user to prisma_admins table';
  END IF;

  RAISE NOTICE '✅ Admin user verified in prisma_admins table';
END $$;

-- Show all active admins
SELECT
  auth_user_id,
  email,
  full_name,
  is_active,
  created_at
FROM prisma_admins
WHERE is_active = true
ORDER BY created_at;
