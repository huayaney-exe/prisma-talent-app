# Position Creation Workflow - Complete Documentation

## Workflow Stages Overview

```
hr_draft
  ↓ (HR submits form)
hr_completed
  ↓ (Trigger: Auto-notify business leader)
leader_notified
  ↓ (Business leader opens form)
leader_in_progress
  ↓ (Business leader submits)
leader_completed
  ↓ (Admin generates JD)
job_desc_generated
  ↓ (HR validates)
validation_pending
  ↓ (Approved)
validated
  ↓ (JD published)
active
  ↓ (Candidate hired)
filled / cancelled
```

---

## Step-by-Step Workflow

### STEP 1: HR Business Partner Creates Position ✅

**Who**: Client HR Business Partner (logged in)
**Where**: `/hr-form`
**Action**: Fills out HR Form with position details

**What happens**:
1. Client logs in → sees company banner on form
2. Fills out:
   - Position name, area, seniority
   - Business leader info (name, email, position)
   - Compensation (salary range, equity)
   - Contract details (type, target date)
   - Notes
3. Submits form

**Database changes**:
```sql
-- New position created
INSERT INTO positions (
  company_id,           -- Auto-filled from client
  workflow_stage,       -- 'hr_completed'
  position_name,
  area,
  seniority,
  leader_name,
  leader_email,
  leader_position,
  salary_range,
  equity_included,
  contract_type,
  timeline,
  position_type,
  critical_notes,
  hr_completed_at,      -- NOW()
  created_by            -- HR user ID
)
```

