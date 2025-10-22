# Complete Database Architecture & Implementation Status

**Date**: 2025-10-22
**Status**: COMPREHENSIVE MAPPING

---

## Verification: Email System Is Database-Native

✅ **Confirmed**: `send_email_via_resend` function exists in database
✅ **Confirmed**: Email sending is handled by database triggers + pg_net
✅ **Confirmed**: No backend needed for email functionality

---

## Database Schema (8 Core Tables)

### 1. **companies** - Multi-tenant root
**Purpose**: Business client accounts
**Key Fields**:
- `id` (UUID, primary key)
- `company_name`, `company_domain` (unique)
- `subscription_status` ('trial', 'active', 'suspended', 'cancelled')
- `primary_contact_auth_id` (UUID) - Links to Supabase Auth user
- `onboarding_completed` (boolean)

**Frontend Interactions**:
- Created via clientService.createClient()
- Updated via company onboarding flows
- Queried for client dashboards

---

### 2. **hr_users** - Company team members
**Purpose**: HR professionals within each company
**Key Fields**:
- `id` (UUID, primary key)
- `company_id` (FK to companies) - Tenant isolation
- `email` (unique per company via composite constraint)
- `role` ('company_admin', 'hr_manager', 'recruiter', 'viewer')
- `permissions` (can_create_positions, can_manage_team, etc.)
- `is_active` (boolean)

**Frontend Interactions**:
- Created alongside company
- Managed in team settings
- Permissions checked for feature access

---

### 3. **positions** - Job openings
**Purpose**: Core workflow entity for talent acquisition
**Key Fields**:
- `id` (UUID, primary key)
- `company_id` (FK to companies)
- `position_code` (unique, e.g., "PM2024Q3")
- `workflow_stage` (enum: 'hr_draft' → 'hr_completed' → ... → 'active' → 'filled')
- `position_name`, `area`, `seniority`
- `leader_name`, `leader_email` (business sponsor)
- `hr_completed_at`, `leader_completed_at` (timestamps)
- `timeline`, `contract_type`, `salary_range`

**Workflow Stages**:
1. `hr_draft` - Initial creation
2. `hr_completed` - HR form submitted → **TRIGGER: Email to leader**
3. `leader_notified` - Email sent
4. `leader_in_progress` - Leader opened form
5. `leader_completed` - Leader submitted → **TRIGGER: Email to admin**
6. `job_desc_generated` - Admin created JD
7. `validation_pending` - Awaiting approval
8. `validated` - Approved
9. `active` - Published → **TRIGGER: Workflow update on JD publish**
10. `filled` - Position closed
11. `cancelled` - Position cancelled

**Frontend Interactions**:
- HR form creates/updates position
- Business form updates position
- Admin pipeline shows all positions
- Admin detail view for each position

---

### 4. **job_descriptions** - Generated JDs
**Purpose**: AI-generated job descriptions for positions
**Key Fields**:
- `id` (UUID, primary key)
- `position_id` (FK to positions, unique) - One JD per position
- `description_text` (text) - Full JD content
- `generation_model` ('manual', 'gpt-4', etc.)
- `hr_approved` (boolean)
- `hr_approved_at`, `hr_approved_by` (UUID)
- `status` ('draft', 'published')
- `published_at` (timestamp)

**Frontend Interactions**:
- Admin creates JD on position detail page
- Admin validates/approves JD
- Admin publishes JD → triggers position to 'active'
- Public job page displays published JD

---

### 5. **applicants** - Candidate profiles
**Purpose**: Candidate information and applications
**Key Fields**:
- `id` (UUID, primary key)
- `email` (unique)
- `full_name`, `phone`
- `linkedin_url`, `portfolio_url`
- `resume_url` (Supabase Storage)
- `years_of_experience`, `current_role`, `location`

**Frontend Interactions**:
- Public application form creates applicant
- Duplicate detection by email
- Profile viewed in admin

---

### 6. **applications** - Application tracking
**Purpose**: Join table linking applicants to positions
**Key Fields**:
- `id` (UUID, primary key)
- `position_id` (FK to positions)
- `applicant_id` (FK to applicants)
- `status` ('new', 'screening', 'interview', 'offer', 'hired', 'rejected')
- `applied_at`, `updated_at`
- `notes` (text) - Admin notes

**Frontend Interactions**:
- Application submissions
- Admin pipeline for applications
- Status updates

---

