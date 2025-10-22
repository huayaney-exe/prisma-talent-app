-- Make created_by nullable in companies table
-- This allows client creation even if admin is not in prisma_admins table

ALTER TABLE companies
  ALTER COLUMN created_by DROP NOT NULL;

-- Verify
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'companies' AND column_name = 'created_by';
