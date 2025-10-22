# Database Workflow & Trigger Testing Guide

## Purpose
Verify that database triggers fire correctly with the new `app_config` system and that workflow stage transitions work as expected.

## Pre-Test Setup

### 1. Verify app_config is Set Correctly
Run in Supabase SQL Editor:
```sql
-- Check current config
SELECT * FROM app_config;

-- Expected output for development:
-- key                  | value                         | description
-- -------------------- | ----------------------------- | ---------------------------
-- frontend_url         | http://localhost:3000         | Base frontend URL for email links
-- admin_dashboard_url  | http://localhost:3000/admin   | Admin dashboard base URL
```

### 2. Check Existing Test Data
```sql
-- Find test companies and positions
SELECT
  c.id as company_id,
  c.company_name,
  p.id as position_id,
  p.position_name,
  p.position_code,
  p.workflow_stage,
  p.created_at
FROM companies c
LEFT JOIN positions p ON p.company_id = c.id
ORDER BY c.created_at DESC
LIMIT 5;
```

## Test 1: Trigger - Business Leader Notification (hr_completed → leader_notified)

### Test Scenario
When HR completes a position form, trigger should:
1. ✅ Fire automatically
2. ✅ Create email_communications record
3. ✅ Use `app_config` for form_url (should be localhost:3000)
4. ✅ Update workflow_stage to 'leader_notified'

### Test Steps

**Step 1: Create or identify a position in 'hr_draft' state**
```sql
-- Option A: Find existing hr_draft position
SELECT id, position_name, workflow_stage
FROM positions
WHERE workflow_stage = 'hr_draft'
LIMIT 1;

-- Option B: Create new test position (if none exist)
-- Use the admin UI at http://localhost:3000/admin/clients/new
```

**Step 2: Simulate HR completing the form**
```sql
-- Replace {position_id} with actual position ID
UPDATE positions
SET workflow_stage = 'hr_completed'
WHERE id = '{position_id}';
```

**Step 3: Verify trigger fired correctly**
```sql
-- Check workflow stage updated
SELECT id, position_name, workflow_stage, leader_notified_at
FROM positions
WHERE id = '{position_id}';
-- Expected: workflow_stage = 'leader_notified', leader_notified_at = current timestamp

-- Check email was created
SELECT
  email_type,
  recipient_email,
  recipient_name,
  subject_line,
  template_data->>'form_url' as form_url,
  template_data->>'leader_name' as leader_name,
  template_data->>'position_name' as position_name,
  created_at
FROM email_communications
WHERE position_id = '{position_id}'
  AND email_type = 'leader_form_request'
ORDER BY created_at DESC
LIMIT 1;

-- ✅ PASS if:
-- - email_communications record exists
-- - form_url starts with 'http://localhost:3000/business-form?code='
-- - recipient_email matches position.leader_email
-- - template_data has all required fields
```

### Expected Results
```
✅ workflow_stage changed: hr_draft → leader_notified
✅ leader_notified_at set to current timestamp
✅ email_communications record created
✅ form_url = http://localhost:3000/business-form?code={position_code}
✅ All template_data fields populated
```

## Test 2: Trigger - HR Notification (leader_completed → job_desc_generated)

### Test Scenario
When Business Leader completes specs, trigger should:
1. ✅ Fire automatically
2. ✅ Create email_communications record for HR
3. ✅ Use `app_config` for admin_url (should be localhost:3000/admin)
4. ✅ Set leader_completed_at timestamp

### Test Steps

**Step 1: Find or create position in 'leader_notified' state**
```sql
-- Find existing position
SELECT id, position_name, workflow_stage
FROM positions
WHERE workflow_stage IN ('leader_notified', 'leader_in_progress')
LIMIT 1;

-- Or use the position from Test 1
```

**Step 2: Simulate Business Leader completing specs**
```sql
-- Replace {position_id} with actual position ID
UPDATE positions
SET workflow_stage = 'leader_completed'
WHERE id = '{position_id}';
```

**Step 3: Verify trigger fired correctly**
```sql
-- Check timestamp set
SELECT id, position_name, workflow_stage, leader_completed_at
FROM positions
WHERE id = '{position_id}';
-- Expected: leader_completed_at = current timestamp

-- Check HR notification email was created
SELECT
  email_type,
  recipient_email,
  recipient_name,
  subject_line,
  template_data->>'admin_url' as admin_url,
  template_data->>'hr_name' as hr_name,
  template_data->>'leader_name' as leader_name,
  created_at
FROM email_communications
WHERE position_id = '{position_id}'
  AND email_type = 'job_description_validation'
ORDER BY created_at DESC
LIMIT 1;

-- ✅ PASS if:
-- - email_communications record exists
-- - admin_url = 'http://localhost:3000/admin/positions/{position_id}'
-- - recipient_email is the HR user who created the position
-- - template_data has all required fields
```

### Expected Results
```
✅ leader_completed_at timestamp set
✅ email_communications record created for HR
✅ admin_url = http://localhost:3000/admin/positions/{position_id}
✅ All template_data fields populated
```

