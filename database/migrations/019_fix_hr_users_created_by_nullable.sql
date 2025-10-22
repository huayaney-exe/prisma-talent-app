-- Migration 019: Make hr_users.created_by nullable
-- Purpose: Allow creation of first HR user for a company without circular FK constraint
-- Context: When admin creates a new client, the first HR user has no "inviter"

-- Make created_by nullable (it's a self-referencing FK to hr_users(id))
-- For the FIRST HR user of a company, there's no existing hr_user to reference
ALTER TABLE hr_users
  ALTER COLUMN created_by DROP NOT NULL;

-- Verify the change
SELECT
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'hr_users'
  AND column_name = 'created_by';

-- Add comment explaining the logic
COMMENT ON COLUMN hr_users.created_by IS
  'HR user who invited this user. NULL for first user created by Prisma admin.';
