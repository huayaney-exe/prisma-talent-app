# Production Readiness QA - User Flows Analysis

**Date**: 2025-10-22
**Purpose**: Comprehensive end-to-end testing of all user flows for production deployment
**Status**: 🔄 IN PROGRESS

---

## User Roles & Journeys

### Role Overview

1. **Public User** (No Auth)
   - Submit lead form
   - View job listings
   - Submit applications
   - Complete HR form (if embedded)
   - Complete Business form (via email link)

2. **Client Admin** (Authenticated via Magic Link)
   - Access client dashboard
   - View company positions
   - Create new positions via HR form
   - Manage team (future)

3. **Prisma Admin** (Authenticated via Email/Password)
   - Manage leads
   - Onboard clients
   - Manage position pipeline
   - Review applicants
   - Generate shortlists
   - Validate & publish job descriptions

---

## Critical User Flows for Production

### Flow 1: Lead Generation → Client Onboarding
**Path**: Public → Admin → Client
**Steps**: 7
**Dependencies**: Supabase Auth, Edge Function, Email System

```
1. Public user submits lead form
   ↓
2. Lead stored in database (status: 'pending')
   ↓
3. Admin views in /admin/leads
   ↓
4. Admin approves lead
   ↓
5. Admin converts to client (calls convertLeadToClient)
   ↓
6. Edge Function creates company + HR user + sends magic link
   ↓
7. Client receives email, logs in to /client/dashboard
```

**Critical Points**:
- ✅ Lead form validation
- ✅ Email delivery via Resend
- ✅ Magic link authentication
- ⚠️ Email template content
- ⚠️ Error handling for duplicate emails

---

### Flow 2: Position Creation (Authenticated Client)
**Path**: Client Dashboard → HR Form → Email to Leader
**Steps**: 5
**Dependencies**: RLS Policies, Database Triggers, Email System

```
1. Client clicks "Crear Nueva Posición" from dashboard
   ↓
2. Fills out HR Form with position details
   ↓
3. Position created (workflow_stage: 'hr_completed')
   ↓
4. Database trigger fires: notify_business_user_on_hr_completion
   ↓
5. Email sent to business leader with form link
```

**Critical Points**:
- ✅ created_by populated with hr_user.id
- ⚠️ company_id association
- ⚠️ Email trigger fires immediately
- ⚠️ Business leader receives correct link
- ⚠️ position_code generated correctly

---

### Flow 3: Position Creation (Public HR Form)
**Path**: Public → HR Form → Email to Leader
**Steps**: 4
**Dependencies**: Nullable created_by, Company fallback

```
1. Public user accesses /hr-form (embedded in client site)
   ↓
2. Fills out HR Form
   ↓
3. Position created (created_by: NULL, company_id: ???)
   ↓
4. Email sent to business leader
```

**Critical Points**:
- ⚠️ **BLOCKER**: How is company_id determined for public forms?
- ✅ created_by is NULL
- ⚠️ Without company_id, position creation will fail
- ⚠️ Need strategy for public form company association

**PRODUCTION BLOCKER**: Public HR form needs company context!

---

### Flow 4: Business Leader Completes Position
**Path**: Email Link → Business Form → Admin Review
**Steps**: 4
**Dependencies**: Position Code Validation

```
1. Business leader receives email with position_code
   ↓
2. Clicks link: /business-form?code=PM2024Q3
   ↓
3. Completes area-specific questions
   ↓
4. Position updated (workflow_stage: 'leader_completed')
```

**Critical Points**:
- ⚠️ Position code validation (if missing → error state?)
- ⚠️ Business form is public (no auth) - RLS allows updates?
- ⚠️ Email contains correct frontend URL
- ✅ Position stage transitions correctly

---

### Flow 5: Admin Reviews & Publishes Position
**Path**: Admin Dashboard → Position Pipeline → Job Posting
**Steps**: 6
**Dependencies**: Job Description Service, RLS Policies

```
1. Admin views position in /admin/positions
   ↓
2. Clicks to view detail /admin/positions/:positionId
   ↓
3. Creates job description (manual or AI)
   ↓
4. Validates JD at /admin/positions/:positionId/validate
   ↓
5. Publishes JD (workflow_stage: 'active')
   ↓
6. Job appears at /job/:code (public)
```

