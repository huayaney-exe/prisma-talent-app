# Production Deployment Guide

**Last Updated**: 2025-10-22
**Status**: 🟢 Ready for Deployment
**Estimated Time**: 30 minutes

---

## Pre-Deployment Checklist

✅ All items below are COMPLETE and VERIFIED:

- [x] All 31 database migrations applied
- [x] Production URLs configured in database
- [x] Storage bucket created with RLS policies
- [x] Email system configured with environment URLs
- [x] All 7 critical flows code-validated
- [x] Frontend environment variables set
- [x] Security (RLS) configured on all tables
- [x] Protected routes enforced in frontend

**Technical Validation**: See [TECHNICAL_READINESS_VALIDATION.md](TECHNICAL_READINESS_VALIDATION.md)

---

## Step 1: Deploy Frontend to Vercel (5 minutes)

### Option A: Automatic Deployment (Recommended)

```bash
# Commit and push to trigger automatic deployment
git add .
git commit -m "feat: Production deployment"
git push origin main
```

Vercel will automatically deploy when you push to `main` branch.

### Option B: Manual Deployment

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy to production
cd frontend
vercel --prod
```

### Verify Deployment

1. Check Vercel dashboard: https://vercel.com/dashboard
2. Verify production URL: https://talent-platform.vercel.app
3. Test homepage loads correctly
4. Verify all static assets load

**Expected Result**: Frontend accessible at production URL

---

## Step 2: Verify Database Connection (2 minutes)

### Check Supabase Project

1. Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa
2. Navigate to: **SQL Editor**
3. Run verification query:

```sql
-- Verify production URLs are set
SELECT key, value FROM app_config
WHERE key IN ('frontend_url', 'admin_dashboard_url', 'backend_api_url');

-- Expected output:
-- frontend_url | https://talent-platform.vercel.app
-- admin_dashboard_url | https://talent-platform.vercel.app/admin
-- backend_api_url | https://talent-platform.vercel.app/api
```

4. Verify storage bucket exists:
   - Navigate to: **Storage**
   - Confirm `resumes` bucket exists
   - Check policies: 4 policies should be active

**Expected Result**: All URLs point to production domain, bucket configured

---

## Step 3: Test Critical User Flows (15 minutes)

### Test 1: Lead Submission (2 minutes)

1. Navigate to: https://talent-platform.vercel.app
2. Click "Comenzar Solicitud"
3. Fill out lead form with test data
4. Submit form
5. Verify success message appears

**Expected**: Lead saved in database, success confirmation shown

**Verify in Database**:
```sql
SELECT id, full_name, email, company_name, status, created_at
FROM leads
ORDER BY created_at DESC
LIMIT 5;
```

### Test 2: Admin Login (2 minutes)

1. Navigate to: https://talent-platform.vercel.app/admin/login
2. Enter email: `huayaney.exe@gmail.com`
3. Enter password: (your admin password)
4. Click "Iniciar Sesión"
5. Verify admin dashboard loads

**Expected**: Successful login, redirect to admin dashboard

### Test 3: Client Magic Link (3 minutes)

**⚠️ Requires approved client in database**

1. Approve a lead as admin (or use existing client)
2. Check email for magic link
3. Click magic link
4. Verify authentication works
5. Access client dashboard

**Expected**: Magic link works, client authenticated, dashboard accessible

### Test 4: Position Creation Flow (5 minutes)

**⚠️ Requires authenticated client**

1. Login as client
2. Click "Create New Position"
3. Fill out HR form
4. Submit form
5. Verify success and email trigger

**Verify Email Queued**:
```sql
SELECT email_type, recipient_email, subject_line, sent_at
FROM email_communications
ORDER BY sent_at DESC
LIMIT 5;
```

**Expected**: Position created, email record in database

### Test 5: File Upload (3 minutes)

1. Navigate to job listing (public)
2. Fill out application form
3. Upload resume (PDF)
4. Submit application
5. Verify file uploaded to storage

**Verify in Database**:
```sql
SELECT full_name, email, resume_url, status
FROM applicants
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: Resume URL stored, file accessible via public URL

---

## Step 4: Monitor Error Logs (Continuous)

### Vercel Logs

1. Go to: Vercel Dashboard → Project → Logs
2. Monitor for errors in real-time
3. Check for:
   - 404 errors (missing routes)
   - 500 errors (server errors)
   - API call failures
   - Authentication issues

### Supabase Logs

1. Go to: Supabase Dashboard → Logs
2. Check tabs:
   - **Postgres Logs**: Database errors
   - **API Logs**: REST API calls
   - **Auth Logs**: Authentication events
3. Monitor for:
   - RLS policy violations
   - Query errors
   - Failed authentications

### Browser Console

1. Open production site in browser
2. Open Developer Tools (F12)
3. Check Console tab for:
   - JavaScript errors
   - API call failures
   - CORS issues
   - Network errors

**Action**: Fix any errors that appear, redeploy if needed

---

## Step 5: Verify Email Delivery (As emails trigger)

### Check Email Records

```sql
-- Check all recent emails
SELECT
  email_type,
  recipient_email,
  subject_line,
  sent_at,
  delivered_at,
  opened_at
FROM email_communications
WHERE sent_at > NOW() - INTERVAL '24 hours'
ORDER BY sent_at DESC;
```