## Test 3: Trigger - Applicant Confirmation Email

### Test Scenario
When new applicant applies, trigger should:
1. ✅ Fire automatically on INSERT
2. ✅ Create email_communications record
3. ✅ Include position and company details

### Test Steps

**Step 1: Find an active position**
```sql
SELECT id, position_name, company_id, position_code
FROM positions
WHERE workflow_stage = 'active'
LIMIT 1;
```

**Step 2: Insert test applicant**
```sql
-- Replace values with actual position_id and company_id
INSERT INTO applicants (
  position_id,
  company_id,
  full_name,
  email,
  phone,
  linkedin_url,
  resume_url,
  application_status
) VALUES (
  '{position_id}',
  '{company_id}',
  'Test Applicant',
  'test.applicant@example.com',
  '+51999999999',
  'https://linkedin.com/in/test',
  'https://example.com/resume.pdf',
  'applied'
) RETURNING id;
```

**Step 3: Verify trigger fired**
```sql
-- Check confirmation email was created
SELECT
  email_type,
  recipient_email,
  recipient_name,
  subject_line,
  template_data->>'applicant_name' as applicant_name,
  template_data->>'position_name' as position_name,
  template_data->>'company_name' as company_name,
  created_at
FROM email_communications
WHERE applicant_id = '{applicant_id}'
  AND email_type = 'applicant_status_update'
ORDER BY created_at DESC
LIMIT 1;

-- ✅ PASS if:
-- - email_communications record exists
-- - recipient_email = test.applicant@example.com
-- - All template_data fields populated
```

### Expected Results
```
✅ email_communications record created
✅ recipient_email matches applicant email
✅ template_data includes position_name, company_name, position_code
```

## Test 4: Workflow Stage Transitions

### Valid Workflow Progression
```
hr_draft
  → hr_completed (auto becomes leader_notified via trigger)
    → leader_in_progress
      → leader_completed
        → job_desc_generated
          → validation_pending
            → active
              → closed
```

### Test Each Transition
```sql
-- Start fresh with new position
-- Use admin UI to create: http://localhost:3000/admin/clients/new

-- Test transition 1: hr_draft → hr_completed
UPDATE positions SET workflow_stage = 'hr_completed' WHERE id = '{id}';
-- Expected: Auto-updates to 'leader_notified' via trigger

-- Test transition 2: leader_notified → leader_in_progress
UPDATE positions SET workflow_stage = 'leader_in_progress' WHERE id = '{id}';
-- Expected: Updates successfully

-- Test transition 3: leader_in_progress → leader_completed
UPDATE positions SET workflow_stage = 'leader_completed' WHERE id = '{id}';
-- Expected: Updates successfully, trigger fires HR notification

-- Test transition 4: leader_completed → job_desc_generated
-- This should be done via admin UI generating JD

-- Test transition 5: job_desc_generated → validation_pending
-- This happens when admin marks JD as ready

-- Test transition 6: validation_pending → active
-- This happens when HR approves JD

-- Test transition 7: active → closed
UPDATE positions SET workflow_stage = 'closed' WHERE id = '{id}';
-- Expected: Updates successfully
```

## Test 5: Email Worker Processing

### Verify Email Worker Picks Up Pending Emails
```sql
-- Check pending emails
SELECT
  id,
  email_type,
  recipient_email,
  subject_line,
  status,
  sent_at,
  created_at
FROM email_communications
WHERE sent_at IS NULL
  AND status = 'pending'
ORDER BY created_at DESC;
```

### Monitor Backend Logs
```bash
# Check backend logs for email worker
# Should see:
# INFO: ✅ Email worker: Processing pending emails...
# INFO: ✅ Email sent successfully: {email_id}
```

## Pass/Fail Criteria

### ✅ ALL TESTS PASS IF:
1. All triggers fire automatically on workflow_stage changes
2. Email records created with correct template_data
3. URLs in template_data use localhost:3000 (from app_config)
4. Workflow stage transitions follow valid progression
5. Timestamps (leader_notified_at, leader_completed_at) are set correctly
6. Email worker processes pending emails successfully

### ❌ FAIL IF:
1. Triggers don't fire (no email_communications record created)
2. URLs still show hardcoded production values
3. template_data missing required fields
4. Workflow transitions fail or skip stages
5. Timestamps not set correctly

## Rollback Test Data
```sql
-- Clean up test applicants
DELETE FROM applicants WHERE email = 'test.applicant@example.com';

-- Reset test position workflow
UPDATE positions
SET workflow_stage = 'hr_draft',
    leader_notified_at = NULL,
    leader_completed_at = NULL
WHERE id = '{position_id}';

-- Delete test email communications
DELETE FROM email_communications
WHERE position_id = '{position_id}';
```

## Production Migration Checklist

When deploying to production:
```sql
-- Update app_config for production URLs
UPDATE app_config SET value = 'https://talent.prisma.pe' WHERE key = 'frontend_url';
UPDATE app_config SET value = 'https://talent.prisma.pe/admin' WHERE key = 'admin_dashboard_url';

-- Verify production config
SELECT * FROM app_config;
```
