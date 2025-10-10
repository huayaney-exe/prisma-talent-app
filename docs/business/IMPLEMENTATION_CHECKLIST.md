# Implementation Checklist - Prisma Talent ATS

Quick reference to verify your Supabase database implementation against the planned architecture.

## 🗄️ **Core Tables (7 Required)**

### ✅ **Core Tables Checklist**
- [ ] `companies` - Root tenant table
- [ ] `hr_users` - User management with roles
- [ ] `positions` - Job positions with workflow
- [ ] `job_descriptions` - AI-generated descriptions
- [ ] `applicants` - Candidate applications
- [ ] `application_activities` - Audit trail
- [ ] `email_communications` - Email tracking

### 🔍 **Key Fields to Verify**

#### `companies` table should have:
- [ ] `id` (UUID primary key)
- [ ] `company_name`, `company_domain`
- [ ] `subscription_status`, `subscription_plan`
- [ ] `primary_contact_name`, `primary_contact_email`
- [ ] `created_at`, `updated_at`, `created_by`

#### `hr_users` table should have:
- [ ] `id` (UUID), `company_id` (foreign key)
- [ ] `email` (unique), `full_name`, `role`
- [ ] `role` CHECK constraint: ('company_admin', 'hr_manager', 'hr_user')
- [ ] `can_create_positions`, `can_manage_team`, `can_view_analytics`
- [ ] `is_active` boolean, `created_at`, `updated_at`

#### `positions` table should have:
- [ ] `id` (UUID), `company_id`, `position_code` (unique)
- [ ] `workflow_stage` with 11 stages (hr_draft → active → filled)
- [ ] `position_name`, `area`, `seniority`
- [ ] `leader_name`, `leader_email`
- [ ] `area_specific_data` JSONB field
- [ ] Timestamp fields: `hr_completed_at`, `leader_completed_at`

---

## 🔐 **Security Implementation**

### ✅ **Row Level Security (RLS)**
- [ ] RLS enabled on ALL 7 tables
- [ ] Tenant isolation policies using `company_id`
- [ ] Role-based permissions for position creation
- [ ] Public access policies for job applications

### 🔍 **RLS Policies to Check**
- [ ] `tenant_isolation` policy on all tables
- [ ] `company_access` policy on companies table
- [ ] `can_create_positions` policy
- [ ] `can_manage_team` policy
- [ ] `public_position_read` policy
- [ ] `public_application_insert` policy

---

## ⚡ **Performance & Indexes**

### ✅ **Essential Indexes**
- [ ] `idx_hr_users_company_id` - Tenant isolation
- [ ] `idx_positions_company_id` - Tenant isolation
- [ ] `idx_applicants_company_id` - Tenant isolation
- [ ] `idx_positions_company_workflow` - Dashboard queries
- [ ] `idx_positions_code` - Leader form URLs
- [ ] `idx_applicants_position_id` - Foreign key
- [ ] `idx_hr_users_email` - Authentication

### 🔍 **Index Performance Check**
```sql
-- Run this to check index usage
SELECT indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('companies', 'hr_users', 'positions', 'applicants')
ORDER BY idx_tup_read DESC;
```

---

## 🔄 **Workflow Implementation**

### ✅ **Position Workflow Stages**
- [ ] `hr_draft` - HR creating Form 1
- [ ] `hr_completed` - Form 1 submitted
- [ ] `leader_notified` - Email sent to leader
- [ ] `leader_in_progress` - Leader working on Form 2
- [ ] `leader_completed` - Form 2 submitted
- [ ] `job_desc_generated` - AI generated description
- [ ] `validation_pending` - Waiting for approvals
- [ ] `validated` - Both parties approved
- [ ] `active` - Accepting applications
- [ ] `filled` - Position filled
- [ ] `cancelled` - Position cancelled

### 🔍 **Position Code Format**
- [ ] Auto-generated codes like `POS_A1B2C3D4`
- [ ] Unique constraint on `position_code`
- [ ] Used in leader form URLs: `/formulario-lider?position=POS_A1B2C3D4`

