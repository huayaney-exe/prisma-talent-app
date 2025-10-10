# Phase 6: Testing & Validation Guide

Complete testing documentation for the Prisma Talent Admin MVP.

## Table of Contents
1. [Database Setup](#database-setup)
2. [Environment Configuration](#environment-configuration)
3. [Testing Workflows](#testing-workflows)
4. [Validation Checklist](#validation-checklist)
5. [Troubleshooting](#troubleshooting)

---

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project: **prisma-talent-mvp**
3. Save project credentials:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **Anon Key**: Public anonymous key
   - **Service Role Key**: Admin key (keep secret)

### 2. Run Database Migrations

Execute migrations in order via Supabase SQL Editor:

```sql
-- 1. Initial schema (companies, hr_users, positions, etc.)
-- Run: database/migrations/001_initial_schema.sql

-- 2. Admin MVP schema (leads table + position/applicant updates)
-- Run: database/migrations/010_admin_mvp_schema.sql

-- 3. RLS policies for admin tables
-- Run: database/migrations/011_admin_rls_policies.sql
```

### 3. Verify Schema

Check that tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- - leads
-- - positions
-- - applicants
-- - companies
-- - hr_users
-- - job_descriptions
-- - application_activities
-- - email_communications
```

### 4. Check Sample Data

```sql
-- Should have 3 sample leads
SELECT * FROM leads;

-- Expected:
-- - María García (pending, hiring)
-- - Carlos Rodríguez (pending, conversation)
-- - Ana Martínez (approved, hiring)
```

---

## Environment Configuration

### Frontend Environment Variables

Create `frontend/.env.local`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration (optional for now)
VITE_API_URL=http://localhost:3000
```

### Verify Supabase Connection

Test connection from browser console:

```javascript
// Should be available globally
console.log(window.supabase)

// Test query
const { data, error } = await supabase.from('leads').select('*')
console.log('Leads:', data, 'Error:', error)
```

---

## Testing Workflows

### Workflow 1: Lead Management

**Objective**: Test lead submission, approval, and rejection flow.

#### Step 1: Submit New Lead (Public Form)

1. Navigate to: `http://localhost:3000/contact`
2. Fill out lead form:
   - Name: "Test Lead"
   - Email: "test@example.com"
   - Company: "Test Corp"
   - Intent: Select "Hiring"
   - Role: "Product Manager"
3. Submit form
4. Verify success message

**Expected Database State**:
```sql
SELECT * FROM leads WHERE contact_email = 'test@example.com';
-- Should have status = 'pending'
```

#### Step 2: View Leads (Admin Dashboard)

1. Navigate to: `http://localhost:3000/admin/login`
2. Login with admin credentials (from auth setup)
3. Click "Lead Management"
4. Verify "Test Lead" appears in table with "Pendientes" filter
5. Check lead count shows correctly

**Expected UI**:
- ✅ Lead appears in table
- ✅ Status badge shows "pending" (yellow)
- ✅ Filter buttons work (All, Pendientes, Aprobados, Rechazados)
- ✅ Lead count updates when filter changes

#### Step 3: Approve Lead

1. Click "Aprobar" button for Test Lead
2. Verify lead disappears from "Pendientes" filter
3. Switch to "Aprobados" filter
4. Verify lead appears with green "approved" badge

**Expected Database State**:
```sql
SELECT status FROM leads WHERE contact_email = 'test@example.com';
-- Should be 'approved'
```

#### Step 4: Reject Lead

1. Switch back to "Pendientes" filter
2. Find another pending lead
3. Click "Rechazar" button
4. Verify lead moves to "Rechazados" with pink badge

**Validation**:
- ✅ Approve/reject actions update database immediately
- ✅ UI reflects changes without page refresh
- ✅ Filter counts update correctly
- ✅ No errors in browser console

---

### Workflow 2: Position Pipeline

**Objective**: Test position creation, workflow stages, and JD editing.

#### Step 1: Create Position Manually

Since we don't have the HR form integrated yet, insert via SQL:

```sql
INSERT INTO positions (
  company_id,
  position_name,
  area,
  seniority,
  leader_name,
  leader_position,
  leader_email,
  salary_range,
  contract_type,
  timeline,
  position_type,
  workflow_stage,
  business_area,
  seniority_level,
  created_by
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'Senior Product Manager',
  'Product Management',
  'Senior 5-8 años',
  'Carlos Director',
  'VP Product',
  'carlos@example.com',
  '$100k-$140k',
  'Tiempo completo',
  NOW() + INTERVAL '60 days',
  'Nueva posición',
  'hr_completed',
  'Product',
  'Senior',
  (SELECT id FROM hr_users LIMIT 1)
);
```

#### Step 2: View in Position Pipeline

1. Navigate to: `http://localhost:3000/admin/positions`
2. Verify "Senior Product Manager" appears
3. Check position code (e.g., POS_A1B2C3D4)
4. Verify workflow stage badge color
5. Test stage filters (HR Intake, Business Val., JD Creation, etc.)

**Expected UI**:
- ✅ Position appears with all details
- ✅ Stage badge shows correct color
- ✅ Filter by stage works correctly
- ✅ Actions buttons visible (Ver JD, Candidatos, Detalles)

#### Step 3: Edit Job Description

1. Click "Ver JD" for the position
2. Verify redirect to: `/admin/positions/[code]/edit`
3. Verify TipTap editor loads
4. Type job description content
5. Wait 30 seconds for auto-save
6. Verify "Last saved" timestamp updates

**Expected Behavior**:
- ✅ Editor loads with rich text toolbar
- ✅ Auto-save works every 30 seconds
- ✅ Manual save button works
- ✅ Content persists in database

**Database Check**:
```sql
SELECT position_code, job_description
FROM positions
WHERE position_name = 'Senior Product Manager';
-- Should contain HTML from TipTap
```

#### Step 4: Test Navigation

1. Click back to Position Pipeline
2. Verify position still shows
3. Click "Candidatos" button
4. Verify redirect to: `/admin/candidates/[code]`

---

### Workflow 3: Candidate Review & Shortlist

**Objective**: Test applicant submission, qualification, and shortlist generation.

#### Step 1: Submit Application (Public Form)

1. Navigate to: `http://localhost:3000/jobs/[position-code]`
2. Click "Apply Now"
3. Fill out application form:
   - Full Name: "Jane Candidate"
   - Email: "jane@example.com"
   - Phone: "+1234567890"
   - LinkedIn: "https://linkedin.com/in/jane"
   - Upload CV (or use URL)
4. Submit application

**Expected Database State**:
```sql
SELECT * FROM applicants WHERE email = 'jane@example.com';
-- Should have qualification_status = 'pending', score = NULL
```

#### Step 2: Review Candidate

1. Navigate to: `/admin/candidates/[position-code]`
2. Verify "Jane Candidate" appears in table
3. Check status badge shows "Pendiente" (yellow)
4. Click "Ver Detalles" to open modal
5. Verify contact info, CV download link work

**Expected UI**:
- ✅ Candidate appears with all submitted data
- ✅ Filter by status works (All, Pendientes, Calificados, Rechazados)
- ✅ Modal shows complete candidate information

#### Step 3: Qualify Candidate

1. In candidate detail modal:
   - Enter score: 85
   - Enter notes: "Strong product background, excellent communication"
   - Click "Calificar Candidato"
2. Verify modal closes
3. Verify candidate moves to "Calificados" filter
4. Verify score appears in table

**Database Check**:
```sql
SELECT qualification_status, score, evaluation_notes
FROM applicants
WHERE email = 'jane@example.com';
-- Should be: qualified, 85, "Strong product background..."
```

#### Step 4: Generate Shortlist

1. Navigate to: `/admin/shortlist/[position-code]`
2. Verify qualified candidates load
3. Check candidate sorted by score (highest first)
4. Select Jane Candidate (checkbox)
5. Click "Preview Shortlist"
6. Verify email preview modal opens
7. Check email contains:
   - Position name
   - Company name
   - Candidate details (name, score, contact, CV link)
   - Professional formatting

**Expected UI**:
- ✅ Only qualified candidates appear
- ✅ Candidates sorted by score DESC
- ✅ Selection checkboxes work
- ✅ Email preview renders correctly
- ✅ "Enviar Shortlist" button enabled when candidates selected

---

## Validation Checklist

### Database Validation

- [ ] All tables created successfully
- [ ] RLS policies enabled on leads, positions, applicants
- [ ] Sample data exists in leads table
- [ ] Triggers for updated_at work correctly
- [ ] Foreign key constraints enforced
- [ ] Storage bucket 'cvs' created

### Authentication Validation

- [ ] Admin login works at `/admin/login`
- [ ] Protected routes redirect to login when not authenticated
- [ ] Sign out button works
- [ ] Session persists on page refresh
- [ ] Unauthorized users cannot access admin pages

### Lead Management Validation

- [ ] Public can submit leads without authentication
- [ ] Leads appear in admin dashboard immediately
- [ ] Filter by status works (all, pending, approved, rejected)
- [ ] Approve button updates status to 'approved'
- [ ] Reject button updates status to 'rejected'
- [ ] Lead count updates correctly after status changes
- [ ] No duplicate lead submissions (email validation)

### Position Pipeline Validation

- [ ] Positions load from database
- [ ] Filter by workflow stage works
- [ ] Position details display correctly (code, name, company, area, seniority)
- [ ] Stage badge colors match workflow stage
- [ ] Navigation to JD editor works
- [ ] Navigation to candidate review works
- [ ] Applicant count displays correctly

### Job Description Editor Validation

- [ ] TipTap editor loads with toolbar
- [ ] Rich text formatting works (bold, italic, lists, headings)
- [ ] Auto-save triggers every 30 seconds
- [ ] Manual save button works
- [ ] Job description persists to database
- [ ] Last saved timestamp updates correctly
- [ ] Existing JD loads into editor on page load

### Candidate Review Validation

- [ ] Public can submit applications without authentication
- [ ] Applications appear in admin candidate review
- [ ] Filter by qualification status works
- [ ] Candidate detail modal opens with correct data
- [ ] CV download link works
- [ ] Qualify candidate updates status and score
- [ ] Reject candidate updates status
- [ ] Evaluation notes save correctly
- [ ] Candidates move between filter categories after status change

### Shortlist Generator Validation

- [ ] Only qualified candidates load
- [ ] Candidates sorted by score (highest first)
- [ ] Selection checkboxes work
- [ ] "Select All" / "Deselect All" works
- [ ] Selected count updates correctly
- [ ] Email preview generates with correct data
- [ ] Email includes all candidate information
- [ ] Professional HTML formatting in email
- [ ] "Enviar Shortlist" button disabled when no candidates selected

### Performance Validation

- [ ] Page loads within 2 seconds
- [ ] Database queries complete within 500ms
- [ ] HMR updates work without errors
- [ ] No memory leaks during navigation
- [ ] Images load correctly
- [ ] No console errors during normal operation

### Security Validation

- [ ] RLS policies prevent unauthorized data access
- [ ] Admin routes require authentication
- [ ] Public routes accessible without auth
- [ ] SQL injection not possible via form inputs
- [ ] XSS not possible via rich text editor
- [ ] CORS configured correctly for Supabase

---

## Troubleshooting

### Issue: "Table does not exist" Error

**Symptoms**: `error: relation "leads" does not exist`

**Solution**:
1. Check migrations ran successfully in Supabase SQL Editor
2. Verify table name is lowercase (Postgres is case-sensitive)
3. Run: `SELECT * FROM information_schema.tables WHERE table_name = 'leads';`

### Issue: RLS Policy Blocking Queries

**Symptoms**: Queries return empty arrays even though data exists

**Solution**:
1. Check if RLS is enabled: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'leads';`
2. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'leads';`
3. Temporarily disable RLS for testing: `ALTER TABLE leads DISABLE ROW LEVEL SECURITY;`
4. Check authentication status: `SELECT auth.uid();` (should return UUID)

### Issue: Foreign Key Constraint Violation

**Symptoms**: `error: insert or update on table "positions" violates foreign key constraint`

**Solution**:
1. Ensure referenced records exist (e.g., company_id must exist in companies table)
2. Insert parent records first:
   ```sql
   INSERT INTO companies (company_name, company_domain, primary_contact_name, primary_contact_email)
   VALUES ('Test Corp', 'test.com', 'Admin', 'admin@test.com');
   ```

### Issue: Auto-Save Not Working

**Symptoms**: Job description not saving every 30 seconds

**Solution**:
1. Check browser console for errors
2. Verify `positionService.updateJobDescription()` exists
3. Check Supabase connection in Network tab
4. Verify position_code param exists: `console.log(code)`
5. Test manual save button works first

### Issue: Loading State Never Ends

**Symptoms**: Spinner shows indefinitely

**Solution**:
1. Check Network tab for failed requests
2. Verify error handling in try/catch blocks
3. Add console logs: `console.log('Loading complete', data)`
4. Check `isLoading` state is set to `false` in `finally` block

### Issue: Supabase Connection Failed

**Symptoms**: All queries return errors

**Solution**:
1. Verify `.env.local` has correct values
2. Check Supabase project is running (not paused)
3. Test connection: `await supabase.from('leads').select('count')`
4. Verify CORS settings in Supabase dashboard
5. Check anon key is valid (not expired)

---

## Next Steps

After completing Phase 6 testing:

1. **Phase 7: Deployment**
   - Deploy frontend to Vercel
   - Configure production Supabase project
   - Set up custom domain

2. **Phase 8: Email Integration**
   - Implement email sending for shortlists
   - Add email templates
   - Configure SMTP or transactional email service

3. **Phase 9: Public Forms Integration**
   - Connect lead form to database
   - Connect application form to database
   - Add file upload for CVs

4. **Phase 10: Advanced Features**
   - Add search and filtering
   - Implement pagination
   - Add analytics dashboard
   - Multi-user admin support

---

## Testing Sign-Off

**Phase 6 Complete When:**
- [ ] All validation checklist items pass
- [ ] No critical bugs in admin workflows
- [ ] Database schema matches service expectations
- [ ] RLS policies work correctly
- [ ] All 3 core workflows tested end-to-end

**Tested By**: _______________
**Date**: _______________
**Sign-Off**: _______________