### 7. **email_communications** - Email tracking & queue
**Purpose**: Email tracking, retry logic, and audit trail
**Key Fields**:
- `id` (UUID, primary key)
- `company_id` (FK to companies, nullable)
- `position_id` (FK to positions, nullable)
- `email_type` ('leader_form_request', 'job_description_validation', 'applicant_status_update', 'client_invitation')
- `recipient_email`, `recipient_name`
- `subject_line`, `email_content`
- `template_data` (jsonb) - Data for template rendering
- `sent_at` (timestamp, NULL = pending)
- `status` ('pending', 'sent', 'failed', 'retry_scheduled')
- `retry_count` (integer)
- `next_retry_at` (timestamp)
- `resend_email_id` (text) - Resend API response ID
- `error_message` (text)

**Email Flow**:
```
1. Database trigger INSERTs record with sent_at = NULL
   ↓
2. on_email_insert TRIGGER fires IMMEDIATELY
   ↓
3. Calls send_email_via_resend(email_id)
   ↓
4. Function renders template from email_type + template_data
   ↓
5. Makes HTTP POST to Resend API via pg_net
   ↓
6. Updates sent_at = NOW() and status = 'sent'
   ↓
7. On failure: retry_count++, next_retry_at = +5min, max 3 retries
```

**Frontend Interactions**:
- No direct frontend interaction
- Admin can view email history (future feature)
- Admin can manually retry failed emails (future feature)

---

### 8. **leads** - Pre-client lead capture
**Purpose**: Marketing qualified leads before becoming clients
**Key Fields**:
- `id` (UUID, primary key)
- `contact_email`, `contact_name`, `contact_phone`
- `company_name`, `company_size`, `industry`
- `linkedin_url`
- `status` ('new', 'contacted', 'qualified', 'converted', 'unqualified')
- `notes` (text)
- `converted_to_company_id` (FK to companies, nullable)

**Frontend Interactions**:
- Public lead form submission
- Admin lead management dashboard
- Convert lead to client

---

### 9. **prisma_admins** - Platform administrators
**Purpose**: Prisma team members with admin access
**Key Fields**:
- `id` (UUID, primary key)
- `auth_id` (UUID, unique) - Links to Supabase Auth user
- `email` (unique)
- `full_name`, `role_title`
- `is_active` (boolean)
- `permissions` (jsonb) - Admin-level permissions

**Frontend Interactions**:
- Admin login checks this table
- Admin dashboard access control
- RLS policies check admin status

---

### 10. **app_config** - Environment configuration
**Purpose**: Store environment-specific URLs and API keys
**Key Fields**:
- `key` (text, primary key)
- `value` (text)
- `description` (text)
- `updated_at` (timestamp)

**Current Config Keys**:
- `frontend_url` - Base frontend URL
- `admin_dashboard_url` - Admin dashboard URL
- `supabase_url` - Supabase project URL
- `supabase_service_role_key` - Service role key (for admin operations)
- `resend_api_key` - Resend API key for email sending

**Used By**:
- Database triggers (get_config() function)
- Email sender function
- Invite client function

---

## Database Functions (16 Functions)

### Email & Communication

**1. `send_email_via_resend(email_id UUID)`**
- **Purpose**: Send email via Resend API using pg_net
- **Location**: Migration 022
- **Status**: ✅ DEPLOYED (confirmed)
- **Triggers**: Called by `on_email_insert` trigger
- **Logic**:
  - Reads `email_communications` record
  - Renders template based on `email_type`
  - Makes HTTP POST to Resend API
  - Updates `sent_at` and `status`
  - Retry logic: 5min delay, max 3 attempts

**2. `trigger_send_email()`**
- **Purpose**: Trigger function for `on_email_insert`
- **Location**: Migration 023
- **Status**: ✅ DEPLOYED
- **Logic**: Calls `send_email_via_resend()` if `sent_at IS NULL`

**3. `invite_client(email, company_id, company_name, hr_user_id, full_name)`**
- **Purpose**: Database RPC for client invitation (DEPRECATED)
- **Location**: Migration 024
- **Status**: ⚠️ DEPLOYED BUT UNUSED (Edge Function used instead)
- **Should Delete**: YES

---

### Workflow Triggers

**4. `notify_business_user_on_hr_completion()`**
- **Purpose**: Send email to business leader when HR form completed
- **Location**: Migration 014/019
- **Status**: ✅ DEPLOYED
- **Trigger**: After UPDATE on `positions` when `workflow_stage = 'hr_completed'`
- **Logic**:
  - Gets company name
  - Builds form URL from `app_config`
  - INSERTs into `email_communications` with `email_type = 'leader_form_request'`
  - on_email_insert trigger fires → email sent