### Test Email URLs

When you receive an email:
1. Click all links in the email
2. Verify URLs point to production domain
3. Confirm links work correctly
4. Check form pre-population (for business forms)

**Expected**: All email URLs use `https://talent-platform.vercel.app`

---

## Step 6: Validate Key Metrics (24 hours)

### Position Creation Rate

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as positions_created,
  COUNT(CASE WHEN workflow_stage = 'published' THEN 1 END) as published
FROM positions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE(created_at);
```

### Application Submission Rate

```sql
SELECT
  DATE(applied_at) as date,
  COUNT(*) as applications,
  COUNT(DISTINCT applicant_id) as unique_applicants
FROM applicants
WHERE applied_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE(applied_at);
```

### Email Delivery Rate

```sql
SELECT
  email_type,
  COUNT(*) as sent,
  COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END) as delivered,
  ROUND(COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as delivery_rate
FROM email_communications
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY email_type;
```

### Lead Conversion Rate

```sql
SELECT
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
  ROUND(COUNT(CASE WHEN status = 'converted' THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as conversion_rate
FROM leads
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Target Metrics**:
- Position creation: >0 per day
- Application rate: >0 per published position
- Email delivery: >95%
- Lead conversion: Track baseline for 7 days

---

## Step 7: Performance Monitoring (Ongoing)

### Response Time Monitoring

1. Use Vercel Analytics for page load times
2. Monitor Supabase query performance
3. Check file upload speeds

**Target**: <3 seconds page load, <1 second API responses

### Resource Usage

1. Check Vercel bandwidth usage
2. Monitor Supabase database size
3. Track storage bucket size

**Limits**:
- Vercel: 100GB bandwidth/month (free tier)
- Supabase: 500MB database (free tier)
- Storage: 1GB files (free tier)

---

## Troubleshooting Guide

### Issue: 404 on Routes

**Symptom**: Some pages show "Page not found"
**Cause**: Vercel routing not configured
**Fix**: Check `vercel.json` has correct rewrites

### Issue: Authentication Fails

**Symptom**: Login doesn't work, magic links don't authenticate
**Cause**: Supabase URL or keys incorrect
**Fix**: Verify `.env.production` has correct Supabase credentials

### Issue: Email URLs Point to Localhost

**Symptom**: Emails contain `http://localhost:3000` links
**Cause**: Database `app_config` not updated
**Fix**: Run `UPDATE_PRODUCTION_URLS.sql` again

### Issue: File Upload Fails

**Symptom**: Resume upload shows error
**Cause**: Storage policies not configured
**Fix**: Verify 4 RLS policies exist in Supabase Storage UI

### Issue: RLS Policy Violations

**Symptom**: Database queries fail with "policy violation"
**Cause**: User doesn't have permission
**Fix**: Review RLS policies in Supabase, check user roles

---

## Rollback Procedure (Emergency)

If critical issues appear in production:

### Option 1: Quick Rollback (Vercel)

1. Go to: Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Time**: <2 minutes

### Option 2: Database Rollback

⚠️ **CAUTION**: Only if database is corrupted

1. Go to: Supabase Dashboard → Database → Backups
2. Select recent backup (daily backups available)
3. Restore from backup

**Time**: 5-10 minutes
**Impact**: Data loss since backup

### Option 3: Full Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout previous version
git checkout <previous-commit-hash>
git push origin main --force
```

**Time**: 5 minutes

---

## Post-Deployment Tasks

### Day 1: Intensive Monitoring
- [ ] Check error logs every hour
- [ ] Verify all email deliveries
- [ ] Test all critical flows manually
- [ ] Monitor performance metrics
- [ ] Respond to user feedback immediately

### Day 2-7: Active Monitoring
- [ ] Check error logs twice daily
- [ ] Review key metrics daily
- [ ] Test email delivery daily
- [ ] Monitor performance trends
- [ ] Collect user feedback

### Week 2+: Steady State
- [ ] Weekly error log review
- [ ] Weekly metrics review
- [ ] Monthly performance optimization
- [ ] Quarterly security audit

---

## Success Criteria

Production deployment is successful when:

- [x] Frontend accessible at production URL
- [x] All 7 critical flows work end-to-end
- [ ] Email delivery rate >95%
- [ ] Page load times <3 seconds
- [ ] Zero critical errors in logs
- [ ] User authentication works reliably
- [ ] File uploads work consistently
- [ ] Database queries perform well

**When to celebrate**: After 24 hours with no critical issues 🎉

---

## Support Contacts

### Technical Issues
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/dashboard/support

### Service Status
- **Vercel Status**: https://www.vercel-status.com/
- **Supabase Status**: https://status.supabase.com/

### Emergency Contacts
- Primary: Luis Huayaney (huayaney.exe@gmail.com)

---

## Next Steps After Deployment

1. **Marketing Launch**: Announce to target audience
2. **User Onboarding**: Prepare client onboarding materials
3. **Analytics Setup**: Configure Google Analytics or similar
4. **Error Monitoring**: Set up Sentry or similar
5. **Performance**: Optimize based on real usage data
6. **Features**: Prioritize next features based on user feedback

---

**Last Updated**: 2025-10-22
**Next Review**: After 7 days of production usage
**Document Owner**: Luis Huayaney
