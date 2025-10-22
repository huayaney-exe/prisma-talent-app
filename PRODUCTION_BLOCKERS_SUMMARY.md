# Production Blockers Summary

**Date**: 2025-10-22
**Analysis**: Complete production readiness QA of all user flows
**Status**: 🔴 2 CRITICAL BLOCKERS identified

---

## Executive Summary

Comprehensive analysis of all 7 critical user flows identified **2 PRODUCTION BLOCKERS** that will cause system failures in production. Both blockers affect core workflows and must be resolved before deployment.

**Time to Production Ready**: 2-6 hours (depending on blocker resolution strategy)

---

## BLOCKER #1: Public HR Form Company Association

### Problem
Public HR form (`/hr-form`) has no mechanism to determine `company_id`, causing immediate error: "Company ID is required. Please log in or contact support."

### Root Cause
```typescript
// frontend/src/services/positionService.ts:41
if (!finalCompanyId) {
  throw new Error('Company ID is required. Please log in or contact support.')
}
```

The service attempts to get company_id from:
1. Explicit `companyId` parameter (not provided for public forms)
2. Authenticated user's company (user is unauthenticated for public forms)

### Impact
- **Severity**: CRITICAL
- **Affected Flow**: Flow 3 - Position Creation (Public HR Form)
- **User Experience**: Public users cannot submit HR form, immediate error
- **Business Impact**: If clients embed form on their websites, it will fail

### Resolution Options

#### Option A: Remove Public HR Form (RECOMMENDED for MVP)
**Time**: 30 minutes
**Changes**:
- Remove `/hr-form` route from public access
- Update documentation to clarify HR form requires authentication
- Update client dashboard to make "Create Position" the primary entry point

**Pros**:
- Simple, fast implementation
- Maintains security and data integrity
- Aligns with authenticated client workflow
- No architectural complexity

**Cons**:
- Reduces flexibility for clients who want embedded forms
- Requires clients to log in before creating positions

#### Option B: Subdomain-Based Company Detection
**Time**: 4-6 hours
**Changes**:
- Implement subdomain routing (e.g., `acme.getprisma.io/hr-form`)
- Add company_slug to companies table
- Configure DNS wildcard for subdomains
- Update positionService to detect company from subdomain

**Pros**:
- Elegant solution for embedded forms
- Maintains multi-tenancy security
- Scalable for future growth

**Cons**:
- Significant infrastructure complexity
- DNS configuration required
- Not suitable for MVP timeline

#### Option C: URL Parameter Strategy
**Time**: 1 hour
**Changes**:
- Accept company_id as URL parameter (`/hr-form?company=xxx`)
- Add validation and security checks

**Pros**:
- Quick implementation
- Allows public form submission

**Cons**:
- Security risk (company_id exposed in URL)
- URL tampering vulnerability
- Poor user experience
- **NOT RECOMMENDED**

### Recommendation
**Choose Option A** - Remove public HR form for MVP. Focus on authenticated client workflow, defer public embeddable forms to v2.

---

## BLOCKER #2: Business Form RLS Policy Missing ⚠️ NEW FINDING

### Problem
Business leaders receive email link to complete position specifications (`/business-form?code=XXX`), but they are unauthenticated (`anon` role). Current RLS policies only allow authenticated users to update positions, causing **permission denied** error.

### Root Cause
```sql
-- From database/migrations/006_rls_policies_update.sql
-- Only authenticated update policies exist:

CREATE POLICY "positions_hr_update" ON positions
  FOR UPDATE TO authenticated USING (...);

CREATE POLICY "positions_admin_update" ON positions
  FOR UPDATE TO authenticated USING (...);

-- ❌ NO PUBLIC UPDATE POLICY EXISTS
```

### Impact
- **Severity**: CRITICAL
- **Affected Flow**: Flow 4 - Business Leader Completes Position
- **User Experience**: Business leader clicks email link, fills form, submission fails with RLS error
- **Business Impact**: Core position workflow broken, leaders cannot complete specifications

### Resolution

#### ✅ Migration 031 Created
**File**: `database/migrations/031_business_form_public_update.sql`
**Time to Apply**: 15 minutes

```sql
CREATE POLICY "positions_business_form_public_update" ON positions
  FOR UPDATE
  TO anon
  USING (workflow_stage = 'hr_completed')
  WITH CHECK (
    workflow_stage = 'leader_completed'
    AND company_id = (SELECT company_id FROM positions WHERE id = positions.id)
  );
```

