# Prisma Talent Platform - Admin User Guide

🎉 **You're logged in as Super Admin!** Here's your complete guide to the platform.

---

## 🗺️ Admin Navigation Map

### Available Admin Pages

| Page | URL | Purpose |
|------|-----|---------|
| 📊 **Dashboard** | `/admin` | Overview of all platform activity |
| 📋 **Lead Management** | `/admin/leads` | Review and approve client leads |
| 🎯 **Position Pipeline** | `/admin/positions` | Manage hiring positions and workflow |
| 👥 **Candidate Review** | `/admin/candidates` | Review all applicants across positions |
| ⭐ **Shortlist Generator** | `/admin/shortlist/:code` | Generate candidate shortlists per position |
| ✍️ **Job Description Editor** | `/admin/positions/:code/edit` | ⚠️ Temporarily disabled (missing dependencies) |

---

## 📍 Step-by-Step User Journeys

### Journey 1: From Lead to Active Client

**Goal**: Convert a potential client (lead) into an active hiring company

#### Step 1: Receive Lead
- **URL**: http://localhost:3000/ (public landing page)
- **Action**: Public user fills "Contact Form"
- **Result**: New lead created in database with status `pending`

#### Step 2: Review Lead
- **URL**: http://localhost:3000/admin/leads
- **Action**:
  - View all leads with filters (status, intent, date)
  - Click on lead to see details
  - Decision: Approve or Reject

#### Step 3: Approve & Convert Lead
- **Action in Lead Management**:
  - Click "Approve" button on lead
  - Lead status → `approved`
  - Optionally: Click "Convert to Client"
  - Creates new company record in `companies` table
  - Status: `lead` → `onboarding`

#### Step 4: Send Onboarding Form
- **Action**: Email HR contact with link to HR form
- **Link**: `http://localhost:3000/hr-form`
- **Purpose**: Collect detailed company and position info

---

### Journey 2: Create Position from HR Form

**Goal**: HR user creates a hiring position through the HR form

#### Step 1: HR Accesses Form
- **URL**: http://localhost:3000/hr-form
- **Who**: HR contact from approved client company
- **Authentication**: No login required (public form with company email validation)

#### Step 2: HR Fills Form
**Form Sections**:
1. **Company Info**: Name, industry, size, website
2. **Contact Info**: HR name, email, phone
3. **Position Details**:
   - Role title (e.g., "Senior Full-Stack Developer")
   - Seniority level (Junior/Mid/Senior/Lead)
   - Work mode (Remote/Hybrid/On-site)
   - Salary range
4. **Requirements**: Skills, experience, education
5. **Team Context**: Team size, reporting structure

#### Step 3: Position Created
- **Result**: New record in `positions` table
- **Status**: `specs_pending` (waiting for business leader specs)
- **Trigger**: Email sent to business leader with their form link

---

### Journey 3: Business Leader Adds Context

**Goal**: Business leader provides strategic context for the hire

#### Step 1: Business Leader Receives Email
- **Email Contains**: Link with position code
- **Link**: `http://localhost:3000/business-form?code=POS-XXX-XXXX`

#### Step 2: Business Leader Fills Form
**Form Content**:
1. **Strategic Context**: Why this hire now?
2. **Success Criteria**: What defines success in 90 days?
3. **Team Dynamics**: Who will they work with?
4. **Growth Path**: Career development opportunities
5. **Challenges**: Main problems to solve
6. **Cultural Fit**: Team values and work style

#### Step 3: Specs Complete
- **Result**: Position status → `jd_pending`
- **Next**: Admin creates job description

---

### Journey 4: Admin Creates Job Description

**Goal**: Transform HR + Business specs into published job description

#### Step 1: Access Position Pipeline
- **URL**: http://localhost:3000/admin/positions
- **View**: List of all positions with workflow status
- **Filter**: Show positions with status `jd_pending`

#### Step 2: Create Job Description
- **Action**: Click "Create JD" button on position
- **URL**: `/admin/positions/POS-XXX-XXXX/edit`
- **Status**: ⚠️ **Currently disabled** (missing @tiptap rich text editor dependencies)

**What This Should Do** (when enabled):
1. Load position specs (HR + Business forms)
2. Use rich text editor to craft JD
3. Sections: Role summary, responsibilities, requirements, benefits, culture
4. Save as draft or publish immediately

#### Step 3: Publish Job Description
- **Action**: Click "Publish" button
- **Result**:
  - JD status → `published`
  - Position status → `open`
  - Job appears on public job listing page
