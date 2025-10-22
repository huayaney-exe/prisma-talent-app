# Production Implementation Checklist - TDD Approach

**Last Updated**: 2025-10-20
**Status**: Pre-Production
**Methodology**: Test-Driven Development (Red → Green → Refactor)

---

## Philosophy: Test-First Implementation

For each phase:
1. **RED**: Write the test/verification step first (defines success criteria)
2. **GREEN**: Implement the minimum code to pass the test
3. **REFACTOR**: Clean up and optimize
4. **VERIFY**: Run the test again to confirm it still passes

---

## PHASE 1: CRITICAL INFRASTRUCTURE (BLOCKING DEPLOYMENT)

**Estimated Time**: 2-3 hours
**Goal**: Remove all hardcoded values and make system environment-aware

### 1.1 Environment Configuration Setup

**Test First** (What should work):
```bash
# After this step, these commands should show production-ready values:
grep -r "localhost" frontend/.env.production  # Should return NOTHING
grep -r "localhost" backend/.env.production   # Should return NOTHING
```

**Implementation**:

- [ ] **1.1.1** Create `frontend/.env.production` with production values
  ```bash
  VITE_SUPABASE_URL=https://vhjjibfblrkyfzcukqwa.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  VITE_APP_NAME=Prisma Talent
  VITE_APP_URL=https://YOUR_VERCEL_DOMAIN.vercel.app
  VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN/api/v1
  ```

- [ ] **1.1.2** Update `frontend/.env.example` to match all required vars
  ```bash
  # Copy all keys from .env but with placeholder values
  cp frontend/.env frontend/.env.example
  # Manually replace real values with placeholders
  ```

- [ ] **1.1.3** Create `backend/.env.production` with production values
  ```bash
  ENVIRONMENT=production
  DEBUG=false
  ALLOWED_ORIGINS=https://YOUR_VERCEL_DOMAIN.vercel.app
  FRONTEND_URL=https://YOUR_VERCEL_DOMAIN.vercel.app
  ADMIN_DASHBOARD_URL=https://YOUR_VERCEL_DOMAIN.vercel.app/admin
  CLIENT_PORTAL_URL=https://YOUR_VERCEL_DOMAIN.vercel.app/client/dashboard
  JWT_SECRET=<GENERATE_NEW_SECRET>  # openssl rand -hex 32
  RESEND_API_KEY=<YOUR_KEY>
  FROM_EMAIL=hello@getprisma.io
  ```

