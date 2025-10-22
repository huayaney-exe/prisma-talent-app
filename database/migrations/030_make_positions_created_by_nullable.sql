-- Migration 030: Make positions.created_by nullable for public HR form submissions
-- Date: 2025-10-22
-- Purpose: Allow public (non-authenticated) users to submit HR forms
--          while maintaining audit trail for authenticated client users

-- Make created_by nullable
ALTER TABLE positions
  ALTER COLUMN created_by DROP NOT NULL;

-- Update constraint to handle NULL gracefully
ALTER TABLE positions
  DROP CONSTRAINT IF EXISTS positions_created_by_fkey,
  ADD CONSTRAINT positions_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES hr_users(id)
    ON DELETE SET NULL;

-- Add helpful comment
COMMENT ON COLUMN positions.created_by IS
  'HR user who created this position. NULL for public form submissions (before client auth is set up). Will be populated for authenticated client users creating positions from their dashboard.';

-- Verify change
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'positions' AND column_name = 'created_by';