- **Public URL**: `http://localhost:3000/job/POS-XXX-XXXX`

---

### Journey 5: Candidate Application Flow

**Goal**: Candidates apply for published positions

#### Step 1: Candidate Finds Job
- **URL**: http://localhost:3000/job/POS-XXX-XXXX
- **View**: Full job description with "Apply" button

#### Step 2: Candidate Applies
- **URL**: http://localhost:3000/apply/POS-XXX-XXXX
- **Form Fields**:
  - Full name, email, phone
  - LinkedIn profile
  - CV upload (stored in Supabase Storage bucket `cvs`)
  - Cover letter / motivation
  - Availability to start

#### Step 3: Application Submitted
- **Result**: New record in `applicants` table
- **Status**: `new`
- **Triggers**:
  - Email confirmation to candidate
  - Notification to admin and HR contact

---

### Journey 6: Admin Reviews Candidates

**Goal**: Qualify candidates and build shortlist

#### Step 1: Access Candidate Review
- **URL**: http://localhost:3000/admin/candidates
- **View**: All applicants across all positions
- **Filters**: Position, status, qualification score, date

#### Step 2: Review Applicant Profile
- **Click on applicant** to see:
  - Full application details
  - CV download link
  - LinkedIn profile
  - Application timeline
  - Previous activities

#### Step 3: Qualify Candidate
- **Actions**:
  - Set qualification score (1-5 stars)
  - Add evaluation notes (internal only)
  - Mark as "Qualified for Shortlist"
  - Change status: `new` → `reviewing` → `qualified` / `rejected`

---

### Journey 7: Generate Shortlist

**Goal**: Create curated shortlist for client review

#### Step 1: Access Shortlist Generator
- **URL**: http://localhost:3000/admin/shortlist/POS-XXX-XXXX
- **Requirement**: Position must have qualified candidates

#### Step 2: Review Qualified Candidates
- **View**: All candidates marked as "qualified" for this position
- **Sort by**: Qualification score, application date
- **Actions**:
  - Select candidates for shortlist
  - Reorder by priority
  - Add admin notes per candidate

#### Step 3: Generate & Send Shortlist
- **Action**: Click "Generate Shortlist"
- **Result**:
  - Creates shortlist document
  - Sends to HR contact and business leader
  - Position status → `shortlist_sent`

---

## 🧪 How to Create Test Users & Test the Full Flow

### Option 1: Create Test Data via SQL (Fastest)

Run this in Supabase SQL Editor:

```sql
-- Create test company
INSERT INTO companies (
  id, company_name, industry, company_size, website,
  subscription_status, onboarding_status
) VALUES (
  gen_random_uuid(),
  'Test Company Inc',
  'Technology',
  '50-100',
  'https://testcompany.com',
  'active',
  'completed'
) RETURNING id;

-- Note the company ID returned, use it below
-- Replace 'YOUR_COMPANY_ID' with the actual UUID

-- Create test HR user
INSERT INTO hr_users (
  company_id,
  email,
  full_name,
  role,
  can_create_positions,
  can_manage_team,
  is_active
) VALUES (
  'YOUR_COMPANY_ID',
  'hr@testcompany.com',
  'Jane HR Manager',
  'HR Manager',
  true,
  true,
  true
);

-- Create test position
INSERT INTO positions (
  company_id,
  position_code,
  role_title,
  seniority_level,
  work_mode,
  salary_min,
  salary_max,
  status,
  created_by_email
) VALUES (
  'YOUR_COMPANY_ID',
  'POS-TEST-2024',
  'Senior Full-Stack Developer',
  'senior',
  'remote',
  80000,
  120000,
  'open',
  'hr@testcompany.com'
) RETURNING id;

-- Create test job description
INSERT INTO job_descriptions (
  position_id,
  company_id,
  position_code,
  title,
  content,
  status
) VALUES (
  'YOUR_POSITION_ID',
  'YOUR_COMPANY_ID',
  'POS-TEST-2024',
  'Senior Full-Stack Developer - Remote',
  'We are looking for an experienced full-stack developer...',
  'published'
);

-- Create test applicant
INSERT INTO applicants (
  position_id,
  position_code,
  company_id,
  full_name,
  email,
  phone,
  linkedin_url,
  cv_url,
  cover_letter,
  availability,
  status
) VALUES (
  'YOUR_POSITION_ID',
  'POS-TEST-2024',
  'YOUR_COMPANY_ID',
  'John Doe',
  'john.doe@example.com',
  '+1234567890',
  'https://linkedin.com/in/johndoe',
  'https://example.com/cv.pdf',
  'I am very interested in this position...',
  'Immediately',
  'new'
);
```

