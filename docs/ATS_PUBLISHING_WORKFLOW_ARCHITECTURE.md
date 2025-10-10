# ATS Publishing Workflow Architecture

Complete end-to-end workflow design for position publishing and candidate applications.

## 📊 Current State Analysis

### ✅ What Exists (Database Schema)
- `positions` table with `workflow_stage` field
- `applicants` table for candidate tracking
- `job_descriptions` table for AI-generated content
- `application_activities` table for audit trail
- Position code auto-generation (`position_code`)
- Complete applicant tracking fields (resume_url, portfolio_files)

### ✅ What's Implemented (Frontend)
- HR Form → Creates position (workflow_stage: `hr_completed`)
- Business Leader Form → Updates position (workflow_stage: `leader_completed`)
- Admin Dashboard → Views all positions
- Job Description Editor → Edits JD content
- Application Form Page → Exists but no data flow

### ❌ What's Missing
1. **Admin Publish Action** - No way to move position to `active` status
2. **Public Job Listing** - No public-facing job pages populated
3. **Custom Application Questions** - No way for admin to define screening questions
4. **Storage Configuration** - No Supabase storage buckets for resumes
5. **Application Submission Flow** - No backend integration for candidate applications
6. **Public Job Board** - No listing of all active positions

---

## 🎯 Complete ATS Publishing Workflow

### Phase 1: Position Creation (✅ Already Done)
```
HR Person → Fills HRForm
  ↓
Supabase: INSERT into positions
  ↓
workflow_stage: 'hr_completed'
  ↓
Email sent to Business Leader (magic link)
```

### Phase 2: Business Input (✅ Already Done)
```
Business Leader → Opens magic link
  ↓
Fills BusinessLeaderForm
  ↓
Supabase: UPDATE positions (work_arrangement, team_size, etc.)
  ↓
workflow_stage: 'leader_completed'
  ↓
Admin notified
```

### Phase 3: Job Description Creation (⚠️ Partially Done)
```
Admin → Views position in PositionPipelinePage
  ↓
Clicks "Edit JD" → JobDescriptionEditorPage
  ↓
Edits/generates job description
  ↓
Saves JD → Supabase UPDATE positions.job_description
  ↓
workflow_stage: 'jd_draft'
```

### Phase 4: Publishing (❌ MISSING - Need to Build)
```
Admin → Reviews final JD
  ↓
Configures application questions (custom screening)
  ↓
Clicks "Publish Position"
  ↓
Supabase UPDATE:
  - workflow_stage: 'active'
  - published_at: NOW()
  - is_published: true (new field)
  - public_url: generated
  ↓
Position now visible on public job board
```

### Phase 5: Public Application (❌ MISSING - Need to Build)
```
Candidate → Browses public job board (/jobs)
  ↓
Clicks position → /job/:position_code
  ↓
Views full job description
  ↓
Clicks "Apply" → /apply/:position_code
  ↓
Fills ApplicationForm:
  - Personal info (name, email, phone)
  - LinkedIn, portfolio URLs
  - Cover letter
  - Upload resume (→ Supabase Storage)
  - Upload portfolio files (→ Supabase Storage)
  - Answers custom screening questions
  ↓
Supabase INSERT into applicants
  ↓
Email confirmation sent to candidate
  ↓
Admin notified of new application
```

### Phase 6: Admin Review (⚠️ Partially Done)
```
Admin → CandidateReviewPage
  ↓
Views all applicants for position
  ↓
Reviews resumes, scores candidates
  ↓
Moves to shortlist → ShortlistGeneratorPage
```

---

## 🗄️ Database Schema Changes Needed

### 1. Add Publishing Fields to `positions` Table
```sql
ALTER TABLE positions ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS public_url TEXT;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS application_deadline DATE;
```

### 2. Create `application_questions` Table (Custom Screening)
```sql
CREATE TABLE IF NOT EXISTS application_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,

  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'short_text', 'long_text', 'single_choice', 'multiple_choice', 'yes_no', 'number'
  )),
  question_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,

  -- For choice questions
  options JSONB DEFAULT '[]', -- Array of options for single/multiple choice

  -- Validation
  min_length INTEGER,
  max_length INTEGER,
  min_value INTEGER,
  max_value INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_application_questions_position ON application_questions(position_id);
```

### 3. Create `applicant_answers` Table (Store Responses)
```sql
CREATE TABLE IF NOT EXISTS applicant_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES application_questions(id) ON DELETE CASCADE,

  answer_text TEXT,
  answer_number INTEGER,
  answer_choice JSONB DEFAULT '[]', -- For multiple choice

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_applicant_answers_applicant ON applicant_answers(applicant_id);
CREATE INDEX idx_applicant_answers_question ON applicant_answers(question_id);
```

### 4. Configure Supabase Storage Buckets
```sql
-- Run in Supabase Storage dashboard or via SQL
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('resumes', 'resumes', false),
  ('portfolios', 'portfolios', false);
```

