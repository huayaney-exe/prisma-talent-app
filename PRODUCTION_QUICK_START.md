# Production Quick Start Guide

**Last Updated**: 2025-10-22
**Status**: 🔴 2 Critical Blockers - NOT READY FOR PRODUCTION

---

## 🚨 Critical Actions Required

### 1. Apply Migration 031 (15 minutes) - MUST DO FIRST

**What**: Fix business form RLS policy to allow public updates
**Why**: Business leaders cannot submit forms without this
**How**: See [APPLY_MIGRATION_031.md](./database/APPLY_MIGRATION_031.md)

**Quick Apply**:
1. Go to Supabase Dashboard SQL Editor
2. Copy SQL from `database/migrations/031_business_form_public_update.sql`
3. Run it
4. Verify policy appears in pg_policies

### 2. Remove Public HR Form Route (30 minutes) - REQUIRED

**What**: Disable public HR form, require authentication
**Why**: No way to determine company_id for public submissions
**How**: Choose one option below

**Option A (Recommended)**: Quick Fix - Remove Route
```typescript
// In App.tsx - Comment out or remove:
// <Route path="/hr-form" element={<HRFormPage />} />

// Update client dashboard to emphasize "Create Position" button
```

**Option B (Future)**: Implement subdomain routing (defer to v2)

---

## ⚠️ High Priority (Before Launch)

### 3. Update Production URLs (30 minutes)

**File 1**: `frontend/.env.production`
```bash
VITE_APP_URL=https://talent.prisma.pe  # Change from localhost:3000
```

**File 2**: Database app_config table
```sql
UPDATE app_config
SET value = 'https://talent.prisma.pe'
WHERE key = 'frontend_url';
```

### 4. Create Storage Buckets (20 minutes)

**Supabase Dashboard → Storage**:
1. Create bucket: `resumes`
   - Public: ✅ (public read)
   - File size limit: 10MB
   - Allowed MIME types: application/pdf, image/*
2. Create bucket: `portfolios`
   - Public: ✅ (public read)
   - File size limit: 20MB
   - Allowed MIME types: application/pdf, image/*, application/zip

### 5. Test Email System (1 hour)

**Test 1**: Lead Conversion
1. Submit lead form (public)
2. Admin approves and converts lead
3. Verify client receives magic link email
4. Check email_communications table

**Test 2**: Position Creation
1. Client creates position (authenticated)
2. Verify business leader receives email
3. Check email contains correct position_code

**Test 3**: Business Form Completion
1. Business leader submits form
2. Verify admin receives notification
3. Check workflow_stage = 'leader_completed'

**Verification Query**:
```sql
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

## ✅ Integration Testing (2 hours)

### Test All Critical Flows

**Flow 1**: Lead → Client Onboarding
- [ ] Public submits lead form
- [ ] Admin converts to client
- [ ] Client receives magic link
- [ ] Client logs in successfully

**Flow 2**: Position Creation (Client)
- [ ] Client creates position from dashboard
- [ ] Position appears in /client/positions
- [ ] Business leader receives email

**Flow 4**: Business Form Completion
- [ ] Business leader clicks email link
- [ ] Form loads correctly
- [ ] Submission succeeds (after migration 031)
- [ ] Position transitions to leader_completed

**Flow 5**: Admin Review & Publish
- [ ] Admin views position in pipeline
- [ ] Admin creates job description
- [ ] Admin validates and publishes
- [ ] Job appears at /job/:code

**Flow 6**: Job Application
- [ ] Public views job listing
- [ ] Applicant submits application
- [ ] Resume upload works
- [ ] Application appears in admin dashboard

**Flow 7**: Candidate Review
- [ ] Admin filters applicants by position
- [ ] Admin qualifies/rejects candidates
- [ ] Shortlist generation works

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

**Blockers**:
- [ ] Migration 031 applied
- [ ] Public HR form disabled
- [ ] Both blockers verified with tests

**High Priority**:
- [ ] Production URLs configured
- [ ] Storage buckets created
- [ ] Email system tested

**Integration Tests**:
- [ ] All 7 flows tested end-to-end
- [ ] No errors in console
- [ ] No RLS permission denials

### Deployment Steps

1. **Verify All Checklist Items Complete**
2. **Run Final Smoke Tests**
   - Test admin login
   - Test client login
   - Test lead submission
   - Test position creation

3. **Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   # Deploy to Vercel/production
   ```

4. **Monitor for 24 Hours**
   - Check error logs
   - Monitor email_communications table
   - Watch for RLS errors
   - Monitor application submissions

### Rollback Plan

If critical issues arise:
1. Revert frontend deployment
2. Check Supabase logs for errors
3. Review RLS policy issues
4. Test in development environment

---

## 📊 Production Monitoring

### Key Metrics to Watch

**Email Delivery**:
```sql
SELECT
  email_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM email_communications
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY email_type;
```

**Application Submissions**:
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as applications
FROM applicants
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Position Workflow Health**:
```sql
SELECT
  workflow_stage,
  COUNT(*) as count
FROM positions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY workflow_stage
ORDER BY count DESC;
```

### Error Indicators

**Watch For**:
- RLS permission denied errors
- Email send failures
- File upload errors
- Authentication issues

**Resolution**:
- Check Supabase logs
- Review RLS policies
- Verify environment variables
- Test in development

---

## 🆘 Quick Troubleshooting

### Business Form Fails
**Problem**: "Permission denied" error
**Fix**: Apply migration 031 (business form RLS policy)
**Verify**: `SELECT * FROM pg_policies WHERE tablename = 'positions'`

### Emails Not Sending
**Problem**: Email triggers not firing
**Fix**: Check Resend API key in Supabase secrets
**Verify**: `SELECT * FROM email_communications ORDER BY created_at DESC`

### File Uploads Fail
**Problem**: "Bucket not found" error
**Fix**: Create storage buckets in Supabase Dashboard
**Verify**: Storage → Buckets should show `resumes` and `portfolios`

### Magic Links Don't Work
**Problem**: Wrong redirect URL
**Fix**: Update VITE_APP_URL in .env.production
**Verify**: Check email_communications content for correct URLs

---

## 📚 Related Documentation

- [PRODUCTION_BLOCKERS_SUMMARY.md](./PRODUCTION_BLOCKERS_SUMMARY.md) - Detailed blocker analysis
- [PRODUCTION_READINESS_QA.md](./PRODUCTION_READINESS_QA.md) - Complete flow analysis
- [APPLY_MIGRATION_031.md](./database/APPLY_MIGRATION_031.md) - RLS fix instructions
- [CRITICAL_BUGS_RESOLVED.md](./CRITICAL_BUGS_RESOLVED.md) - Previous bug fixes

---

## ⏱️ Time Estimates

**Minimum Path** (2 hours):
1. Apply migration 031 (15 min)
2. Remove public HR form (30 min)
3. Basic testing (1 hour)
4. Deploy (15 min)

**Recommended Path** (5-6 hours):
1. Fix blockers (45 min)
2. Address high priority (2-3 hours)
3. Integration testing (2 hours)
4. Deploy + monitor (1 hour)

**Current Status**: 🔴 NOT READY
**Target Status**: 🟢 PRODUCTION READY
**Estimated Time**: 5-6 hours
