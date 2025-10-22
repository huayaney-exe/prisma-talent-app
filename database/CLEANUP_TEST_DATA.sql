-- Cleanup Test Data - Remove Last 5 Companies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/editor

-- ============================================================================
-- PREVIEW: View last 10 companies before deletion
-- ============================================================================

-- Uncomment to preview what will be deleted:
-- SELECT
--   id,
--   company_name,
--   company_domain,
--   primary_contact_email,
--   created_at,
--   'WILL BE DELETED' as status
-- FROM companies
-- ORDER BY created_at DESC
-- LIMIT 5;

-- ============================================================================
-- STEP 1: Get IDs of last 5 companies
-- ============================================================================

WITH last_5_companies AS (
  SELECT id
  FROM companies
  ORDER BY created_at DESC
  LIMIT 5
)

-- ============================================================================
-- STEP 2: Delete related data (CASCADE will handle most, but explicit is safer)
-- ============================================================================

-- Delete email communications for these companies
, deleted_emails AS (
  DELETE FROM email_communications
  WHERE company_id IN (SELECT id FROM last_5_companies)
  RETURNING id
)

-- Delete positions for these companies (will cascade to applicants)
, deleted_positions AS (
  DELETE FROM positions
  WHERE company_id IN (SELECT id FROM last_5_companies)
  RETURNING id
)

-- Delete HR users for these companies
, deleted_hr_users AS (
  DELETE FROM hr_users
  WHERE company_id IN (SELECT id FROM last_5_companies)
  RETURNING id
)

-- ============================================================================
-- STEP 3: Delete companies
-- ============================================================================

, deleted_companies AS (
  DELETE FROM companies
  WHERE id IN (SELECT id FROM last_5_companies)
  RETURNING id, company_name, company_domain
)

-- ============================================================================
-- STEP 4: Show summary
-- ============================================================================

SELECT
  (SELECT COUNT(*) FROM deleted_companies) as companies_deleted,
  (SELECT COUNT(*) FROM deleted_hr_users) as hr_users_deleted,
  (SELECT COUNT(*) FROM deleted_positions) as positions_deleted,
  (SELECT COUNT(*) FROM deleted_emails) as emails_deleted;

-- ============================================================================
-- VERIFY: Check remaining companies
-- ============================================================================

-- After running, verify with:
-- SELECT
--   company_name,
--   company_domain,
--   created_at
-- FROM companies
-- ORDER BY created_at DESC
-- LIMIT 10;

-- ============================================================================
-- ALTERNATIVE: Delete specific company by name or domain
-- ============================================================================

-- Uncomment and modify to delete specific company:
-- DELETE FROM companies WHERE company_name = 'Test Company';
-- DELETE FROM companies WHERE company_domain = 'intercorpperu.com';

-- ============================================================================
-- ALTERNATIVE: Delete ALL test companies (DANGEROUS!)
-- ============================================================================

-- Uncomment to delete ALL companies with 'test' in the name:
-- DELETE FROM companies WHERE LOWER(company_name) LIKE '%test%';

-- ============================================================================
-- CLEANUP AUTH USERS (Optional - if magic links were sent)
-- ============================================================================

-- Note: Auth users are in auth.users table (separate from companies)
-- Supabase Dashboard → Authentication → Users → manually delete if needed
-- Or contact Supabase support for bulk auth user cleanup

-- ============================================================================
-- ROLLBACK NOTE
-- ============================================================================

-- This script uses CASCADE delete via foreign keys
-- If you need to rollback, you'll need to restore from database backup
-- Recommendation: Test on a single company first before bulk deletion

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

-- 1. Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/editor
-- 2. Click: "New Query"
-- 3. Paste this script
-- 4. Uncomment the preview section first to see what will be deleted
-- 5. Run preview query
-- 6. If okay, comment out preview and run full deletion
-- 7. Check verification query at the end

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

-- companies_deleted | hr_users_deleted | positions_deleted | emails_deleted
-- -----------------+------------------+-------------------+---------------
--                5 |                5 |                 0 |              5

