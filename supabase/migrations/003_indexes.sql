-- Prisma Talent ATS - Performance Indexes
-- Essential indexes for multi-tenant performance
-- Project: prisma-talent (vhjjibfblrkyfzcukqwa)

-- =============================================================================
-- CORE TENANT ISOLATION INDEXES (MOST IMPORTANT)
-- =============================================================================

-- These indexes are critical for multi-tenant performance
-- Every query will filter by company_id through RLS policies

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_users_company_id
  ON hr_users(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_company_id
  ON positions(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_descriptions_company_id
  ON job_descriptions(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applicants_company_id
  ON applicants(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_activities_company_id
  ON application_activities(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_communications_company_id
  ON email_communications(company_id);

-- =============================================================================
-- AUTHENTICATION & USER LOOKUP INDEXES
-- =============================================================================

-- Critical for auth.uid() lookups in RLS policies
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_users_id_company
  ON hr_users(id, company_id);

-- Email lookup for login/user management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_users_email
  ON hr_users(email);

-- Active user filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_users_company_active
  ON hr_users(company_id, is_active);

-- =============================================================================
-- WORKFLOW INDEXES
-- =============================================================================

-- Position workflow queries (dashboard views)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_company_workflow
  ON positions(company_id, workflow_stage);

-- Position code lookup (for leader form URLs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_code
  ON positions(position_code);

-- Active positions for public job listings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_active
  ON positions(workflow_stage)
  WHERE workflow_stage = 'active';

-- Application status tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applicants_company_status
  ON applicants(company_id, application_status);

-- Position-specific applicant queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applicants_position_status
  ON applicants(position_id, application_status);

-- =============================================================================
-- FOREIGN KEY RELATIONSHIP INDEXES
-- =============================================================================

-- Primary foreign key relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applicants_position_id
  ON applicants(position_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_descriptions_position_id
  ON job_descriptions(position_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_activities_applicant_id
  ON application_activities(applicant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_communications_position_id
  ON email_communications(position_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_communications_applicant_id
  ON email_communications(applicant_id);

-- =============================================================================
-- TIME-BASED QUERIES
-- =============================================================================

-- Recent activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_company_created
  ON positions(company_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applicants_company_applied
  ON applicants(company_id, applied_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_activities_created
  ON application_activities(created_at DESC);

-- Email tracking queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_communications_sent
  ON email_communications(sent_at DESC);

-- =============================================================================
-- SEARCH AND FILTERING INDEXES
-- =============================================================================

-- Position area filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_company_area
  ON positions(company_id, area);

-- Seniority level filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_company_seniority
  ON positions(company_id, seniority);

-- Application source tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applicants_company_source
  ON applicants(company_id, source_type);

-- Email type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_communications_company_type
  ON email_communications(company_id, email_type);

-- =============================================================================
-- JOB DESCRIPTION VERSIONING
-- =============================================================================

-- Current version lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_descriptions_position_current
  ON job_descriptions(position_id, is_current_version)
  WHERE is_current_version = TRUE;

-- Published job descriptions for public access
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_descriptions_published
  ON job_descriptions(published_at)
  WHERE published_at IS NOT NULL;

-- =============================================================================
-- AUDIT AND SECURITY INDEXES
-- =============================================================================

-- Security audit queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_user_company
  ON security_audit(user_id, company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_table_action
  ON security_audit(table_name, action);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_created
  ON security_audit(created_at DESC);

-- =============================================================================
-- PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- =============================================================================

-- Active HR users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_users_active_company
  ON hr_users(company_id)
  WHERE is_active = TRUE;

-- Positions awaiting leader completion
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_leader_pending
  ON positions(company_id, leader_email)
  WHERE workflow_stage IN ('leader_notified', 'leader_in_progress');

-- Applications needing review
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applicants_pending_review
  ON applicants(company_id, applied_at)
  WHERE application_status = 'applied';

-- Failed email deliveries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_communications_bounced
  ON email_communications(company_id, email_type)
  WHERE bounced_at IS NOT NULL;

-- =============================================================================
-- UNIQUE CONSTRAINTS (Additional to table definitions)
-- =============================================================================

-- Ensure one current job description per position
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_job_descriptions_position_current_unique
  ON job_descriptions(position_id)
  WHERE is_current_version = TRUE;

-- =============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =============================================================================

-- Dashboard analytics - positions by company, workflow, and time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_analytics
  ON positions(company_id, workflow_stage, created_at DESC, area);

-- Application pipeline - by company, position, status, and time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applicants_pipeline
  ON applicants(company_id, position_id, application_status, applied_at DESC);

-- Email campaign tracking - by company, type, and engagement
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_tracking
  ON email_communications(company_id, email_type, sent_at DESC, opened_at);

-- =============================================================================
-- PERFORMANCE MONITORING QUERIES
-- =============================================================================

-- Use these queries to monitor index usage and performance:

/*
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('companies', 'hr_users', 'positions', 'applicants', 'job_descriptions', 'application_activities', 'email_communications')
ORDER BY idx_tup_read DESC;

-- Check table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE tablename IN ('companies', 'hr_users', 'positions', 'applicants', 'job_descriptions', 'application_activities', 'email_communications');

-- Monitor slow queries
SELECT
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements
WHERE query LIKE '%positions%' OR query LIKE '%applicants%'
ORDER BY mean_time DESC
LIMIT 10;
*/

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON INDEX idx_hr_users_company_id IS 'Critical for tenant isolation and RLS policy performance';
COMMENT ON INDEX idx_positions_company_workflow IS 'Primary index for position dashboard queries';
COMMENT ON INDEX idx_applicants_company_status IS 'Primary index for application pipeline queries';
COMMENT ON INDEX idx_positions_code IS 'Unique lookup for leader form URLs';
COMMENT ON INDEX idx_job_descriptions_position_current_unique IS 'Ensures only one current job description per position';