---

## 📊 **Sample Data Testing**

### ✅ **Test Companies**
- [ ] At least 2 companies for multi-tenant testing
- [ ] Different subscription statuses (trial, active)
- [ ] Complete company profiles

### ✅ **Test Users**
- [ ] Users with different roles (company_admin, hr_manager, hr_user)
- [ ] Different permission levels
- [ ] Users belonging to different companies

### ✅ **Test Positions**
- [ ] Positions at different workflow stages
- [ ] Different areas (Product, Engineering, Growth, Design)
- [ ] JSONB data in `area_specific_data`

### ✅ **Test Applications**
- [ ] Applications with different statuses
- [ ] Different source types
- [ ] Activity trail for applications

---

## 🛠️ **Helper Functions & Triggers**

### ✅ **Required Functions**
- [ ] `update_updated_at_column()` - Auto-update timestamps
- [ ] `get_current_user_company_id()` - RLS helper
- [ ] `user_has_permission(TEXT)` - Permission checker
- [ ] `user_has_role(TEXT)` - Role checker

### ✅ **Required Triggers**
- [ ] `update_*_updated_at` triggers on all tables
- [ ] Audit triggers for security logging (optional)

---

## 🧪 **Multi-Tenant Testing**

### ✅ **Isolation Verification**
```sql
-- Test queries to verify tenant isolation works:

-- 1. Data should be isolated by company
SELECT company_id, COUNT(*) FROM positions GROUP BY company_id;

-- 2. RLS should prevent cross-tenant access
SET ROLE authenticated;
SELECT * FROM positions; -- Should only see user's company data

-- 3. Position codes should be unique globally
SELECT position_code, COUNT(*) FROM positions GROUP BY position_code HAVING COUNT(*) > 1;
```

---

## 📈 **Success Criteria**

### 🎯 **Implementation Complete When:**
- [ ] ✅ **7/7 tables** created with correct schema
- [ ] ✅ **7/7 tables** have RLS enabled with proper policies
- [ ] ✅ **Multi-tenant isolation** works correctly
- [ ] ✅ **Workflow progression** from hr_draft → active
- [ ] ✅ **Position codes** generate and work in URLs
- [ ] ✅ **Sample data** demonstrates full functionality
- [ ] ✅ **Performance indexes** are in place
- [ ] ✅ **Security policies** enforce proper access

### 🚨 **Common Issues to Check:**
- [ ] Missing `company_id` foreign keys
- [ ] RLS policies not covering all tables
- [ ] Incorrect role CHECK constraints
- [ ] Missing unique constraints on `position_code`
- [ ] JSONB fields not defaulting to `{}`
- [ ] Triggers not firing for `updated_at`

---

## 🔧 **Quick Verification Commands**

Run these in your Supabase SQL Editor:

```sql
-- 1. Count all tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 7+ tables

-- 2. Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Expected: All should show 't' for rowsecurity

-- 3. Test position code generation
INSERT INTO positions (company_id, position_name, area, seniority, leader_name, leader_email, salary_range, contract_type, timeline, position_type, created_by)
VALUES ('uuid-here', 'Test Position', 'Product Management', 'Senior 5-8 años', 'Test Leader', 'test@example.com', '$1000', 'Tiempo completo', CURRENT_DATE, 'Nueva posición', 'uuid-here')
RETURNING position_code;
-- Expected: Code like POS_A1B2C3D4

-- 4. Test multi-tenant isolation
SELECT c.company_name, COUNT(p.id) as positions
FROM companies c
LEFT JOIN positions p ON c.id = p.company_id
GROUP BY c.id, c.company_name;
-- Expected: Data grouped by company
```

---

## 📞 **Next Steps**

After running the verification:

1. **Run `verify-implementation.sql`** in Supabase SQL Editor
2. **Check results** against this checklist
3. **Identify gaps** between expected vs actual
4. **Report status** - what's working and what needs fixing
5. **Proceed to frontend integration** once database is complete

The database should be ready for the talent platform workflow once all items are checked! ✅