### 5. Add Storage Policies (RLS for file uploads)
```sql
-- Allow public uploads to resumes bucket
CREATE POLICY "Allow public resume uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');

-- Allow authenticated admins to read all resumes
CREATE POLICY "Allow admin resume reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');

-- Same for portfolios
CREATE POLICY "Allow public portfolio uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'portfolios');

CREATE POLICY "Allow admin portfolio reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'portfolios');
```

---

## 🎨 Frontend Components to Build/Update

### 1. **PublishPositionModal** (New Component)
Location: `frontend/src/components/admin/PublishPositionModal.tsx`

**Features:**
- Preview job description
- Configure application deadline
- Add/edit custom screening questions
- Preview public job page
- "Publish" button → Updates workflow_stage to 'active'

**Props:**
```typescript
interface PublishPositionModalProps {
  position: Position
  isOpen: boolean
  onClose: () => void
  onPublish: () => void
}
```

### 2. **ApplicationQuestionsBuilder** (New Component)
Location: `frontend/src/components/admin/ApplicationQuestionsBuilder.tsx`

**Features:**
- Add/remove custom questions
- Question types: Short text, Long text, Single choice, Multiple choice, Yes/No
- Mark questions as required/optional
- Drag-and-drop reordering
- Question preview

### 3. **PublicJobBoardPage** (New Page)
Location: `frontend/src/pages/PublicJobBoardPage.tsx`

**Features:**
- List all published positions (where `is_published = true`)
- Filter by area, seniority, work mode
- Search by position name
- Click position → Navigate to `/job/:position_code`

### 4. **JobListingPage** (Update Existing)
Location: `frontend/src/pages/JobListingPage.tsx`

**Current:** Empty skeleton
**Update To:**
- Fetch position by `position_code` from Supabase
- Display full job description (rich text from TipTap editor)
- Show position details (salary, work mode, team size, etc.)
- "Apply Now" button → Navigate to `/apply/:position_code`

### 5. **ApplicationFormPage** (Update Existing)
Location: `frontend/src/pages/ApplicationFormPage.tsx`

**Current:** Static form
**Update To:**
- Fetch custom application questions from `application_questions` table
- Render dynamic form based on question types
- File upload for resume (→ Supabase Storage `resumes` bucket)
- File upload for portfolio files (→ Supabase Storage `portfolios` bucket)
- Submit → INSERT into `applicants` + `applicant_answers`
- Success message with confirmation

### 6. **PositionPipelinePage** (Update Existing)
Location: `frontend/src/pages/admin/PositionPipelinePage.tsx`

**Add:**
- "Publish" button for positions in `jd_draft` stage
- "Unpublish" button for active positions
- View public URL link (copy to clipboard)
- Published status indicator

### 7. **JobDescriptionEditorPage** (Update Existing)
Location: `frontend/src/pages/admin/JobDescriptionEditorPage.tsx`

**Add:**
- "Save & Publish" button (combines save + publish modal)
- "Configure Application Questions" tab
- Preview public job page button

---

## 🔧 Services to Build/Update

### 1. **positionService** (Update Existing)
Location: `frontend/src/services/positionService.ts`

**Add Methods:**
```typescript
// Publish position
async publishPosition(positionId: string, deadline?: Date): Promise<Position>

// Unpublish position
async unpublishPosition(positionId: string): Promise<Position>

// Get all published positions (public endpoint, no auth)
async getPublishedPositions(filters?: {
  area?: string
  seniority?: string
  work_mode?: string
}): Promise<PositionPublic[]>

// Get public position by code (public endpoint, no auth)
async getPublicPosition(positionCode: string): Promise<PositionPublic>
```

### 2. **applicationQuestionService** (New Service)
Location: `frontend/src/services/applicationQuestionService.ts`

**Methods:**
```typescript
// Admin only
async createQuestion(positionId: string, question: ApplicationQuestion): Promise<ApplicationQuestion>
async updateQuestion(questionId: string, question: Partial<ApplicationQuestion>): Promise<ApplicationQuestion>
async deleteQuestion(questionId: string): Promise<void>
async reorderQuestions(positionId: string, questionIds: string[]): Promise<void>

// Public
async getQuestionsByPosition(positionCode: string): Promise<ApplicationQuestion[]>
```

### 3. **applicantService** (New Service)
Location: `frontend/src/services/applicantService.ts`

**Methods:**
```typescript
// Public - Submit application
async submitApplication(data: {
  positionCode: string
  personalInfo: ApplicantFormData
  answers: Record<string, any>
  resumeFile: File
  portfolioFiles?: File[]
}): Promise<Applicant>

// Admin only
async getApplicantsByPosition(positionId: string): Promise<Applicant[]>
async updateApplicantStatus(applicantId: string, status: string): Promise<Applicant>
async scoreApplicant(applicantId: string, scores: {
  hr_score?: number
  technical_score?: number
}): Promise<Applicant>
```

