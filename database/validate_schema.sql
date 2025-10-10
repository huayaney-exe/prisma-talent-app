-- ============================================================================
-- COMPREHENSIVE DATABASE SCHEMA VALIDATION
-- Prisma Talent Platform - Production Database Audit
-- ============================================================================

-- ============================================================================
-- 1. VERIFY ALL TABLES EXIST
-- ============================================================================

SELECT
    'TABLE EXISTENCE CHECK' as check_type,
    tablename as object_name,
    CASE
        WHEN tablename IN ('companies', 'hr_users', 'positions', 'job_descriptions',
                          'applicants', 'application_activities', 'email_communications', 'leads')
        THEN '✅ EXPECTED'
        ELSE '⚠️ UNEXPECTED'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. VERIFY COMPANIES TABLE STRUCTURE
-- ============================================================================

SELECT
    'COMPANIES TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- Expected columns:
-- id, company_name, company_domain, industry, company_size,
-- website_url, linkedin_url, company_description,
-- subscription_status, subscription_plan, trial_end_date,
-- primary_contact_name, primary_contact_email, primary_contact_phone,
-- onboarding_completed, onboarding_completed_at,
-- created_at, updated_at, created_by

-- ============================================================================
-- 3. VERIFY HR_USERS TABLE STRUCTURE
-- ============================================================================

SELECT
    'HR_USERS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'hr_users'
ORDER BY ordinal_position;

-- Expected columns:
-- id, company_id, email, full_name, position_title, phone,
-- role, is_active, last_login_at,
-- can_create_positions, can_manage_team, can_view_analytics,
-- created_at, updated_at, created_by, invitation_accepted_at

-- ============================================================================
-- 4. VERIFY POSITIONS TABLE STRUCTURE (CRITICAL)
-- ============================================================================

SELECT
    'POSITIONS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'positions'
ORDER BY ordinal_position;

-- Expected columns (from migrations):
-- id, company_id, position_code, workflow_stage,
-- position_name, area, seniority,
-- leader_name, leader_position, leader_email,
-- salary_range, equity_included, equity_details,
-- contract_type, timeline, position_type, critical_notes,
-- work_arrangement, core_hours, meeting_culture, team_size,
-- autonomy_level, mentoring_required, hands_on_vs_strategic, success_kpi,
-- area_specific_data (JSONB),
-- hr_completed_at, leader_notified_at, leader_completed_at,
-- job_description (added in 010), applicant_count, business_area, seniority_level,
-- created_at, updated_at, created_by

-- ============================================================================
-- 5. VERIFY JOB_DESCRIPTIONS TABLE STRUCTURE
-- ============================================================================

SELECT
    'JOB_DESCRIPTIONS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'job_descriptions'
ORDER BY ordinal_position;

-- Expected columns:
-- id, company_id, position_id,
-- generated_content, generation_prompt, generation_model,
-- hr_approved, leader_approved, hr_feedback, leader_feedback,
-- hr_approved_at, leader_approved_at,
-- version_number, is_current_version, final_approved_at, published_at,
-- created_at, updated_at, created_by

-- ============================================================================
-- 6. VERIFY APPLICANTS TABLE STRUCTURE
-- ============================================================================

SELECT
    'APPLICANTS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'applicants'
ORDER BY ordinal_position;

-- Expected columns:
-- id, company_id, position_id,
-- full_name, email, phone, linkedin_url, portfolio_url, location,
-- cover_letter, resume_url, portfolio_files (JSONB),
-- source_type, referrer_info (JSONB),
-- application_status,
-- hr_score, technical_score, overall_score,
-- hr_notes, technical_notes, rejection_reason,
-- applied_at, updated_at, created_by, reviewed_at,
-- qualification_status, score, evaluation_notes, cv_url, submitted_at (from 010)

-- ============================================================================
-- 7. VERIFY LEADS TABLE STRUCTURE (CRITICAL FOR MVP)
-- ============================================================================

SELECT
    'LEADS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Expected columns (from 010 + 012 expansion):
-- id, contact_name, contact_email, contact_phone, contact_position,
-- company_name, industry, company_size,
-- intent, role_title, role_type, seniority, work_mode, urgency,
-- status, created_at, updated_at

-- ============================================================================
-- 8. VERIFY CHECK CONSTRAINTS
-- ============================================================================

SELECT
    'CHECK CONSTRAINTS' as check_type,
    conname as constraint_name,
    conrelid::regclass as table_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE contype = 'c'
  AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;

-- Expected constraints:
-- - company_size CHECK (IN ('1-10', '11-50', '51-200', '201-1000', '1000+'))
-- - subscription_status CHECK (IN ('trial', 'active', 'suspended', 'cancelled'))
-- - workflow_stage CHECK (multiple values)
-- - area CHECK (IN ('Product Management', 'Engineering-Tech', 'Growth', 'Design'))
-- - intent CHECK (IN ('hiring', 'conversation'))
-- - work_mode CHECK (IN ('remote', 'hybrid', 'onsite'))
-- - etc.

