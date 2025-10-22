-- Migration: Add primary_contact_auth_id to companies table
-- Date: 2025-10-10
-- Purpose: Link Supabase auth user ID to company for client login tracking

-- Add auth ID column to companies table
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS primary_contact_auth_id UUID;

-- Add comment
COMMENT ON COLUMN companies.primary_contact_auth_id IS
  'Supabase Auth user ID for the primary contact.
   Used to link the company to the Supabase auth system for client login.';

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ Added primary_contact_auth_id column to companies table';
  RAISE NOTICE '🔗 Companies can now be linked to Supabase auth users';
END $$;
