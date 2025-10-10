-- ============================================================================
-- Phase 1 Database Test Script
--
-- Purpose: Comprehensive testing of Phase 1 database setup
-- Run this after completing migrations 005, 006, 007
-- Expected: All tests should pass with ✅ messages
-- ============================================================================

-- Enable verbose output
\set ON_ERROR_STOP on
\set VERBOSITY verbose

BEGIN;

-- Test execution timestamp
SELECT '🧪 Starting Phase 1 Database Tests at ' || NOW() || '...' AS test_status;
SELECT '' AS separator;

-- ============================================================================
-- TEST 1: Table Existence
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'prisma_admins',
    'companies',
    'hr_users',
    'positions',
    'job_descriptions',
    'applicants',
    'application_activities',
    'email_communications'
  );

  IF table_count = 8 THEN
    RAISE NOTICE '✅ TEST 1: All 8 core tables exist';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: Expected 8 tables, found %', table_count;
  END IF;
END $$;

-- ============================================================================
-- TEST 2: Prisma Admins Table Structure
-- ============================================================================

DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'prisma_admins'
  AND column_name IN ('id', 'email', 'full_name', 'auth_user_id', 'role', 'permissions', 'is_active');

  IF column_count >= 7 THEN
    RAISE NOTICE '✅ TEST 2: prisma_admins table has required columns';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 FAILED: prisma_admins missing columns (found %, expected >= 7)', column_count;
  END IF;
END $$;

-- ============================================================================
-- TEST 3: Default Admin Exists
-- ============================================================================

DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM prisma_admins
  WHERE is_active = TRUE;

  IF admin_count >= 1 THEN
    RAISE NOTICE '✅ TEST 3: Default admin exists (% active admins)', admin_count;
  ELSE
    RAISE EXCEPTION '❌ TEST 3 FAILED: No active admins found';
  END IF;
END $$;

-- ============================================================================
-- TEST 4: RLS Enabled on All Tables
-- ============================================================================

DO $$
DECLARE
  rls_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_table_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = TRUE
  AND tablename IN (
    'prisma_admins',
    'companies',
    'hr_users',
    'positions',
    'job_descriptions',
    'applicants',
    'application_activities',
    'email_communications'
  );

  IF rls_table_count = 8 THEN
    RAISE NOTICE '✅ TEST 4: RLS enabled on all 8 tables';
  ELSE
    RAISE EXCEPTION '❌ TEST 4 FAILED: RLS not enabled on all tables (% of 8)', rls_table_count;
  END IF;
END $$;

-- ============================================================================
-- TEST 5: RLS Policies Exist
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  IF policy_count >= 20 THEN
    RAISE NOTICE '✅ TEST 5: RLS policies configured (% policies)', policy_count;
  ELSE
    RAISE EXCEPTION '❌ TEST 5 FAILED: Insufficient policies (found %, expected >= 20)', policy_count;
  END IF;
END $$;

-- ============================================================================
-- TEST 6: Triggers Exist
-- ============================================================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname LIKE 'trigger_%'
  AND tgrelid IN (
    'positions'::regclass,
    'applicants'::regclass,
    'job_descriptions'::regclass,
    'hr_users'::regclass
  );

  IF trigger_count >= 7 THEN
    RAISE NOTICE '✅ TEST 6: Database triggers configured (% triggers)', trigger_count;
  ELSE
    RAISE EXCEPTION '❌ TEST 6 FAILED: Missing triggers (found %, expected >= 7)', trigger_count;
  END IF;
END $$;

-- ============================================================================
-- TEST 7: Indexes Exist
-- ============================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

  IF index_count >= 10 THEN
    RAISE NOTICE '✅ TEST 7: Performance indexes created (% indexes)', index_count;
  ELSE
    RAISE WARNING '⚠️ TEST 7 WARNING: Limited indexes (found %, recommended >= 10)', index_count;
  END IF;
END $$;

-- ============================================================================
-- TEST 8: Foreign Key Constraints
-- ============================================================================

DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

  IF fk_count >= 15 THEN
    RAISE NOTICE '✅ TEST 8: Foreign key relationships configured (% constraints)', fk_count;
  ELSE
    RAISE EXCEPTION '❌ TEST 8 FAILED: Insufficient foreign keys (found %, expected >= 15)', fk_count;
  END IF;
END $$;

-- ============================================================================
-- TEST 9: Insert Test Data (Lead Company)
-- ============================================================================

DO $$
DECLARE
  test_company_id UUID;