-- ============================================================================
-- 9. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT
    'FOREIGN KEY CONSTRAINTS' as check_type,
    tc.constraint_name,
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
ORDER BY tc.table_name, tc.constraint_name;

-- Expected foreign keys:
-- hr_users.company_id → companies.id
-- positions.company_id → companies.id
-- positions.created_by → hr_users.id
-- job_descriptions.company_id → companies.id
-- job_descriptions.position_id → positions.id
-- applicants.company_id → companies.id
-- applicants.position_id → positions.id
-- etc.

-- ============================================================================
-- 10. VERIFY INDEXES
-- ============================================================================

SELECT
    'INDEXES' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected indexes (from 003_indexes.sql):
-- - idx_companies_domain
-- - idx_hr_users_company_id
-- - idx_hr_users_email
-- - idx_positions_company_id
-- - idx_positions_code
-- - idx_positions_workflow_stage
-- - idx_applicants_position_id
-- - idx_applicants_email
-- - idx_applicants_status
-- - idx_leads_email, idx_leads_status, idx_leads_intent (from 012)
-- - etc.

-- ============================================================================
-- 11. VERIFY ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

SELECT
    'RLS POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected policies (from 002, 006, 011):
-- - Public can insert to leads
-- - Authenticated users can access admin tables
-- - Company isolation policies
-- - etc.

-- ============================================================================
-- 12. VERIFY RLS IS ENABLED ON TABLES
-- ============================================================================

SELECT
    'RLS ENABLED STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: RLS should be enabled on all tables

-- ============================================================================
-- 13. VERIFY TRIGGERS
-- ============================================================================

SELECT
    'TRIGGERS' as check_type,
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected triggers (from 007_triggers.sql + 010):
-- - update_companies_updated_at
-- - update_hr_users_updated_at
-- - update_positions_updated_at
-- - update_job_descriptions_updated_at
-- - update_applicants_updated_at
-- - update_leads_updated_at
-- - etc.

-- ============================================================================
-- 14. VERIFY FUNCTIONS EXIST
-- ============================================================================

SELECT
    'FUNCTIONS' as check_type,
    routine_name as function_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Expected functions:
-- - update_updated_at_column()
-- - Any other custom functions

-- ============================================================================
-- 15. VERIFY VIEWS
-- ============================================================================

SELECT
    'VIEWS' as check_type,
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected views (from 010):
-- - positions_with_counts

-- ============================================================================
-- 16. VERIFY SAMPLE DATA EXISTS
-- ============================================================================

SELECT 'SAMPLE DATA - LEADS' as check_type, COUNT(*) as row_count FROM leads;
SELECT 'SAMPLE DATA - COMPANIES' as check_type, COUNT(*) as row_count FROM companies;
SELECT 'SAMPLE DATA - HR_USERS' as check_type, COUNT(*) as row_count FROM hr_users;
SELECT 'SAMPLE DATA - POSITIONS' as check_type, COUNT(*) as row_count FROM positions;
SELECT 'SAMPLE DATA - APPLICANTS' as check_type, COUNT(*) as row_count FROM applicants;

-- Expected:
-- - leads: 3-4 rows (from 010, 012)
-- - companies: 1-3 rows (from 004)
-- - hr_users: 1-3 rows (from 004)
-- - positions: 0-2 rows (optional)
-- - applicants: 0+ rows (optional)

-- ============================================================================
-- 17. VERIFY UNIQUE CONSTRAINTS
-- ============================================================================

SELECT
    'UNIQUE CONSTRAINTS' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Expected unique constraints:
-- - companies.company_domain
-- - hr_users.email
-- - positions.position_code
-- - etc.

-- ============================================================================
-- 18. VERIFY PRIMARY KEYS
-- ============================================================================

SELECT
    'PRIMARY KEYS' as check_type,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Expected: All tables should have UUID primary key on 'id' column

-- ============================================================================
-- 19. VERIFY COLUMN COMMENTS
-- ============================================================================

SELECT
    'COLUMN COMMENTS' as check_type,
    c.table_name,
    c.column_name,
    pgd.description as comment
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
INNER JOIN information_schema.columns c ON (
    pgd.objsubid = c.ordinal_position
    AND c.table_schema = st.schemaname
    AND c.table_name = st.relname
)
WHERE st.schemaname = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- Expected: Comments on key columns from migrations

-- ============================================================================
-- 20. VERIFICATION SUMMARY
-- ============================================================================

SELECT
    '=== VERIFICATION SUMMARY ===' as summary,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
    (SELECT COUNT(*) FROM information_schema.table_constraints
     WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') as total_foreign_keys,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_rls_policies,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as total_triggers;