**Critical Points**:
- ✅ Position detail page loads
- ⚠️ JD creation service works
- ⚠️ Validation flow functional
- ⚠️ Publishing triggers position activation
- ⚠️ Public job page accessible

---

### Flow 6: Applicant Applies for Job
**Path**: Public Job Page → Application Form → Admin Review
**Steps**: 4
**Dependencies**: File Upload, Supabase Storage

```
1. Public user views /job/:code
   ↓
2. Clicks "Apply" → /apply/:code
   ↓
3. Submits application with resume/portfolio
   ↓
4. Admin reviews in /admin/candidates
```

**Critical Points**:
- ⚠️ Job listing displays correctly
- ⚠️ Application form loads position data
- ⚠️ File uploads work (resume, portfolio)
- ✅ Applicant query fixed (Bug #3)
- ✅ Position filtering fixed (Bug #4)

---

### Flow 7: Admin Reviews Applicants & Generates Shortlist
**Path**: Admin Candidates → Qualify → Shortlist
**Steps**: 4
**Dependencies**: Applicant Service

```
1. Admin views /admin/candidates
   ↓
2. Filters by position code
   ↓
3. Qualifies/rejects applicants
   ↓
4. Generates shortlist /admin/shortlist/:code
```

**Critical Points**:
- ✅ Applicant list loads (Bug #3 fixed)
- ✅ Position filtering works (Bug #4 fixed)
- ⚠️ Qualification updates work
- ⚠️ Shortlist generation functional
- ℹ️ Email shortlist is manual (not automated)

---

## Production Blockers Found

### 🔴 BLOCKER #1: Public HR Form Company Association
**Location**: Flow 3 - Position Creation (Public)
**Problem**: Public HR form has no way to determine company_id
**Current Code**:
```typescript
// positionService.ts:41
if (!finalCompanyId) {
  throw new Error('Company ID is required. Please log in or contact support.')
}
```

**Impact**: Public HR forms will fail with error
**Options**:
1. **Remove public HR form** - Only allow authenticated clients
2. **Add company_id to URL** - `/hr-form?company=xxx` (security risk)
3. **Use subdomain** - `company-slug.getprisma.io/hr-form`
4. **Require minimal auth** - Magic link before HR form

**Recommendation**: Option 1 - Remove public HR form for now

---

### 🔴 BLOCKER #2: Business Form RLS Policies - WILL FAIL
**Location**: Flow 4 - Business Leader Form
**Problem**: Business form is public (unauthenticated) but tries to update positions table
**Status**: ❌ **CONFIRMED BLOCKER** - No public update policy exists

**Current RLS Policies on positions table**:
```sql
-- From database/migrations/006_rls_policies_update.sql
-- Lines 191-214

-- ✅ HR users can insert (authenticated)
CREATE POLICY "positions_hr_insert" ON positions FOR INSERT...

-- ✅ HR users can update (authenticated)
CREATE POLICY "positions_hr_update" ON positions FOR UPDATE...

-- ✅ Prisma admins can update (authenticated)
CREATE POLICY "positions_admin_update" ON positions FOR UPDATE...

-- ❌ NO PUBLIC UPDATE POLICY EXISTS
```

**Impact**: Business leaders clicking email link will get RLS permission denied error when trying to submit business form

**Solution Required**: Add new RLS policy for public business form updates
```sql
-- Allow public updates ONLY for leader_completed workflow stage
CREATE POLICY "positions_business_form_update" ON positions
  FOR UPDATE
  TO anon
  USING (workflow_stage = 'hr_completed')
  WITH CHECK (workflow_stage = 'leader_completed');
```

**Migration Required**: Create `031_business_form_public_update.sql`

---

### 🟠 HIGH PRIORITY #3: Email System Verification
**Location**: Flows 1, 2, 4
**Problem**: Email triggers need production testing
**Tests Required**:
1. Lead conversion → Client receives magic link
2. HR form submission → Leader receives business form link
3. Leader form completion → Admin receives notification

**Verification**:
```sql
-- Check email_communications table
SELECT
  email_type,
  recipient_email,
  sent_at,
  status,
  created_at
FROM email_communications
ORDER BY created_at DESC
LIMIT 10;
```

---

### 🟡 MEDIUM PRIORITY #4: Frontend Environment Variables
**Location**: All flows with external URLs
**Problem**: Email links need correct production URLs

**Required Variables**:
```bash
# frontend/.env.production
VITE_APP_URL=https://app.getprisma.io  # Must be production URL
VITE_SUPABASE_URL=https://vhjjibfblrkyfzcukqwa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Database Config**:
```sql
-- Check app_config table
SELECT key, value FROM app_config WHERE key LIKE '%url%';
```

---

### 🟡 MEDIUM PRIORITY #5: File Upload Storage
**Location**: Flow 6 - Job Applications
**Problem**: Need Supabase Storage bucket configured

**Required**:
- Bucket: `resumes` (public read)
- Bucket: `portfolios` (public read)
- RLS policies for uploads

**Test**:
```typescript
// Check if bucket exists
const { data: buckets } = await supabase.storage.listBuckets()
console.log('Buckets:', buckets)
```

---

## Testing Checklist

### Pre-Production Tests

#### Environment & Configuration
- [ ] Frontend .env.production has correct URLs
- [ ] Database app_config has production URLs
- [ ] Supabase Edge Functions deployed
- [ ] Resend API key configured in Supabase secrets
- [ ] Storage buckets created (resumes, portfolios)

#### Authentication Flows
- [ ] Admin can log in with email/password
- [ ] Client receives magic link email
- [ ] Magic link redirects to /client/dashboard
- [ ] Session persists across page reloads

#### Lead Management
- [ ] Public can submit lead form
- [ ] Lead appears in admin dashboard
- [ ] Admin can approve/reject leads
- [ ] Admin can convert lead to client
- [ ] Client receives invitation email

#### Position Creation
- [ ] Authenticated client can create position
- [ ] created_by is populated correctly
- [ ] Business leader receives email with form link
- [ ] Email link contains correct position_code

#### Position Workflow
- [ ] Business form loads with position_code
- [ ] Business form can update position
- [ ] Admin can view position in pipeline
- [ ] Admin can create job description
- [ ] Admin can validate and publish
- [ ] Published job appears at /job/:code

#### Application Flow
- [ ] Public can view job listing
- [ ] Application form loads correctly
- [ ] Resume upload works
- [ ] Portfolio upload works
- [ ] Application appears in admin candidates

#### Admin Candidate Review
- [ ] Admin can view all applicants
- [ ] Filter by position code works
- [ ] Qualify/reject applicants works
- [ ] Shortlist generation works

#### Client Dashboard
- [ ] Client can access /client/dashboard
- [ ] Client can view /client/positions
- [ ] Positions list shows correct workflow stages
- [ ] Client can navigate to create new position

---

## Test Data Required

### Test Accounts
```sql
-- Prisma Admin
INSERT INTO prisma_admins (auth_user_id, email, full_name, role, is_active)
VALUES ('admin-uuid', 'admin@getprisma.io', 'Admin Test', 'super_admin', true);

-- Test Company
INSERT INTO companies (company_name, company_domain, primary_contact_email)
VALUES ('Test Company SAC', 'testcompany.com', 'test@testcompany.com');

-- Test HR User
INSERT INTO hr_users (company_id, email, full_name, role, is_active)
VALUES ('company-uuid', 'test@testcompany.com', 'Test User', 'company_admin', true);
```

### Test Position
```sql
INSERT INTO positions (
  company_id,
  position_name,
  area,
  seniority,
  leader_name,
  leader_email,
  salary_range,
  contract_type,
  timeline,
  position_type,
  workflow_stage
) VALUES (
  'company-uuid',
  'Senior Product Manager',
  'product-management',
  'senior',
  'Luis Huayaney',
  'luis@testcompany.com',
  '$80k-$120k',
  'full-time',
  NOW() + INTERVAL '30 days',
  'new',
  'hr_completed'
);
```

---

## Risk Assessment

### 🔴 CRITICAL BLOCKERS (Must Fix Before Production)

#### BLOCKER #1: Public HR Form Company Association
- **Impact**: Public HR forms will throw error "Company ID is required"
- **Severity**: CRITICAL - Breaks entire public form submission flow
- **Affected Flow**: Flow 3 - Position Creation (Public HR Form)
- **Estimated Fix Time**: 30 minutes (remove public form route or implement subdomain strategy)
- **Recommendation**: Remove public HR form for MVP, require client authentication

#### BLOCKER #2: Business Form RLS Policy Missing ⚠️ NEW FINDING
- **Impact**: Business leaders cannot submit business form (RLS permission denied)
- **Severity**: CRITICAL - Breaks core position workflow (Flow 4)
- **Affected Flow**: Flow 4 - Business Leader Completes Position
- **Estimated Fix Time**: 15 minutes (create migration 031 with public update policy)
- **Required Action**: Create `031_business_form_public_update.sql` immediately

### 🟠 HIGH RISK (Should Fix Before Production)
3. **Email System Verification** - Critical for all workflows, needs production testing
4. **Frontend Production URLs** - Wrong URLs break magic links in emails
5. **File Upload Storage** - Applicants can't attach resumes without configured buckets

### 🟢 LOW RISK (Monitor in Production)
6. Position code validation error handling
7. User-facing error messages clarity
8. Loading states and UX polish
9. Analytics and monitoring setup

---

## Next Steps - Production Deployment Roadmap

### Phase 1: CRITICAL BLOCKERS (Required Before Any Deployment)

1. ✅ **Create Migration 031** - Business Form Public Update Policy (15 min)
   - File: `database/migrations/031_business_form_public_update.sql`
   - Add RLS policy allowing anon role to update positions (hr_completed → leader_completed)
   - Apply via Supabase Dashboard SQL Editor

2. ⚠️ **Resolve BLOCKER #1** - Public HR Form Strategy (30 min)
   - **Option A (RECOMMENDED)**: Remove public HR form route, require authentication
   - **Option B**: Implement subdomain-based company detection
   - **Option C**: Add company_id as URL parameter (security concerns)
   - Decision needed before proceeding

### Phase 2: HIGH PRIORITY FIXES (Before Production Launch)

3. **Email System Verification** (1 hour)
   - Test lead conversion → client invitation email
   - Test HR form → business leader notification
   - Test leader form → admin notification
   - Verify all emails contain correct production URLs

4. **Configure Production URLs** (30 min)
   - Update `frontend/.env.production` with production domain
   - Update database `app_config` table with production URLs
   - Verify Edge Functions use production URLs for email links

5. **Create Storage Buckets** (20 min)
   - Create `resumes` bucket (public read, authenticated write)
   - Create `portfolios` bucket (public read, authenticated write)
   - Configure RLS policies for file uploads

### Phase 3: INTEGRATION TESTING (2-3 hours)

6. **Execute Complete Testing Checklist**
   - Run all 7 critical user flows end-to-end
   - Verify authentication flows work correctly
   - Test all email triggers fire properly
   - Validate file uploads work
   - Check admin candidate review workflow

### Phase 4: DEPLOYMENT (If All Tests Pass)

7. **Deploy to Production**
   - Verify all blockers resolved
   - Run final smoke tests
   - Monitor error logs for 24 hours post-deployment

---

## Production Readiness Summary

### Current Status: 🔴 NOT READY FOR PRODUCTION

**Overall Assessment**: System has **2 CRITICAL BLOCKERS** that will cause system failures in production. Core workflows (public HR form submission, business leader form completion) will fail.

### Blockers Breakdown:
- 🔴 **2 Critical Blockers** - System will fail
- 🟠 **3 High Priority Issues** - Should fix before launch
- 🟢 **4 Low Priority Issues** - Monitor in production

### Estimated Time to Production Ready:
- **Minimum**: 2 hours (fix blockers only, skip high priority)
- **Recommended**: 5-6 hours (fix all blockers + high priority + basic testing)
- **Comprehensive**: 8-10 hours (fix all issues + complete integration testing)

### Recommendation:
**DO NOT deploy to production** until both critical blockers are resolved. The business form RLS policy issue will cause immediate failures in the core position workflow.

---

## Status: ✅ ANALYSIS COMPLETE

**QA Analysis Completed**: All 7 critical user flows analyzed, 2 production blockers identified.

**Next Action Required**: Create migration 031 for business form RLS policy, then decide on public HR form strategy.