**5. `notify_hr_on_business_completion()`**
- **Purpose**: Notify admin when business leader completes form
- **Location**: Migration 014/019
- **Status**: ✅ DEPLOYED
- **Trigger**: After UPDATE on `positions` when `workflow_stage = 'leader_completed'`
- **Logic**:
  - Builds admin URL from `app_config`
  - INSERTs into `email_communications` with `email_type = 'job_description_validation'`

**6. `update_position_on_jd_publish()`**
- **Purpose**: Update position to 'active' when JD published
- **Location**: Migration 007
- **Status**: ✅ DEPLOYED
- **Trigger**: After UPDATE on `job_descriptions` when `status = 'published'`
- **Logic**: Sets `position.workflow_stage = 'active'`

**7. `update_company_onboarding_status()`**
- **Purpose**: Mark company onboarding complete after first position
- **Location**: Migration 007
- **Status**: ✅ DEPLOYED
- **Trigger**: After INSERT on `positions`
- **Logic**: Sets `company.onboarding_completed = true`

**8. `send_applicant_confirmation()`**
- **Purpose**: Send confirmation email to applicant
- **Location**: Migration 007
- **Status**: ✅ DEPLOYED (but may not be fully implemented)
- **Trigger**: After INSERT on `applicants`
- **Logic**: INSERTs into `email_communications` with `email_type = 'applicant_status_update'`

---

### Utility Functions

**9. `get_config(config_key TEXT)`**
- **Purpose**: Read value from `app_config` table
- **Location**: Migration 019
- **Status**: ✅ DEPLOYED
- **Used By**: All triggers that need environment URLs

**10. `get_current_user_company_id()`**
- **Purpose**: Get company_id from current auth user's metadata
- **Location**: Migration 002
- **Status**: ✅ DEPLOYED
- **Used By**: RLS policies for tenant isolation

**11. `update_updated_at_column()`**
- **Purpose**: Generic trigger function to update `updated_at` timestamp
- **Location**: Migration 001
- **Status**: ✅ DEPLOYED
- **Used By**: UPDATE triggers on all tables

---

### Security & Audit

**12. `user_has_role(role_name TEXT)`**
- **Purpose**: Check if current user has specific role
- **Location**: Migration 011
- **Status**: ✅ DEPLOYED
- **Used By**: RLS policies

**13. `user_has_permission(permission_name TEXT)`**
- **Purpose**: Check if current user has specific permission
- **Location**: Migration 011
- **Status**: ✅ DEPLOYED
- **Used By**: RLS policies

**14. `log_security_event()`**
- **Purpose**: Log security-related events
- **Location**: Migration 002
- **Status**: ✅ DEPLOYED
- **Used By**: Security audit triggers

**15. `prevent_active_position_deletion()`**
- **Purpose**: Prevent deletion of active positions
- **Location**: Migration 007
- **Status**: ✅ DEPLOYED
- **Trigger**: Before DELETE on `positions`

**16. `log_applicant_status_change()`**
- **Purpose**: Track status changes in applications
- **Location**: Migration 007
- **Status**: ✅ DEPLOYED
- **Trigger**: After UPDATE on `applications` when `status` changes

---

## Database Triggers (21 Triggers)

### Email Triggers
1. **on_email_insert** - Sends email immediately after INSERT into `email_communications`

### Workflow Triggers
2. **trigger_notify_business_user** - Emails business leader after `hr_completed`
3. **trigger_notify_hr_on_business_completion** - Emails admin after `leader_completed`
4. **trigger_update_position_on_jd_publish** - Updates position to `active` when JD published
5. **trigger_update_company_onboarding_status** - Marks onboarding complete
6. **trigger_send_applicant_confirmation** - Sends confirmation to applicant

### Security Triggers
7. **security_audit_companies** - Logs company changes
8. **security_audit_hr_users** - Logs HR user changes
9. **security_audit_positions** - Logs position changes
10. **trigger_prevent_active_position_deletion** - Prevents deletion of active positions
11. **trigger_log_applicant_status_change** - Logs application status changes

### Updated At Triggers (6 triggers)
12-17. **update_*_updated_at** - Auto-updates `updated_at` on all core tables

---

## Frontend Database Interactions

### Direct Supabase Queries (via supabase.from())

**clientService.ts**:
- `companies` table: CREATE, READ, UPDATE
- `hr_users` table: CREATE, READ
- Uses Edge Function: `invite-client` for magic link invitations

**leadService.ts**:
- `leads` table: CREATE, READ, UPDATE
- ⚠️ Has backend API call that should be removed

**jdService.ts**:
- `job_descriptions` table: CREATE, READ, UPDATE
- `positions` table: UPDATE (workflow_stage changes)