- [ ] **1.1.4** Add `.env.production` to `.gitignore` (verify it's excluded)
  ```bash
  # Test:
  git status | grep ".env.production"  # Should show nothing
  ```

**Verification Test**:
```bash
# Should pass:
test -f frontend/.env.production && echo "✅ Frontend prod env exists" || echo "❌ MISSING"
test -f backend/.env.production && echo "✅ Backend prod env exists" || echo "❌ MISSING"
grep -q "VITE_APP_URL" frontend/.env.production && echo "✅ Has APP_URL" || echo "❌ MISSING"
grep -q "FRONTEND_URL" backend/.env.production && echo "✅ Has FRONTEND_URL" || echo "❌ MISSING"
! grep -q "localhost" frontend/.env.production && echo "✅ No localhost" || echo "❌ HAS LOCALHOST"
```

---

### 1.2 Remove Hardcoded URLs in Frontend

**Test First**:
```typescript
// After this step, this test should pass:
describe('URL Configuration', () => {
  it('should use environment variable for app URL', () => {
    expect(import.meta.env.VITE_APP_URL).toBeDefined()
    expect(import.meta.env.VITE_APP_URL).not.toContain('localhost')
  })
})
```

**Implementation**:

- [ ] **1.2.1** Fix `frontend/src/services/clientService.ts` magic link redirect
  ```typescript
  // BEFORE (Line 203):
  redirectTo: `${window.location.origin}/client/dashboard`

  // AFTER:
  redirectTo: `${import.meta.env.VITE_APP_URL}/client/dashboard`
  ```

- [ ] **1.2.2** Fix `frontend/src/services/leadService.ts` magic link redirect
  ```typescript
  // BEFORE (Line 184):
  redirectTo: `${window.location.origin}/client/dashboard`

  // AFTER:
  redirectTo: `${import.meta.env.VITE_APP_URL}/client/dashboard`
  ```

- [ ] **1.2.3** Add fallback for undefined env var in `frontend/src/lib/api.ts`
  ```typescript
  // BEFORE (Line 11):
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

  // AFTER:
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL environment variable is required')
  }
  ```

- [ ] **1.2.4** Update `frontend/vite.config.ts` to be environment-aware
  ```typescript
  // BEFORE:
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  }

  // AFTER (proxy only in development):
  ...(process.env.NODE_ENV === 'development' ? {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    }
  } : {}),
  ```

**Verification Test**:
```bash
# Search for hardcoded localhost or window.location.origin
grep -r "window.location.origin" frontend/src/ | grep -v "node_modules"
# Should only show comments or documentation, not actual code

# Verify env var usage
grep -r "import.meta.env.VITE_APP_URL" frontend/src/services/
# Should show clientService.ts and leadService.ts
```

---

### 1.3 Remove Hardcoded URLs in Backend

**Test First**:
```python
# After this step, config should load from environment
def test_config_uses_environment():
    settings = Settings()
    assert settings.frontend_url != "https://talent.getprisma.io"  # Should come from env
    assert "localhost" not in settings.allowed_origins or settings.environment == "development"
```

**Implementation**:

- [ ] **1.3.1** Fix `backend/app/core/config.py` default values
  ```python
  # BEFORE (Lines 31, 62-64):
  allowed_origins: str = "http://localhost:3000,http://localhost:8000"
  frontend_url: str = "https://talent.getprisma.io"
  admin_dashboard_url: str = "https://talent.getprisma.io/admin"
  client_portal_url: str = "https://talent.getprisma.io/portal"

  # AFTER (remove defaults, make required):
  allowed_origins: str  # No default - must be set in .env
  frontend_url: str     # No default - must be set in .env
  admin_dashboard_url: str  # No default - must be set in .env
  client_portal_url: str    # No default - must be set in .env
  ```

- [ ] **1.3.2** Add validation to ensure required env vars are set
  ```python
  # Add to Settings class:
  def __init__(self, **kwargs):
      super().__init__(**kwargs)
      if self.is_production and "localhost" in self.allowed_origins:
          raise ValueError("Production environment cannot use localhost in ALLOWED_ORIGINS")
  ```

- [ ] **1.3.3** Update default email addresses to use env vars
  ```python
  # BEFORE (Lines 51-52):
  from_email: EmailStr = "hello@getprisma.io"
  reply_to_email: EmailStr = "hello@getprisma.io"

  # AFTER:
  from_email: EmailStr  # Required from env
  reply_to_email: EmailStr  # Required from env
  ```

**Verification Test**:
```bash
# Backend should fail to start without required env vars
cd backend
source venv/bin/activate

# Test 1: Missing env vars should fail
unset FRONTEND_URL && python -c "from app.core.config import settings" 2>&1 | grep -q "field required"
echo $?  # Should be 0 (grep found "field required")

# Test 2: With env vars should succeed
export FRONTEND_URL="https://test.com" && python -c "from app.core.config import settings; print(settings.frontend_url)"
# Should print: https://test.com
```

---

### 1.4 Email Template URL Verification

**Test First**:
```python
# Email templates should use config.frontend_url, not hardcoded
def test_email_templates_use_config():
    template = EmailTemplates.leader_form_request(...)
    assert "localhost" not in template
    assert settings.frontend_url in template
```

**Implementation**:

- [ ] **1.4.1** Audit `backend/app/services/email_templates.py`
  ```bash
  # Search for hardcoded URLs
  grep -n "https://" backend/app/services/email_templates.py
  grep -n "localhost" backend/app/services/email_templates.py
  ```

- [ ] **1.4.2** Replace any hardcoded URLs with `settings.frontend_url`
  ```python
  # Example fix:
  # BEFORE:
  form_url = f"https://talent.getprisma.io/business-form?code={position_code}"

  # AFTER:
  from app.core.config import settings
  form_url = f"{settings.frontend_url}/business-form?code={position_code}"
  ```

- [ ] **1.4.3** Verify all email template methods accept or use settings
  ```python
  # Each method should either:
  # 1. Accept frontend_url as parameter, or
  # 2. Import settings and use settings.frontend_url
  ```

**Verification Test**:
```bash
# No hardcoded URLs in email templates
grep -E "https?://[^\"']*talent\.getprisma\.io" backend/app/services/email_templates.py
# Should return nothing

grep -E "https?://localhost" backend/app/services/email_templates.py
# Should return nothing
```

---

## PHASE 2: DATABASE & WORKFLOW VERIFICATION

**Estimated Time**: 1-2 hours
**Goal**: Verify all database triggers and workflow transitions work correctly

### 2.1 Database Trigger Testing

**Test First**:
```sql
-- After HR form submission, email should be created
-- Test query to run after creating position:
SELECT COUNT(*) FROM email_communications
WHERE email_type = 'leader_form_request'
  AND position_id = '<NEW_POSITION_ID>';
-- Should return 1
```

**Implementation**:

- [ ] **2.1.1** Read and understand trigger file
  ```bash
  cat database/migrations/007_triggers.sql
  cat database/migrations/014_update_email_triggers.sql
  ```

- [ ] **2.1.2** Verify triggers exist in Supabase
  ```sql
  -- Run in Supabase SQL Editor:
  SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND event_object_table IN ('positions', 'job_descriptions')
  ORDER BY event_object_table, trigger_name;
  ```

- [ ] **2.1.3** Test HR form → Leader email trigger
  ```sql
  -- Create test position
  INSERT INTO positions (
    company_id, position_name, area, seniority,
    leader_name, leader_email, salary_range, contract_type,
    timeline, position_type, workflow_stage
  ) VALUES (
    '<EXISTING_COMPANY_ID>', 'Test PM Role', 'Product Management',
    'Senior 5-8 años', 'Test Leader', 'test@example.com',
    '$80k-$120k', 'Tiempo completo', CURRENT_DATE + 30,
    'Nueva posición', 'hr_completed'
  ) RETURNING id, position_code;

  -- Verify email was created
  SELECT email_type, recipient_email, subject_line, sent_at
  FROM email_communications
  WHERE position_id = '<RETURNED_ID>';
  -- Should show leader_form_request email
  ```

- [ ] **2.1.4** Test JD publication → Position active trigger
  ```sql
  -- Update job description to published
  UPDATE job_descriptions
  SET status = 'published', published_at = NOW()
  WHERE position_id = '<TEST_POSITION_ID>';

  -- Verify position workflow updated
  SELECT workflow_stage FROM positions WHERE id = '<TEST_POSITION_ID>';
  -- Should show 'active'
  ```

**Verification Test**:
```bash
# Backend email worker should process the test emails
# Check backend logs for:
tail -f backend_logs.txt | grep "📧 Processing.*pending emails"
# Should show emails being processed and sent
```

---

### 2.2 Workflow Stage Transitions

**Test First**:
```typescript
// Each workflow transition should be tested
describe('Position Workflow', () => {
  it('should progress from hr_draft to hr_completed', async () => {
    const position = await createTestPosition({ workflow_stage: 'hr_draft' })
    await submitHRForm(position.id)
    const updated = await getPosition(position.id)
    expect(updated.workflow_stage).toBe('hr_completed')
  })
})
```

**Implementation**:

- [ ] **2.2.1** Document expected workflow transitions
  ```markdown
  ## Position Workflow Stages

  1. `hr_draft` → User starts HR form (auto-created)
  2. `hr_completed` → HR submits form → **Trigger: Email to leader**
  3. `leader_notified` → Email sent (trigger updates this)
  4. `leader_in_progress` → Leader opens form
  5. `leader_completed` → Leader submits → **Trigger: Notify admin?**
  6. `job_desc_generated` → Admin creates JD
  7. `validation_pending` → Admin approves JD
  8. `validated` → Ready for publication
  9. `active` → Published → **Trigger: Update from JD publication**
  10. `filled` → Position closed (manual)
  11. `cancelled` → Position cancelled (manual)
  ```

- [ ] **2.2.2** Verify `jdService.createJobDescription()` sets correct stage
  ```typescript
  // In frontend/src/services/jdService.ts
  // After INSERT, should update position:
  await supabase
    .from('positions')
    .update({ workflow_stage: 'job_desc_generated' })
    .eq('id', positionId)
  ```

- [ ] **2.2.3** Verify `jdService.approveJD()` sets correct stage
  ```typescript
  // Should update to 'validation_pending' or 'validated'?
  // Currently sets 'validation_pending' - may need to change
  await supabase
    .from('positions')
    .update({ workflow_stage: 'validated' })  // Change from validation_pending
    .eq('id', data.position_id)
  ```

- [ ] **2.2.4** Test each transition manually
  ```bash
  # Create test data and verify each stage transition works
  # Document results in testing log
  ```

**Verification Test**:
```sql
-- After full workflow test, position should be in 'active' state
SELECT
  p.position_code,
  p.workflow_stage,
  p.hr_completed_at,
  p.leader_completed_at,
  jd.hr_approved,
  jd.published_at
FROM positions p
LEFT JOIN job_descriptions jd ON jd.position_id = p.id
WHERE p.position_code = '<TEST_POSITION_CODE>';

-- All dates should be filled, workflow_stage should be 'active'
```

---

## PHASE 3: USER FLOW END-TO-END TESTING

**Estimated Time**: 2-3 hours
**Goal**: Manually test each complete user flow from start to finish

### 3.1 Flow: Public Interest → Lead Capture

**Test First**: Define success criteria
```gherkin
Given I am a prospective client
When I visit the landing page and submit a lead form
Then the lead should be saved to the database
And an admin should be notified (future: currently missing)
```

**Implementation**:

- [ ] **3.1.1** Test landing page loads
  ```bash
  curl -I http://localhost:3000/ | grep "200 OK"
  ```

- [ ] **3.1.2** Test lead form page loads
  ```bash
  curl -I http://localhost:3000/lead | grep "200 OK"
  ```

- [ ] **3.1.3** Submit test lead via UI
  - [ ] Open http://localhost:3000/lead
  - [ ] Fill form with test data
  - [ ] Submit
  - [ ] Verify success message

- [ ] **3.1.4** Verify lead saved to database
  ```sql
  SELECT * FROM leads ORDER BY created_at DESC LIMIT 1;
  -- Should show the test lead just submitted
  ```

**Verification Test**:
```bash
# Lead should exist in database
psql $DATABASE_URL -c "SELECT contact_email FROM leads WHERE contact_email = 'test@example.com';"
# Should return the test email
```

**Known Issues**:
- ⚠️ No admin notification email (log as TODO for Phase 5)

---

### 3.2 Flow: Admin Creates Client

**Test First**:
```gherkin
Given I am a Prisma admin
When I create a new client company with HR user
Then the client company should be created
And the HR user should receive a magic link email
And the HR user should be able to log in via the magic link
```

**Implementation**:

- [ ] **3.2.1** Admin login test
  - [ ] Visit http://localhost:3000/admin/login
  - [ ] Check if you can log in (need admin credentials)
  - [ ] Document: How to create first admin user?

- [ ] **3.2.2** Create client test
  - [ ] Visit http://localhost:3000/admin/clients/new
  - [ ] Fill form with test client data
  - [ ] Submit
  - [ ] Verify success message

- [ ] **3.2.3** Verify client created in database
  ```sql
  SELECT c.company_name, h.email, h.role
  FROM companies c
  JOIN hr_users h ON h.company_id = c.id
  WHERE c.company_name = '<TEST_COMPANY_NAME>';
  ```

- [ ] **3.2.4** Verify magic link email sent
  ```sql
  SELECT email_type, recipient_email, sent_at
  FROM email_communications
  WHERE recipient_email = '<TEST_HR_EMAIL>'
  ORDER BY created_at DESC LIMIT 1;
  ```

- [ ] **3.2.5** Check actual email received (via Resend dashboard)
  - [ ] Login to Resend dashboard
  - [ ] Verify email was sent
  - [ ] Copy magic link URL

- [ ] **3.2.6** Test magic link login
  - [ ] Click magic link from email
  - [ ] Should redirect to `/client/dashboard`
  - [ ] Should see client dashboard

**Verification Test**:
```bash
# Client should be able to access dashboard
# After clicking magic link, check Supabase Auth dashboard for new user
```

**Known Issues**:
- ⚠️ Magic link uses `window.location.origin` (should be fixed in Phase 1.2)

---

### 3.3 Flow: Client Submits HR Form

**Test First**:
```gherkin
Given I am logged in as an HR user
When I submit the HR form to create a position
Then the position should be created with workflow_stage='hr_completed'
And the business leader should receive an email notification
And the email should contain a link to the business form
```

**Implementation**:

- [ ] **3.3.1** Navigate to HR form
  - [ ] From client dashboard, click "Create Position"
  - [ ] Should load http://localhost:3000/hr-form

- [ ] **3.3.2** Fill and submit HR form
  - [ ] Fill all required fields
  - [ ] Use test leader email that you can access
  - [ ] Submit form
  - [ ] Verify success message

- [ ] **3.3.3** Verify position created
  ```sql
  SELECT position_code, position_name, workflow_stage, leader_email
  FROM positions
  WHERE position_name = '<TEST_POSITION_NAME>';
  ```

- [ ] **3.3.4** Verify leader email sent
  ```sql
  SELECT email_type, recipient_email, subject_line, sent_at
  FROM email_communications
  WHERE position_id = '<NEW_POSITION_ID>'
    AND email_type = 'leader_form_request';
  ```

- [ ] **3.3.5** Check leader email received
  - [ ] Check inbox for test leader email
  - [ ] Verify email contains business form link
  - [ ] Verify link includes position code

**Verification Test**:
```bash
# Leader email should exist and be sent
# Check backend logs for email worker processing
grep "leader_form_request" backend_logs.txt
```

---

### 3.4 Flow: Business Leader Completes Form

**Test First**:
```gherkin
Given I received a leader form email
When I click the link and submit the business form
Then the position should be updated with my specifications
And the workflow_stage should be 'leader_completed'
And the admin should be notified (future: currently missing)
```

**Implementation**:

- [ ] **3.4.1** Click business form link from email
  - [ ] Should load http://localhost:3000/business-form?code=<POSITION_CODE>
  - [ ] Should show position details (pre-loaded)

- [ ] **3.4.2** Fill and submit business form
  - [ ] Answer all area-specific questions
  - [ ] Submit form
  - [ ] Verify success message

- [ ] **3.4.3** Verify position updated
  ```sql
  SELECT workflow_stage, work_arrangement, team_size, success_kpi
  FROM positions
  WHERE position_code = '<POSITION_CODE>';
  -- workflow_stage should be 'leader_completed'
  ```

**Verification Test**:
```sql
-- Position should have business specs and correct stage
SELECT
  position_code,
  workflow_stage,
  leader_completed_at IS NOT NULL as has_completion_date,
  work_arrangement IS NOT NULL as has_specs
FROM positions
WHERE position_code = '<POSITION_CODE>';
-- All boolean columns should be true
```

---

### 3.5 Flow: Admin Creates & Publishes JD

**Test First**:
```gherkin
Given a position with workflow_stage='leader_completed'
When I create a job description and approve it
Then the JD should be saved with hr_approved=true
And when I publish the JD
Then the position workflow_stage should be 'active'
And the job should be visible publicly
```

**Implementation**:

- [ ] **3.5.1** View position in admin pipeline
  - [ ] Visit http://localhost:3000/admin/positions
  - [ ] Find test position (should show `leader_completed`)
  - [ ] Click to view details

- [ ] **3.5.2** Create JD
  - [ ] On position detail page, click "Create JD"
  - [ ] Write test job description in textarea
  - [ ] Click "Save JD"
  - [ ] Verify success message

- [ ] **3.5.3** Verify JD saved
  ```sql
  SELECT id, position_id, generation_model, hr_approved
  FROM job_descriptions
  WHERE position_id = '<POSITION_ID>';
  -- hr_approved should be false initially
  ```

- [ ] **3.5.4** Navigate to validate page
  - [ ] Go to http://localhost:3000/admin/positions/<POSITION_ID>/validate
  - [ ] Review JD content
  - [ ] Click "Approve JD"

- [ ] **3.5.5** Verify JD approved
  ```sql
  SELECT hr_approved, hr_approved_at
  FROM job_descriptions
  WHERE position_id = '<POSITION_ID>';
  -- hr_approved should be true
  ```

- [ ] **3.5.6** Publish JD
  - [ ] Go back to position detail page
  - [ ] Click "Publish" button
  - [ ] Confirm publication

- [ ] **3.5.7** Verify position active
  ```sql
  SELECT workflow_stage FROM positions WHERE id = '<POSITION_ID>';
  -- Should be 'active'

  SELECT status, published_at FROM job_descriptions WHERE position_id = '<POSITION_ID>';
  -- status should be 'published', published_at should have value
  ```

**Verification Test**:
```bash
# Job should be accessible publicly
curl http://localhost:3000/job/<POSITION_CODE> | grep "<POSITION_NAME>"
# Should return HTML containing position name
```

---

### 3.6 Flow: Candidate Applies to Job

**Test First**:
```gherkin
Given a published job with workflow_stage='active'
When a candidate views the job and submits an application
Then the application should be saved
And the candidate should receive confirmation (future)
And the admin should be notified (future)
```

**Implementation**:

- [ ] **3.6.1** View public job listing
  - [ ] Visit http://localhost:3000/job/<POSITION_CODE>
  - [ ] Verify job description displays
  - [ ] Verify "Apply" button shows

- [ ] **3.6.2** Submit application
  - [ ] Click "Apply"
  - [ ] Should navigate to /apply/<POSITION_CODE>
  - [ ] Fill application form
  - [ ] Upload resume (if file upload works)
  - [ ] Submit

- [ ] **3.6.3** Verify application saved
  ```sql
  SELECT a.full_name, app.status, app.applied_at
  FROM applicants a
  JOIN applications app ON app.applicant_id = a.id
  WHERE app.position_id = '<POSITION_ID>'
  ORDER BY app.applied_at DESC LIMIT 1;
  ```

**Verification Test**:
```sql
-- Application should exist with 'new' or 'submitted' status
SELECT COUNT(*) FROM applications WHERE position_id = '<POSITION_ID>';
-- Should be > 0
```

**Known Issues**:
- ⚠️ Verify applicantService exists and works (may need to check)
- ⚠️ No candidate confirmation email (log as TODO)

---

## PHASE 4: UI/UX IMPROVEMENTS

**Estimated Time**: 1-2 hours
**Goal**: Fix navigation and improve user experience

### 4.1 Add Navigation to ValidateJDPage

**Test First**:
```typescript
// Button should exist when JD is ready for validation
describe('Position Detail Page', () => {
  it('should show Validate button when JD exists and not approved', () => {
    const position = { workflow_stage: 'job_desc_generated' }
    const jd = { id: '123', hr_approved: false }

    render(<PositionDetailPage position={position} jd={jd} />)
    expect(screen.getByText(/Validate JD/i)).toBeInTheDocument()
  })
})
```

**Implementation**:

- [ ] **4.1.1** Add "Validate JD" button to PositionDetailPage
  ```typescript
  // In frontend/src/pages/admin/PositionDetailPage.tsx
  // Around line 310, add new button:

  {jd && !jd.hr_approved && position.workflow_stage === 'job_desc_generated' && (
    <Button
      onClick={() => navigate(`/admin/positions/${positionId}/validate`)}
      variant="primary"
    >
      ✅ Validate JD
    </Button>
  )}
  ```

- [ ] **4.1.2** Add link in PositionPipelinePage for positions awaiting validation
  ```typescript
  // Show badge or indicator for positions needing validation
  {position.workflow_stage === 'job_desc_generated' && (
    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
      Awaiting Validation
    </span>
  )}
  ```

**Verification Test**:
```bash
# After implementation, manually test:
# 1. Create JD for position
# 2. Return to position detail page
# 3. Verify "Validate JD" button appears
# 4. Click button → should navigate to validate page
```

---

### 4.2 Fix Workflow Stage Naming Clarity

**Implementation**:

- [ ] **4.2.1** Decide on correct stage after HR approval
  ```
  Current: jdService.approveJD() sets 'validation_pending'
  Problem: This is AFTER validation, not pending

  Options:
  A. Change to 'validated' (ready for publication)
  B. Keep 'validation_pending' but rename to 'ready_to_publish'
  C. Add new stage 'approved_by_hr'

  Decision: [TO BE DECIDED]
  ```

- [ ] **4.2.2** Update jdService.approveJD() based on decision
  ```typescript
  // Update the workflow_stage value in approveJD()
  await supabase
    .from('positions')
    .update({ workflow_stage: 'validated' })  // Or chosen stage name
    .eq('id', data.position_id)
  ```

- [ ] **4.2.3** Update stage labels in PositionPipelinePage
  ```typescript
  // Update STAGE_LABELS to match new naming
  const STAGE_LABELS: Record<WorkflowStage, string> = {
    // ... existing stages
    validation_pending: 'Ready to Publish',  // Updated label
    // OR add new stage if decided
  }
  ```

**Verification Test**:
```bash
# After approval, position should show correct stage
# Manually approve a JD and check position detail page
# Stage badge should make sense semantically
```

---

## PHASE 5: NOTIFICATIONS & MISSING FEATURES

**Estimated Time**: 2-4 hours
**Goal**: Add missing notification emails and features

### 5.1 Admin Notification on Lead Submission

**Test First**:
```sql
-- After lead submission, email should be created
SELECT COUNT(*) FROM email_communications
WHERE email_type = 'admin_lead_notification'
  AND created_at > NOW() - INTERVAL '1 minute';
-- Should be 1 after submitting lead
```

**Implementation**:

- [ ] **5.1.1** Add `admin_lead_notification` to email_type enum
  ```sql
  -- Run migration to add new email type
  ALTER TABLE email_communications
  DROP CONSTRAINT IF EXISTS email_communications_email_type_check;

  ALTER TABLE email_communications
  ADD CONSTRAINT email_communications_email_type_check
  CHECK (email_type IN (
    'company_onboarding', 'hr_user_invitation', 'leader_form_request',
    'job_description_validation', 'applicant_status_update',
    'interview_invitation', 'offer_notification',
    'admin_lead_notification'  -- NEW
  ));
  ```

- [ ] **5.1.2** Create email template for admin notification
  ```python
  # In backend/app/services/email_templates.py
  @staticmethod
  def admin_lead_notification(lead_data: Dict) -> str:
      """Email to admin when new lead is submitted"""
      # Implement template
  ```

- [ ] **5.1.3** Trigger email in leadService.createLead()
  ```typescript
  // After successful lead creation:
  await supabase
    .from('email_communications')
    .insert({
      company_id: null,  // No company yet
      email_type: 'admin_lead_notification',
      recipient_email: 'admin@getprisma.io',  // Or from env var
      recipient_name: 'Prisma Admin',
      subject_line: `Nueva lead: ${leadData.contact_name} - ${leadData.company_name}`,
      email_content: '<EMAIL_CONTENT>',
    })
  ```

**Verification Test**:
```bash
# Submit test lead, check email was created and sent
# Verify admin receives email
```

---

### 5.2 Admin Notification on Leader Form Completion

**Implementation**: Similar to 5.1, create trigger/email when `workflow_stage` changes to `leader_completed`

---

### 5.3 Candidate Confirmation Email

**Implementation**: Send confirmation email after application submission

---

## PHASE 6: DEPLOYMENT PREPARATION

**Estimated Time**: 1 hour
**Goal**: Finalize deployment configuration

### 6.1 Vercel Frontend Deployment

- [ ] **6.1.1** Set environment variables in Vercel dashboard
  - [ ] Add all `VITE_*` variables from `.env.production`
  - [ ] Verify `VITE_APP_URL` points to Vercel domain
  - [ ] Verify `VITE_API_BASE_URL` points to backend domain

- [ ] **6.1.2** Deploy to Vercel
  ```bash
  git push origin main
  # OR
  vercel --prod
  ```

- [ ] **6.1.3** Verify deployment
  - [ ] Visit Vercel URL
  - [ ] Check homepage loads
  - [ ] Check console for errors
  - [ ] Verify API calls work

---

### 6.2 Backend Deployment (Render.com)

- [ ] **6.2.1** Create Render.com web service
  - [ ] Connect GitHub repository
  - [ ] Set root directory to `backend/`
  - [ ] Set build command: `pip install -r requirements.txt`
  - [ ] Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

- [ ] **6.2.2** Set environment variables
  - [ ] Copy all vars from `.env.production`
  - [ ] Update `ALLOWED_ORIGINS` with Vercel URL
  - [ ] Update `FRONTEND_URL` with Vercel URL

- [ ] **6.2.3** Deploy backend
  - [ ] Trigger deployment
  - [ ] Check logs for startup success
  - [ ] Test health endpoint: `curl https://YOUR_BACKEND/health`

---

### 6.3 Update Frontend with Backend URL

- [ ] **6.3.1** Get backend URL from Render.com

- [ ] **6.3.2** Update `VITE_API_BASE_URL` in Vercel
  - [ ] Go to Vercel project settings
  - [ ] Update environment variable
  - [ ] Redeploy frontend

---

## PHASE 7: PRODUCTION VALIDATION

**Estimated Time**: 1-2 hours
**Goal**: Verify everything works in production

### 7.1 Smoke Tests

- [ ] **7.1.1** Test landing page loads
- [ ] **7.1.2** Test lead form submission
- [ ] **7.1.3** Test admin login
- [ ] **7.1.4** Test client creation & magic link
- [ ] **7.1.5** Test HR form submission
- [ ] **7.1.6** Test business form
- [ ] **7.1.7** Test JD creation & publication
- [ ] **7.1.8** Test public job viewing
- [ ] **7.1.9** Test candidate application

### 7.2 Email Verification

- [ ] Verify all emails send correctly
- [ ] Check Resend dashboard for delivery stats
- [ ] Test magic links work from real emails

### 7.3 Performance Check

- [ ] Check page load times
- [ ] Verify API response times < 500ms
- [ ] Check backend logs for errors
- [ ] Monitor email worker processing

---

## COMPLETION CRITERIA

### All Phases Must Pass:

- ✅ No hardcoded localhost URLs
- ✅ All environment variables configured
- ✅ All workflow stages transition correctly
- ✅ All emails send successfully
- ✅ All user flows work end-to-end
- ✅ Frontend deployed to Vercel
- ✅ Backend deployed to Render.com
- ✅ Production smoke tests pass
- ✅ No errors in logs for 24 hours

---

## ROLLBACK PLAN

If production deployment fails:

1. **Immediate**: Rollback Vercel deployment to previous version
2. **Backend**: Rollback Render deployment
3. **Database**: No rollback needed (migrations are additive)
4. **Investigate**: Check logs for error details
5. **Fix**: Address issue in development
6. **Redeploy**: Only after verification in local environment

---

## MAINTENANCE CHECKLIST (Post-Launch)

**Daily** (First Week):
- [ ] Check error logs
- [ ] Verify email delivery rates
- [ ] Monitor user signups

**Weekly**:
- [ ] Review email deliverability
- [ ] Check database performance
- [ ] Update dependencies if needed

**Monthly**:
- [ ] Security audit
- [ ] Performance optimization review
- [ ] User feedback collection
