-- Quick Cleanup: Delete Last 5 Companies
-- Copy and paste directly into Supabase SQL Editor

-- STEP 1: Preview what will be deleted (RUN THIS FIRST!)
SELECT
  id,
  company_name,
  company_domain,
  primary_contact_email,
  created_at
FROM companies
ORDER BY created_at DESC
LIMIT 5;

-- STEP 2: If the above looks correct, run this to delete:
-- (Uncomment the lines below)

/*
WITH companies_to_delete AS (
  SELECT id FROM companies ORDER BY created_at DESC LIMIT 5
)
DELETE FROM companies WHERE id IN (SELECT id FROM companies_to_delete);
*/

-- STEP 3: Verify deletion
-- SELECT COUNT(*) as remaining_companies FROM companies;