### 4. **storageService** (New Service)
Location: `frontend/src/services/storageService.ts`

**Methods:**
```typescript
// Upload file to Supabase Storage
async uploadResume(file: File, applicantId: string): Promise<string>
async uploadPortfolioFile(file: File, applicantId: string): Promise<string>

// Download file (admin only)
async downloadFile(bucket: string, filePath: string): Promise<Blob>

// Generate signed URL (temporary access)
async getSignedUrl(bucket: string, filePath: string, expiresIn?: number): Promise<string>
```

---

## 📋 Implementation Checklist

### Database (Priority 1)
- [ ] Create migration `013_publishing_workflow.sql`
  - [ ] Add `is_published`, `published_at`, `public_url`, `application_deadline` to positions
  - [ ] Create `application_questions` table
  - [ ] Create `applicant_answers` table
- [ ] Create migration `014_storage_setup.sql`
  - [ ] Create storage buckets (resumes, portfolios)
  - [ ] Add storage RLS policies

### Backend Services (Priority 2)
- [ ] Create `applicationQuestionService.ts`
- [ ] Create `applicantService.ts`
- [ ] Create `storageService.ts`
- [ ] Update `positionService.ts` with publish methods

### Admin UI (Priority 3)
- [ ] Build `PublishPositionModal.tsx`
- [ ] Build `ApplicationQuestionsBuilder.tsx`
- [ ] Update `PositionPipelinePage.tsx` with publish button
- [ ] Update `JobDescriptionEditorPage.tsx` with questions tab

### Public UI (Priority 4)
- [ ] Build `PublicJobBoardPage.tsx` at `/jobs`
- [ ] Update `JobListingPage.tsx` to fetch real data
- [ ] Update `ApplicationFormPage.tsx` with:
  - [ ] Dynamic question rendering
  - [ ] File upload integration
  - [ ] Form submission to Supabase

### Testing (Priority 5)
- [ ] Test publish workflow end-to-end
- [ ] Test file uploads (resume, portfolio)
- [ ] Test custom question creation
- [ ] Test public application submission
- [ ] Test admin candidate review

---

## 🚀 Suggested Implementation Order

### Sprint 1: Database + Core Publishing (3-4 hours)
1. Create database migrations (013, 014)
2. Run migrations in Supabase
3. Update positionService with publish/unpublish methods
4. Add "Publish" button to PositionPipelinePage
5. Test basic publish/unpublish flow

### Sprint 2: Custom Questions (2-3 hours)
1. Create applicationQuestionService
2. Build ApplicationQuestionsBuilder component
3. Add questions tab to JobDescriptionEditorPage
4. Test question creation/editing

### Sprint 3: Public Job Pages (3-4 hours)
1. Build PublicJobBoardPage
2. Update JobListingPage with real data
3. Add routing for `/jobs` route
4. Test public job viewing

### Sprint 4: Application Submission (4-5 hours)
1. Configure Supabase Storage buckets
2. Create storageService
3. Create applicantService
4. Update ApplicationFormPage with dynamic questions
5. Implement file upload
6. Test complete application submission

### Sprint 5: Integration & Polish (2-3 hours)
1. End-to-end testing
2. Error handling
3. Loading states
4. Success/confirmation messages
5. Email notifications (optional)

**Total Estimated Time: 14-19 hours**

---

## 🔐 Security Considerations

### Row Level Security (RLS) Policies
- ✅ Positions: Public can read published positions only
- ✅ Application Questions: Public can read, admin can write
- ✅ Applicants: Admin-only read/write
- ✅ Storage: Public upload, admin-only read

### File Upload Validation
- File size limits (resume: 5MB, portfolio: 10MB each)
- File type validation (PDF, DOCX for resumes)
- Virus scanning (Supabase has built-in scanning)

### Data Validation
- Email validation before insert
- Phone number format validation
- Required field enforcement
- XSS protection on user input

---

## 📊 Success Metrics

### Workflow Completion Rates
- HR Form → Business Form completion: Target >80%
- Business Form → JD Published: Target >70%
- Published Position → First Application: Target <7 days

### User Experience
- Public job page load time: <2s
- Application submission success rate: >95%
- File upload success rate: >98%

### Admin Efficiency
- Time to publish position: <10 minutes
- Custom questions setup: <5 minutes per position
- Candidate review time: <2 minutes per applicant

---

## 🎯 Next Steps

**Immediate Action:** Start with Sprint 1 (Database + Core Publishing)

**Questions to Confirm:**
1. Should we allow multiple file uploads for portfolio? (Currently designed for array)
2. Max number of custom questions per position? (Suggest: 10)
3. Should published positions have an expiration date? (Auto-unpublish after X days)
4. Email notifications for new applications? (Requires email service integration)

This architecture provides a complete, production-ready ATS publishing workflow matching standard industry practices.