### Option 2: Use Public Forms (Tests Full Flow)

1. **Create Lead**:
   - Go to http://localhost:3000/
   - Fill contact form
   - Go to `/admin/leads` and approve

2. **HR Form**:
   - Go to http://localhost:3000/hr-form
   - Fill complete form
   - Creates company + position

3. **Business Form**:
   - Get position code from `/admin/positions`
   - Go to http://localhost:3000/business-form?code=POS-XXX
   - Add strategic context

4. **Apply to Job**:
   - After JD is published, go to `/job/POS-XXX`
   - Click Apply
   - Fill application form

### Option 3: Create Client Auth User (For Client Dashboard)

Currently, HR users don't have login. To add that:

```sql
-- First, create user in Supabase Auth manually via Dashboard
-- Then link to hr_users table:

UPDATE hr_users
SET auth_user_id = 'USER_UID_FROM_AUTH'
WHERE email = 'hr@testcompany.com';
```

---

## 🔐 User Roles & Permissions

### Super Admin (You)
- **Access**: Everything
- **Can**:
  - Approve/reject leads
  - Create/edit positions
  - Review all applicants
  - Generate shortlists
  - Manage all companies
  - Create other admin users

### Admin
- **Access**: Most admin features
- **Cannot**:
  - Create other admin users
  - Access super admin settings

### HR User (Future Feature)
- **Access**: Their company only
- **Can**:
  - Create positions for their company
  - View applicants for their positions
  - Review shortlists
- **Cannot**:
  - See other companies
  - Approve leads
  - Generate shortlists (admin does this)

### Business Leader (No Login)
- **Access**: Via email link only
- **Can**:
  - Fill strategic context form
  - View shortlist (when sent via email)

### Candidate/Public (No Login)
- **Access**: Public pages only
- **Can**:
  - Submit lead form
  - Browse job listings
  - Apply to positions

---

## 🎯 Quick Test Scenarios

### Scenario 1: End-to-End Position Creation
1. Go to `/admin/leads` → Create test lead → Approve
2. Go to `/hr-form` → Fill HR specs
3. Go to `/business-form?code=XXX` → Add context
4. Go to `/admin/positions` → See position workflow

### Scenario 2: Candidate Review Flow
1. Go to `/job/POS-XXX` → Apply as candidate
2. Go to `/admin/candidates` → Review application
3. Qualify candidate (5 stars) → Mark for shortlist
4. Go to `/admin/shortlist/POS-XXX` → Generate shortlist

### Scenario 3: Multi-Position Management
1. Create 3 test positions via HR form
2. Go to `/admin/positions` → See pipeline view
3. Filter by status (specs_pending, jd_pending, open)
4. Track progress for each position

---

## 🐛 Known Issues

### Job Description Editor Disabled
- **Issue**: Missing `@tiptap` rich text editor dependencies
- **Impact**: Cannot create JD through UI
- **Workaround**: Create JD via SQL insert for now
- **Fix**: Install dependencies:
  ```bash
  npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
  ```

### Email Notifications Not Working
- **Issue**: Email service not configured
- **Impact**: Automatic emails don't send
- **Workaround**: Manual emails for now
- **Fix**: Configure Resend API in backend

---

## 📊 Database Tables Reference

Quick reference for what data lives where:

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `companies` | Client organizations | company_name, subscription_status, onboarding_status |
| `hr_users` | HR contacts | company_id, email, permissions |
| `positions` | Hiring positions | position_code, role_title, status |
| `job_descriptions` | Published JDs | position_code, content, status |
| `applicants` | Candidate applications | position_code, email, cv_url, status |
| `leads` | Potential clients | contact_email, intent, status |
| `prisma_admins` | Admin users (you!) | email, auth_user_id, role |

---

## 🎓 Next Steps

1. **Create test company** via SQL or lead form
2. **Create test position** via HR form
3. **Add test candidates** via application form
4. **Review workflow** in admin dashboard
5. **Generate shortlist** for test position

**Need help?** Check the inline comments in each page component for detailed implementation notes.

---

**Your Admin Status**:
- Email: `huayaney.exe@gmail.com`
- Role: `super_admin`
- Access: All admin pages ✅
