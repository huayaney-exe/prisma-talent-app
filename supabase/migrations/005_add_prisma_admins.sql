-- ============================================================================
-- Phase 1: Add Prisma Admins Table (MVP Architecture Update)
--
-- Purpose: Add internal Prisma team admin table for managing platform
-- Key Change: Prisma admins are the central actor, not automated workflows
-- Migration Date: 2025-01-09
-- ============================================================================

-- Drop existing table if it exists (for idempotency during development)
DROP TABLE IF EXISTS prisma_admins CASCADE;

-- Prisma Admins Table - Internal Prisma Team Members
CREATE TABLE prisma_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id),

  -- Authorization
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions JSONB DEFAULT '{
    "can_enroll_clients": true,
    "can_publish_positions": true,
    "can_qualify_candidates": true,
    "can_manage_admins": false
  }'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES prisma_admins(id)
);

-- Indexes for Performance
CREATE INDEX idx_prisma_admins_email ON prisma_admins(email);
CREATE INDEX idx_prisma_admins_auth_user_id ON prisma_admins(auth_user_id);
CREATE INDEX idx_prisma_admins_is_active ON prisma_admins(is_active);

-- Updated_at Trigger
CREATE TRIGGER update_prisma_admins_updated_at
  BEFORE UPDATE ON prisma_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Documentation
COMMENT ON TABLE prisma_admins IS 'Internal Prisma team members who manage the platform';
COMMENT ON COLUMN prisma_admins.permissions IS 'JSONB permissions object for flexible role management';
COMMENT ON COLUMN prisma_admins.role IS 'admin = standard permissions, super_admin = can manage other admins';

-- Update existing tables to reference prisma_admins
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS enrolled_by UUID REFERENCES prisma_admins(id),
  ALTER COLUMN created_by TYPE UUID USING created_by::uuid,
  ADD CONSTRAINT fk_companies_created_by FOREIGN KEY (created_by) REFERENCES prisma_admins(id);

-- Update job_descriptions to support manual JD creation by Prisma admin
ALTER TABLE job_descriptions
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES prisma_admins(id),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  ADD COLUMN IF NOT EXISTS draft_content TEXT;

-- Add lead_source column to companies if it doesn't exist
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'landing_page'
    CHECK (lead_source IN ('landing_page', 'referral', 'outbound', 'event', 'other')),
  ADD COLUMN IF NOT EXISTS lead_submitted_at TIMESTAMP;

-- Update companies subscription_status to include 'lead' state
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_subscription_status_check;
ALTER TABLE companies
  ADD CONSTRAINT companies_subscription_status_check
  CHECK (subscription_status IN ('lead', 'trial', 'active', 'suspended', 'cancelled'));

-- Seed Initial Super Admin (CHANGE EMAIL BEFORE PRODUCTION)
INSERT INTO prisma_admins (email, full_name, role, permissions, is_active)
VALUES (
  'admin@getprisma.io',
  'Prisma Admin',
  'super_admin',
  '{
    "can_enroll_clients": true,
    "can_publish_positions": true,
    "can_qualify_candidates": true,
    "can_manage_admins": true
  }'::jsonb,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Success Message
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1 Migration Complete: prisma_admins table created';
  RAISE NOTICE '📧 Default admin created: admin@getprisma.io (CHANGE IN PRODUCTION)';
  RAISE NOTICE '🔐 Next: Run RLS policies migration (006_rls_policies_update.sql)';
END $$;