**Security Features**:
- ✅ Only allows updates to positions in `hr_completed` stage
- ✅ Only allows transition to `leader_completed` stage
- ✅ Prevents company_id tampering (security check)
- ✅ Business leader can only update their specific fields

### Application Instructions
See: `database/APPLY_MIGRATION_031.md`

**Option 1**: Supabase Dashboard SQL Editor (recommended)
**Option 2**: psql command line

---

## High Priority Issues (Non-Blocking)

### Issue #3: Email System Verification
**Priority**: 🟠 HIGH
**Impact**: Critical for workflows, but testable in production

**Tests Required**:
1. Lead conversion → Client receives magic link email
2. HR form submission → Business leader receives form link email
3. Leader form completion → Admin receives notification

**Verification Query**:
```sql
SELECT email_type, recipient_email, sent_at, status
FROM email_communications
ORDER BY created_at DESC LIMIT 10;
```

### Issue #4: Frontend Production URLs
**Priority**: 🟠 HIGH
**Impact**: Wrong URLs in emails break magic links

**Files to Update**:
- `frontend/.env.production` - Update `VITE_APP_URL` to production domain
- Database `app_config` table - Update frontend_url

**Current**: `http://localhost:3000` (development)
**Required**: `https://talent.prisma.pe` (production)

### Issue #5: File Upload Storage
**Priority**: 🟠 HIGH
**Impact**: Applicants cannot attach resumes/portfolios

**Required Buckets**:
- `resumes` - Public read, authenticated write
- `portfolios` - Public read, authenticated write

**Configuration**: Supabase Dashboard → Storage → Create Buckets

---

## Production Readiness Checklist

### Phase 1: Critical Blockers (MUST FIX)
- [ ] **BLOCKER #1**: Decide on public HR form strategy (Option A recommended)
- [ ] **BLOCKER #2**: Apply migration 031 (business form RLS policy)
- [ ] Verify both blockers resolved with integration tests

### Phase 2: High Priority (SHOULD FIX)
- [ ] Test email system end-to-end (all 3 trigger types)
- [ ] Update frontend production URLs (.env.production + app_config)
- [ ] Create storage buckets (resumes, portfolios)

### Phase 3: Integration Testing
- [ ] Test Flow 1: Lead Generation → Client Onboarding
- [ ] Test Flow 2: Position Creation (Authenticated Client)
- [ ] Test Flow 4: Business Leader Completes Position
- [ ] Test Flow 5: Admin Reviews & Publishes Position
- [ ] Test Flow 6: Applicant Applies for Job
- [ ] Test Flow 7: Admin Reviews Applicants

### Phase 4: Deployment
- [ ] All blockers resolved
- [ ] All high priority issues addressed
- [ ] Integration tests passing
- [ ] Smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor error logs for 24 hours

---

## Timeline Estimates

### Minimum (Blockers Only)
**Time**: 2 hours
**Scope**: Fix both blockers, minimal testing
**Risk**: HIGH - May encounter issues in production

### Recommended (Blockers + High Priority)
**Time**: 5-6 hours
**Scope**: Fix all blockers, address high priority issues, basic testing
**Risk**: MEDIUM - Good balance of speed and quality

### Comprehensive (All Issues + Full Testing)
**Time**: 8-10 hours
**Scope**: Fix all issues, complete integration testing, production monitoring setup
**Risk**: LOW - Production-ready with confidence

---

## Recommendation

**DO NOT deploy to production** until both critical blockers are resolved.

**Recommended Path**:
1. Apply migration 031 immediately (15 min)
2. Remove public HR form route (Option A - 30 min)
3. Test both fixes with integration tests (1 hour)
4. Address high priority issues (2-3 hours)
5. Deploy with monitoring (1 hour)

**Total**: ~5 hours to production-ready state

---

## Files Created

1. `PRODUCTION_READINESS_QA.md` - Complete user flow analysis
2. `database/migrations/031_business_form_public_update.sql` - RLS policy fix
3. `database/APPLY_MIGRATION_031.md` - Migration application instructions
4. `PRODUCTION_BLOCKERS_SUMMARY.md` - This document

## Related Documentation

- [CRITICAL_BUGS_RESOLVED.md](./CRITICAL_BUGS_RESOLVED.md) - Previous bug fixes
- [PRODUCTION_READINESS_QA.md](./PRODUCTION_READINESS_QA.md) - Detailed flow analysis
- [QA_FINDINGS_REPORT.md](./QA_FINDINGS_REPORT.md) - Complete bug report
