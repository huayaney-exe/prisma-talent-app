-- Prisma Talent ATS - Database Implementation Verification
-- Run this in your Supabase SQL Editor to verify your implementation
-- Project: prisma-talent (vhjjibfblrkyfzcukqwa)

-- =============================================================================
-- 1. CHECK TABLES EXISTENCE
-- =============================================================================

SELECT 'TABLE EXISTENCE CHECK' as check_type,
       'Checking if all required tables exist' as description;

SELECT
  table_name,
  CASE
    WHEN table_name IN (
      'companies', 'hr_users', 'positions', 'job_descriptions',
      'applicants', 'application_activities', 'email_communications'
    ) THEN '✅ Required table'
    ELSE '❓ Additional table'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================================================
-- 2. CHECK TABLE STRUCTURES
-- =============================================================================

SELECT 'TABLE STRUCTURE CHECK' as check_type,
       'Verifying table columns and types' as description;

-- Check companies table structure
SELECT
  'companies' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'companies'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check hr_users table structure
SELECT
  'hr_users' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'hr_users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check positions table structure
SELECT
  'positions' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'positions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- 3. CHECK FOREIGN KEY RELATIONSHIPS
-- =============================================================================

SELECT 'FOREIGN KEY CHECK' as check_type,
       'Verifying table relationships' as description;

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =============================================================================
-- 4. CHECK ROW LEVEL SECURITY (RLS)
-- =============================================================================

SELECT 'RLS SECURITY CHECK' as check_type,
       'Verifying Row Level Security policies' as description;

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'companies', 'hr_users', 'positions', 'job_descriptions',
    'applicants', 'application_activities', 'email_communications'
  )
ORDER BY tablename;

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- 5. CHECK INDEXES
-- =============================================================================

SELECT 'INDEX CHECK' as check_type,
       'Verifying performance indexes' as description;

SELECT
  t.relname as table_name,
  i.relname as index_name,
  array_to_string(array_agg(a.attname), ', ') as column_names
FROM pg_class t,
     pg_class i,
     pg_index ix,
     pg_attribute a
WHERE t.oid = ix.indrelid
  AND i.oid = ix.indexrelid
  AND a.attrelid = t.oid
  AND a.attnum = ANY(ix.indkey)
  AND t.relkind = 'r'
  AND t.relname IN (
    'companies', 'hr_users', 'positions', 'job_descriptions',
    'applicants', 'application_activities', 'email_communications'
  )
GROUP BY t.relname, i.relname
ORDER BY t.relname, i.relname;

-- =============================================================================
-- 6. CHECK SAMPLE DATA
-- =============================================================================

SELECT 'DATA CHECK' as check_type,
       'Verifying sample data existence' as description;

-- Count records in each table
SELECT 'companies' as table_name, COUNT(*) as record_count
FROM companies
UNION ALL
SELECT 'hr_users' as table_name, COUNT(*) as record_count
FROM hr_users
UNION ALL
SELECT 'positions' as table_name, COUNT(*) as record_count
FROM positions
UNION ALL
SELECT 'job_descriptions' as table_name, COUNT(*) as record_count
FROM job_descriptions
UNION ALL
SELECT 'applicants' as table_name, COUNT(*) as record_count
FROM applicants
UNION ALL
SELECT 'application_activities' as table_name, COUNT(*) as record_count
FROM application_activities
UNION ALL
SELECT 'email_communications' as table_name, COUNT(*) as record_count
FROM email_communications
ORDER BY table_name;

-- =============================================================================
-- 7. CHECK WORKFLOW FUNCTIONALITY
-- =============================================================================

SELECT 'WORKFLOW CHECK' as check_type,
       'Verifying position workflow stages' as description;

-- Check position workflow stages
SELECT
  workflow_stage,
  COUNT(*) as position_count
FROM positions
GROUP BY workflow_stage
ORDER BY workflow_stage;

-- Check position codes format
SELECT
  position_code,
  position_name,
  workflow_stage
FROM positions
ORDER BY created_at DESC
LIMIT 5;

-- =============================================================================
-- 8. CHECK MULTI-TENANT ISOLATION
-- =============================================================================

SELECT 'MULTI-TENANT CHECK' as check_type,
       'Verifying tenant isolation by company' as description;

-- Check data distribution by company
SELECT
  c.company_name,
  COUNT(DISTINCT hu.id) as hr_users,
  COUNT(DISTINCT p.id) as positions,
  COUNT(DISTINCT a.id) as applicants
FROM companies c
LEFT JOIN hr_users hu ON c.id = hu.company_id
LEFT JOIN positions p ON c.id = p.company_id
LEFT JOIN applicants a ON c.id = a.company_id
GROUP BY c.id, c.company_name
ORDER BY c.company_name;

-- =============================================================================
-- 9. CHECK REQUIRED FUNCTIONS AND TRIGGERS
-- =============================================================================

SELECT 'FUNCTIONS CHECK' as check_type,
       'Verifying helper functions and triggers' as description;

-- Check if helper functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_updated_at_column',
    'get_current_user_company_id',
    'user_has_permission',
    'user_has_role'
  )
ORDER BY routine_name;

-- Check if triggers exist
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'companies', 'hr_users', 'positions', 'job_descriptions',
    'applicants', 'application_activities', 'email_communications'
  )
ORDER BY event_object_table, trigger_name;

-- =============================================================================
-- 10. IMPLEMENTATION COMPLETENESS SUMMARY
-- =============================================================================

SELECT 'IMPLEMENTATION SUMMARY' as check_type,
       'Overall implementation status' as description;

-- Create a comprehensive summary
WITH table_check AS (
  SELECT COUNT(*) as existing_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'companies', 'hr_users', 'positions', 'job_descriptions',
      'applicants', 'application_activities', 'email_communications'
    )
),
rls_check AS (
  SELECT COUNT(*) as rls_enabled_tables
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'companies', 'hr_users', 'positions', 'job_descriptions',
      'applicants', 'application_activities', 'email_communications'
    )
    AND rowsecurity = true
),
data_check AS (
  SELECT
    CASE WHEN EXISTS (SELECT 1 FROM companies) THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM hr_users) THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM positions) THEN 1 ELSE 0 END as tables_with_data
)
SELECT
  t.existing_tables || '/7 tables created' as tables_status,
  r.rls_enabled_tables || '/7 tables with RLS' as security_status,
  d.tables_with_data || '/3 core tables with data' as data_status,
  CASE
    WHEN t.existing_tables = 7 AND r.rls_enabled_tables = 7 AND d.tables_with_data >= 2
    THEN '✅ Implementation appears complete'
    WHEN t.existing_tables >= 5
    THEN '⚠️ Implementation partially complete'
    ELSE '❌ Implementation incomplete'
  END as overall_status
FROM table_check t, rls_check r, data_check d;

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*
WHAT TO DO NEXT:

1. 📋 Run this entire script in your Supabase SQL Editor
2. 📊 Review each section's output
3. ✅ Check which components are implemented correctly
4. ⚠️ Identify any missing or incomplete components
5. 📝 Share the results so I can provide specific recommendations

KEY THINGS TO LOOK FOR:
- All 7 tables should exist
- RLS should be enabled on all tables
- Foreign key relationships should be properly set up
- At least basic sample data should be present
- Position codes should follow POS_XXXXXX format
- Multi-tenant isolation should be working

EXPECTED RESULTS:
- 7/7 tables created
- 7/7 tables with RLS enabled
- Multiple companies with isolated data
- Positions with workflow stages
- Proper foreign key relationships

If any section shows errors or unexpected results, that indicates
what still needs to be implemented or fixed.
*/