**positionService.ts**:
- `positions` table: CREATE, READ, UPDATE
- Workflow stage transitions

**applicantService.ts**:
- `applicants` table: CREATE, READ
- `applications` table: CREATE, READ, UPDATE

---

## Implementation Status by Migration

### ✅ Core Schema (001-007)
- [x] 001_initial_schema.sql - All 8 core tables
- [x] 002_rls_policies.sql - Row Level Security
- [x] 003_indexes.sql - Performance indexes
- [x] 004_sample_data.sql - Test data (skipped in production)
- [x] 005_add_prisma_admins.sql - Admin table
- [x] 006_rls_policies_update.sql - RLS refinements
- [x] 007_triggers.sql - Core workflow triggers

### ✅ Admin MVP (010-012)
- [x] 010_admin_mvp_schema.sql - Admin-specific schema
- [x] 011_admin_rls_policies.sql - Admin RLS
- [x] 012_leads_table_expansion.sql - Lead management

### ✅ Email System (013-023)
- [x] 013_email_worker_columns.sql - Email tracking columns
- [x] 014_update_email_triggers.sql - Email workflow triggers
- [x] 015_add_auth_id_to_companies.sql - Link companies to auth
- [x] 016_fix_rls_infinite_recursion.sql - RLS bug fix
- [x] 017_fix_admin_rls_check.sql - Admin RLS fix
- [x] 018_add_luis_as_prisma_admin.sql - Add admin user
- [x] 018_make_created_by_nullable.sql - Allow null created_by
- [x] 019_fix_hardcoded_urls_in_triggers.sql - Use app_config for URLs
- [x] 019_fix_hr_users_created_by_nullable.sql - Fix HR users constraint
- [x] 020_add_client_invitation_email_type.sql - Add email type
- [x] 021_enable_http_extension.sql - Enable pg_net
- [x] 022_email_sender_function.sql - send_email_via_resend()
- [x] 023_trigger_email_sender.sql - on_email_insert trigger

### ⚠️ Failed Experiments (024-028) - Should Delete
- [ ] 024_invite_client_function.sql - Duplicate of Edge Function
- [ ] 025_set_config_vars.sql - Config vars (keep concepts, delete file)
- [ ] 026_fix_email_and_config_rls.sql - RLS fixes (merged into 019)
- [ ] 027_update_production_urls.sql - URL updates (use app_config instead)
- [ ] 028_disable_rls_on_config.sql - RLS disable (wrong approach)

---

## Architecture Summary

### What Works ✅
1. **Database Schema**: All 10 tables properly structured
2. **Email System**: Database-native with pg_net + Resend API
3. **Workflow Triggers**: Position lifecycle automation
4. **Edge Functions**: Client invitations via Supabase Functions
5. **RLS Policies**: Multi-tenant security
6. **Frontend Integration**: Direct Supabase queries

### What's Broken ❌
1. **Backend**: Not deployed, completely unnecessary
2. **leadService.ts**: Still has backend API call
3. **Migrations 024-028**: Failed experiments creating bloat

### What Should Be Deleted 🗑️
1. **backend/** directory - 100% redundant
2. **database/migrations/024-028.sql** - Failed experiments
3. **17 diagnostic SQL files** - Debugging artifacts
4. **invite_client() database function** - Replaced by Edge Function

---

## Final Architecture (Clean)

```
┌─────────────────────────────────────────────────┐
│ Frontend (Vercel)                              │
│ - React + TypeScript                          │
│ - Direct Supabase queries (supabase.from())   │
│ - Edge Function calls (supabase.functions())  │
└───────────────┬─────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────┐
│ Supabase Platform                              │
│ ┌──────────────────────────────────────────┐  │
│ │ PostgreSQL Database                     │  │
│ │ - 10 tables (multi-tenant)             │  │
│ │ - 16 functions                          │  │
│ │ - 21 triggers (workflow automation)     │  │
│ │ - RLS policies (security)               │  │
│ │ - pg_net extension (HTTP calls)         │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ Edge Functions (Deno)                   │  │
│ │ - invite-client (magic links)           │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ Auth (Supabase Auth)                    │  │
│ │ - Magic link authentication             │  │
│ │ - User metadata storage                 │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ Storage (Future)                        │  │
│ │ - Resume PDFs                           │  │
│ │ - Company logos                         │  │
│ └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                │
                ↓
        External Services
        ┌─────────────────┐
        │ Resend API      │
        │ (Email delivery)│
        └─────────────────┘
```

**Total cost**: $0 additional (Supabase plan only)
**Backend cost savings**: $7-21/month
**Architecture complexity**: Low (single platform)