BEGIN
  -- Simulate public lead form submission
  INSERT INTO companies (
    company_name,
    company_domain,
    primary_contact_name,
    primary_contact_email,
    primary_contact_phone,
    subscription_status,
    lead_source
  ) VALUES (
    'Test Company Phase1',
    'test-phase1-' || floor(random() * 1000000) || '.com',
    'Test Contact',
    'test-' || floor(random() * 1000000) || '@test.com',
    '+51999999999',
    'lead',
    'landing_page'
  ) RETURNING id INTO test_company_id;

  IF test_company_id IS NOT NULL THEN
    RAISE NOTICE '✅ TEST 9: Lead company insert successful (ID: %)', test_company_id;
  ELSE
    RAISE EXCEPTION '❌ TEST 9 FAILED: Could not insert test company';
  END IF;
END $$;

-- ============================================================================
-- TEST 10: Workflow Trigger Test
-- ============================================================================

DO $$
DECLARE
  test_position_id UUID;
  test_company_id UUID;
  test_hr_user_id UUID;
  email_count INTEGER;
BEGIN
  -- Get or create test company
  INSERT INTO companies (
    company_name,
    company_domain,
    primary_contact_name,
    primary_contact_email,
    subscription_status
  ) VALUES (
    'Trigger Test Company',
    'trigger-test-' || floor(random() * 1000000) || '.com',
    'Trigger Test',
    'trigger-' || floor(random() * 1000000) || '@test.com',
    'trial'
  ) RETURNING id INTO test_company_id;

  -- Create test HR user
  INSERT INTO hr_users (
    company_id,
    email,
    full_name,
    role,
    is_active
  ) VALUES (
    test_company_id,
    'hr-' || floor(random() * 1000000) || '@test.com',
    'Test HR User',
    'hr_user',
    TRUE
  ) RETURNING id INTO test_hr_user_id;

  -- Create test position
  INSERT INTO positions (
    company_id,
    position_name,
    area,
    seniority,
    leader_name,
    leader_position,
    leader_email,
    salary_range,
    contract_type,
    timeline,
    position_type,
    workflow_stage,
    created_by
  ) VALUES (
    test_company_id,
    'Test Product Manager',
    'Product Management',
    'Senior 5-8 años',
    'Test Leader',
    'VP Product',
    'leader-' || floor(random() * 1000000) || '@test.com',
    '$80k-$120k',
    'Tiempo completo',
    CURRENT_DATE + INTERVAL '30 days',
    'Nueva posición',
    'hr_draft',
    test_hr_user_id
  ) RETURNING id INTO test_position_id;

  -- Trigger workflow update (should create email notification)
  UPDATE positions
  SET workflow_stage = 'hr_completed'
  WHERE id = test_position_id;

  -- Check if notification email was created
  SELECT COUNT(*) INTO email_count
  FROM email_communications
  WHERE position_id = test_position_id
  AND email_type = 'leader_form_request';

  IF email_count = 1 THEN
    RAISE NOTICE '✅ TEST 10: Workflow trigger executed successfully';
  ELSE
    RAISE EXCEPTION '❌ TEST 10 FAILED: Trigger did not create notification email (found % emails)', email_count;
  END IF;
END $$;

-- ============================================================================
-- Test Summary
-- ============================================================================

SELECT '' AS separator;
SELECT '═══════════════════════════════════════════════════════════' AS summary;
SELECT '✅ PHASE 1 DATABASE TESTS COMPLETED SUCCESSFULLY' AS result;
SELECT '═══════════════════════════════════════════════════════════' AS summary;
SELECT '' AS separator;

SELECT '📊 Database Statistics:' AS info;
SELECT COUNT(*) || ' companies' AS stat FROM companies;
SELECT COUNT(*) || ' hr_users' AS stat FROM hr_users;
SELECT COUNT(*) || ' positions' AS stat FROM positions;
SELECT COUNT(*) || ' prisma_admins' AS stat FROM prisma_admins;
SELECT COUNT(*) || ' email_communications' AS stat FROM email_communications;

SELECT '' AS separator;
SELECT '🎯 Next Steps:' AS next_steps;
SELECT '   1. Review test output above' AS step;
SELECT '   2. Clean up test data (see cleanup section below)' AS step;
SELECT '   3. Update Phase 1 completion checklist' AS step;
SELECT '   4. Proceed to Phase 2: Backend API implementation' AS step;

-- ============================================================================
-- Cleanup Test Data (Optional)
-- ============================================================================

SELECT '' AS separator;
SELECT '🧹 Cleaning up test data...' AS cleanup;

DELETE FROM email_communications WHERE recipient_email LIKE '%@test.com';
DELETE FROM positions WHERE company_id IN (
  SELECT id FROM companies WHERE company_domain LIKE '%test%'
);
DELETE FROM hr_users WHERE company_id IN (
  SELECT id FROM companies WHERE company_domain LIKE '%test%'
);
DELETE FROM companies WHERE company_domain LIKE '%test%';

SELECT '✅ Test data cleaned up' AS cleanup_result;

COMMIT;

SELECT '' AS separator;
SELECT '🎉 Phase 1 Database Setup Complete and Tested!' AS final_message;
SELECT '' AS separator;