**Current code**:
- File: [HRForm.tsx:112](frontend/src/components/forms/HRForm.tsx#L112)
- Service: [positionService.ts:16](frontend/src/services/positionService.ts#L16)

**Status**: ✅ WORKING (as of commit b0fd7ff)

---

### STEP 2: Auto-Notify Business Leader 🔔

**What happens automatically**:
1. Database trigger fires on `workflow_stage = 'hr_completed'`
2. Creates email record in `email_communications` table
3. Updates workflow to `leader_notified`
4. Sets `leader_notified_at` timestamp

**Database trigger**:
```sql
-- Trigger: notify_business_user_on_hr_completion()
-- File: 007_triggers.sql:13-52

-- Creates email notification
INSERT INTO email_communications (
  company_id,
  position_id,
  email_type: 'leader_form_request',
  recipient_email: leader_email,
  recipient_name: leader_name,
  subject_line: 'Nueva apertura en [Company] - Tu input es requerido',
  template_used: 'business_user_request'
)

-- Updates position
NEW.workflow_stage := 'leader_notified'
NEW.leader_notified_at := NOW()
```

**Email table structure**:
- `email_communications` table stores notification
- `sent_at` = NULL initially (pending actual send)
- Backend service should poll this table and send via email provider

**Status**: ⚠️ TRIGGER EXISTS, EMAIL SENDING NOT IMPLEMENTED

---

### STEP 3: Business Leader Receives Email & Opens Form 📧

**What should happen**:
1. Business leader receives email with magic link
2. Email contains: `https://yourdomain.com/business-form?code=[POSITION_CODE]`
3. Leader clicks link
4. Opens pre-filled form with position context

**Business Leader Form**:
- File: [BusinessLeaderForm.tsx](frontend/src/components/forms/BusinessLeaderForm.tsx)
- Route: `/business-form?code=XXX`

**Form content**:
- Universal fields (work arrangement, team size, autonomy, KPIs)
- Area-specific questions (different per Product/Engineering/Growth/Design)
- Success criteria and metrics

**Database changes on form access**:
```sql
UPDATE positions
SET workflow_stage = 'leader_in_progress'
WHERE position_code = 'XXX'
AND workflow_stage = 'leader_notified'
```

**Status**: ✅ FORM EXISTS, ⚠️ EMAIL SENDING NOT IMPLEMENTED

---

### STEP 4: Business Leader Submits Specifications ✅

**What happens**:
1. Business leader completes form
2. Submits specifications

**Database changes**:
```sql
UPDATE positions
SET
  workflow_stage = 'leader_completed',
  leader_completed_at = NOW(),
  work_arrangement = '...',
  team_size = X,
  autonomy_level = '...',
  success_kpi = '...',
  area_specific_data = {...}  -- JSONB with area-specific answers
WHERE position_code = 'XXX'
```

**Trigger fires automatically**:
```sql
-- Trigger: notify_hr_on_business_completion()
-- File: 007_triggers.sql:58-104

-- Notifies HR user who created position
INSERT INTO email_communications (
  email_type: 'job_description_validation',
  recipient_email: hr_user_email,
  subject_line: 'Especificaciones completadas para [Position Name]'
)
```

**Current code**:
- Service: [positionService.ts](frontend/src/services/positionService.ts) (needs update method)

**Status**: ✅ FORM EXISTS, ⚠️ UPDATE SERVICE NOT FULLY TESTED

---

### STEP 5: Prisma Admin Reviews & Generates JD 🤖

**Who**: Prisma Admin
**Where**: `/admin/positions` (Position Pipeline Page)

**What happens**:
1. Admin sees position with `leader_completed` status
2. Reviews HR form data + Business leader specifications
3. Clicks "Generate JD" button
4. AI generates job description based on all collected data

**Database changes**:
```sql
-- Create new JD
INSERT INTO job_descriptions (
  company_id,
  position_id,
  generated_content,      -- AI-generated JD text
  generation_prompt,      -- Prompt used
  generation_model,       -- 'gpt-4'
  version_number: 1,
  is_current_version: TRUE,
  created_by              -- Admin user ID
)

-- Update position
UPDATE positions
SET workflow_stage = 'job_desc_generated'
WHERE id = position_id
```

**Admin interface needed**:
- View position details (HR + Leader data)
- "Generate JD" button
- AI prompt configuration
- Preview generated JD
- Edit/refine JD
- Save JD

**Current code**:
- Page: [PositionPipelinePage.tsx](frontend/src/pages/admin/PositionPipelinePage.tsx)
- Missing: JD generation UI, AI service integration

**Status**: ⚠️ PAGE EXISTS, JD GENERATION NOT IMPLEMENTED

---

### STEP 6: HR Business Partner Validates JD ✅

**Who**: HR Business Partner (original creator)
**Where**: Email notification → Validation page

**What happens**:
1. HR receives email: "JD generated for [Position Name]"
2. Clicks link to review
3. Sees generated JD
4. Can approve or request changes

**Database changes**:
```sql
-- If approved
UPDATE job_descriptions
SET
  hr_approved = TRUE,
  hr_approved_at = NOW(),
  hr_feedback = 'Approved' (or comments)
WHERE position_id = XXX

UPDATE positions
SET workflow_stage = 'validation_pending'
WHERE id = position_id
```

**UI needed**:
- JD preview page
- Approve/Reject buttons
- Feedback text area
- Email notification when HR approves

**Status**: ⚠️ NOT IMPLEMENTED

---

### STEP 7: Position Goes Live 🚀

**Who**: Prisma Admin (after HR validation)
**Where**: `/admin/positions`

**What happens**:
1. Admin sees HR has approved
2. Clicks "Publish" button
3. Position becomes active with public application page

**Database changes**:
```sql
-- Update JD status
UPDATE job_descriptions
SET
  status = 'published',
  published_at = NOW(),
  final_approved_at = NOW()
WHERE position_id = XXX

-- Trigger automatically updates position
-- Trigger: update_position_on_jd_publish()
UPDATE positions
SET workflow_stage = 'active'
WHERE id = position_id
```

**Public page created**:
- URL: `/job/[POSITION_CODE]` (public, no auth)
- Shows: Position details, JD, company info, apply button
- Apply button → `/apply/[POSITION_CODE]`

**Current code**:
- Public job page: [JobListingPage.tsx](frontend/src/pages/JobListingPage.tsx)
- Application form: [ApplicationFormPage.tsx](frontend/src/pages/ApplicationFormPage.tsx)

**Status**: ✅ PAGES EXIST, ⚠️ PUBLISH WORKFLOW NOT COMPLETE

---

### STEP 8: Candidates Apply 📄

**Who**: Public candidates
**Where**: `/apply/[POSITION_CODE]`

**What happens**:
1. Candidate finds job posting
2. Fills out application form
3. Uploads resume/portfolio
4. Submits application

**Database changes**:
```sql
INSERT INTO applicants (
  company_id,
  position_id,
  full_name,
  email,
  phone,
  linkedin_url,
  portfolio_url,
  cover_letter,
  resume_url,
  application_status: 'applied',
  source_type: 'direct_application'
)

-- Trigger fires: send_applicant_confirmation()
INSERT INTO email_communications (
  email_type: 'applicant_status_update',
  recipient_email: applicant_email,
  subject_line: 'Aplicación recibida: [Position] en [Company]'
)
```

**Current code**:
- Form: [ApplicationForm.tsx](frontend/src/components/forms/ApplicationForm.tsx)

**Status**: ✅ FORM EXISTS

---

## Current Implementation Status

### ✅ COMPLETE
1. HR Form with client auto-fill
2. Position creation with company linking
3. Business Leader Form (UI exists)
4. Database triggers for workflow automation
5. Public job listing pages
6. Application form

### ⚠️ PARTIALLY COMPLETE
1. Position Pipeline Page (exists but lacks JD generation UI)
2. Business Leader Form submission (needs testing)
3. Email notifications (triggers exist, sending not implemented)

### ❌ NOT IMPLEMENTED
1. **Email sending service** (critical for workflow)
2. **JD generation UI** (admin interface)
3. **JD validation page** (HR approval interface)
4. **Publish workflow** (admin publishes after HR approval)
5. **Admin position detail view** (see all HR + Leader data)

---

## Priority Implementation Order

### Phase 1: Critical Path (Blocking MVP)
1. **Email Service Integration** 🔴
   - Integrate email provider (SendGrid/Resend/Postmark)
   - Poll `email_communications` table
   - Send actual emails
   - Update `sent_at` timestamp

2. **Admin Position Detail View** 🔴
   - See all HR form data
   - See all Business Leader data
   - View position history
   - Access from Position Pipeline

3. **JD Generation Service** 🔴
   - AI prompt template
   - Call OpenAI/Anthropic API
   - Save generated JD
   - Admin can edit before saving

### Phase 2: Validation & Publishing
4. **JD Validation Page** 🟡
   - HR receives email with link
   - HR reviews generated JD
   - HR approves or requests changes
   - Feedback loop to admin

5. **Publish Workflow** 🟡
   - Admin sees HR approval
   - Admin clicks "Publish"
   - Position goes live
   - Public page becomes accessible

### Phase 3: Polish & Testing
6. **End-to-End Testing** 🟢
7. **Email Template Design** 🟢
8. **Error Handling** 🟢

---

## Testing Checklist

### Manual Testing Steps

#### Test 1: HR → Business Leader
- [ ] Client logs in
- [ ] Creates position via HR Form
- [ ] Check database: `workflow_stage = 'leader_notified'`
- [ ] Check `email_communications` table has record
- [ ] Manually send email or test form link
- [ ] Business leader accesses form via `/business-form?code=XXX`
- [ ] Business leader submits form
- [ ] Check database: `workflow_stage = 'leader_completed'`

#### Test 2: Admin JD Generation
- [ ] Admin logs in
- [ ] Goes to Position Pipeline
- [ ] Sees position with `leader_completed` status
- [ ] Clicks to view full details
- [ ] Sees HR + Leader data combined
- [ ] Clicks "Generate JD"
- [ ] AI generates JD
- [ ] Admin reviews and edits
- [ ] Saves JD
- [ ] Check database: `job_descriptions` table has record
- [ ] Check: `workflow_stage = 'job_desc_generated'`

#### Test 3: HR Validation
- [ ] HR receives email notification
- [ ] Clicks link to review JD
- [ ] Sees generated JD text
- [ ] Approves JD
- [ ] Check database: `hr_approved = TRUE`
- [ ] Check: `workflow_stage = 'validation_pending'`

#### Test 4: Publish & Apply
- [ ] Admin sees HR approval
- [ ] Clicks "Publish"
- [ ] Check database: JD `status = 'published'`
- [ ] Check: position `workflow_stage = 'active'`
- [ ] Open public job page: `/job/[CODE]`
- [ ] See full JD and apply button
- [ ] Click "Apply"
- [ ] Fill out application
- [ ] Submit
- [ ] Check database: `applicants` table has record
- [ ] Candidate receives confirmation email

---

## Database Verification Queries

### Check Position Workflow
```sql
SELECT
  p.position_code,
  p.position_name,
  p.workflow_stage,
  p.hr_completed_at,
  p.leader_notified_at,
  p.leader_completed_at,
  c.company_name
FROM positions p
JOIN companies c ON p.company_id = c.id
ORDER BY p.created_at DESC
LIMIT 10;
```

### Check Email Notifications
```sql
SELECT
  ec.email_type,
  ec.recipient_email,
  ec.subject_line,
  ec.sent_at,
  ec.created_at,
  p.position_name
FROM email_communications ec
LEFT JOIN positions p ON ec.position_id = p.id
ORDER BY ec.created_at DESC
LIMIT 10;
```

### Check JD Status
```sql
SELECT
  jd.id,
  p.position_code,
  p.position_name,
  jd.hr_approved,
  jd.leader_approved,
  jd.status,
  jd.published_at
FROM job_descriptions jd
JOIN positions p ON jd.position_id = p.id
ORDER BY jd.created_at DESC;
```

---

## Next Actions

1. **Verify current frontend build** - Check if all pages compile
2. **Test HR Form → Position Creation** - End-to-end manual test
3. **Test Business Leader Form** - Can it be accessed and submitted?
4. **Implement email service** - Critical blocker for automation
5. **Build admin JD generation UI** - Required for workflow completion

