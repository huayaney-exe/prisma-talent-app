# Forms & Database Architecture Analysis

**Objective**: Comprehensive analysis of current form-to-database integration strategy and required changes for Supabase direct integration.

---

## Current Architecture Overview

### **Two-Tier Architecture**

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend  │─────▶│ FastAPI      │─────▶│   Supabase   │
│   (React)   │      │   Backend    │      │  (Postgres)  │
└─────────────┘      └──────────────┘      └──────────────┘
   Forms (4)          REST API (2)         Database Tables
```

### **Current Flow**
1. **User submits form** → Frontend validates with Zod
2. **Frontend calls** → `api.post('/leads')` via Axios
3. **FastAPI receives** → Validates with Pydantic
4. **FastAPI writes** → Supabase via Python SDK
5. **Response returns** → Success message to frontend

---

## Problem Statement

**Issue**: Forms are configured to use FastAPI backend, but we want **direct Supabase integration** from frontend for:
- ✅ Reduced latency (no backend hop)
- ✅ Simpler deployment (frontend-only for MVP)
- ✅ Leverage Supabase RLS (Row Level Security)
- ✅ Real-time capabilities (Supabase subscriptions)
- ✅ Faster iteration (no backend changes needed)

**Current State**:
- ✅ Admin pages already use direct Supabase (Phase 5)
- ❌ Public forms still call FastAPI backend
- ❌ Schema mismatch between FastAPI models and database

---

## Forms Inventory & Analysis

### **Form 1: LeadForm** (Contact/Lead Submission)

**Location**: `frontend/src/components/forms/LeadForm.tsx`

**Current Integration**:
```typescript
// Line 84: Uses API client (FastAPI)
await leadService.submitLead(data)

// leadService.ts - Line 13:
async submitLead(data: Lead): Promise<LeadResponse> {
  const response = await api.post<LeadResponse>('/leads', data)
  return response.data
}
```

**FastAPI Endpoint**: `POST /api/v1/leads`
**Backend Service**: `backend/app/services/lead_service.py`

**Form Fields** (13 fields):
```typescript
{
  contact_name: string          // ✅ Required
  contact_email: string         // ✅ Required
  contact_phone: string         // ✅ Required
  contact_position: string      // ✅ Required
  company_name: string          // ✅ Required
  industry?: string             // Optional
  company_size?: CompanySize    // Optional
  intent: Intent                // ✅ Required ('hiring' | 'conversation')
  role_title?: string           // Conditional (if intent = 'hiring')
  role_type?: string            // Conditional
  seniority?: string            // Conditional
  work_mode?: WorkMode          // Conditional
  urgency?: Urgency             // Conditional
}
```

**Database Table**: `leads`

**Schema Mismatch**:
```sql
-- Current table (010_admin_mvp_schema.sql):
CREATE TABLE leads (
  id UUID,
  contact_name TEXT NOT NULL,       -- ✅ Match
  contact_email TEXT NOT NULL,      -- ✅ Match
  company_name TEXT NOT NULL,       -- ✅ Match
  intent TEXT NOT NULL,             -- ✅ Match
  role_title TEXT,                  -- ✅ Match
  status TEXT DEFAULT 'pending',   -- ✅ Auto-set
  created_at TIMESTAMP,            -- ✅ Auto-set
  updated_at TIMESTAMP             -- ✅ Auto-set
);

-- ❌ MISSING FIELDS:
-- contact_phone, contact_position, industry,
-- company_size, role_type, seniority, work_mode, urgency
```

**FastAPI Creates**: `companies` table (not `leads`)
```python
# Backend creates company record with subscription_status = 'lead'
company_result = self.db.table("companies").insert({
    "company_name": lead_data.company_name,
    "subscription_status": "lead",  # This is the "lead"
    ...
})
```

**⚠️ Critical Issue**: Form expects `leads` table, but FastAPI writes to `companies` table!

---

### **Form 2: HRForm** (Position Requisition - Step 1)

**Location**: `frontend/src/components/forms/HRForm.tsx`

**Current Integration**:
```typescript
// Line 80-88: Uses API client
const response = await positionService.createPosition(data)
setPositionCode(response.position_code)
```

**Expected Endpoint**: `POST /api/v1/positions` (NOT YET IMPLEMENTED)

**Form Fields** (16 fields):
```typescript
{
  position_name: string           // ✅ Required
  area: Area                      // ✅ Required
  seniority: Seniority           // ✅ Required
  business_user_name: string      // ✅ Required (Leader name)
  business_user_position: string  // ✅ Required (Leader title)
  business_user_email: string     // ✅ Required
  salary_range: string            // ✅ Required
  equity_included: boolean        // ✅ Required
  equity_details?: string         // Conditional
  contract_type: ContractType     // ✅ Required
  target_fill_date: string        // ✅ Required
  position_type: PositionType     // ✅ Required
  critical_notes?: string         // Optional
  hr_user_name: string           // ✅ Required (Form submitter)
  hr_user_email: string          // ✅ Required
}
```

**Database Table**: `positions`

**Schema Match**: ✅ **EXCELLENT** - Matches 001_initial_schema.sql perfectly
```sql
CREATE TABLE positions (
  id UUID,
  company_id UUID,                  -- ✅ (needs auth context)
  position_code TEXT,               -- ✅ Auto-generated
  workflow_stage TEXT DEFAULT 'hr_draft',  -- ✅ Auto-set
  position_name TEXT NOT NULL,      -- ✅ Match
  area TEXT NOT NULL,               -- ✅ Match
  seniority TEXT NOT NULL,          -- ✅ Match
  leader_name TEXT NOT NULL,        -- ✅ Match (business_user_name)
  leader_position TEXT NOT NULL,    -- ✅ Match (business_user_position)
  leader_email TEXT NOT NULL,       -- ✅ Match (business_user_email)
  salary_range TEXT NOT NULL,       -- ✅ Match
  equity_included BOOLEAN,          -- ✅ Match
  equity_details TEXT,              -- ✅ Match
  contract_type TEXT NOT NULL,      -- ✅ Match
  timeline DATE NOT NULL,           -- ✅ Match (target_fill_date)
  position_type TEXT NOT NULL,      -- ✅ Match
  critical_notes TEXT,              -- ✅ Match
  created_by UUID NOT NULL,         -- ✅ (needs auth context)
  created_at TIMESTAMP,             -- ✅ Auto-set
  updated_at TIMESTAMP              -- ✅ Auto-set
);
```

**⚠️ Issues**:
- Missing FastAPI endpoint (not implemented yet)
- Needs `company_id` and `created_by` from auth context
- Form has `hr_user_name` + `hr_user_email` but table expects `created_by` UUID

---

### **Form 3: BusinessLeaderForm** (Position Details - Step 2)

**Location**: `frontend/src/components/forms/BusinessLeaderForm.tsx`

**Current Integration**: Similar to HRForm, expects `PATCH /api/v1/positions/:code`

**Form Fields** (10+ area-specific fields):
```typescript
{
  // Universal fields
  work_arrangement: string
  core_hours: string
  meeting_culture: string
  team_size: number
  autonomy_level: string
  mentoring_required: boolean
  execution_level: string
  success_kpi: string

  // Area-specific (JSONB)
  area_specific_data: {
    // Product Management specific
    product_discovery_approach?: string
    stakeholder_management?: string
    ...
    // Engineering specific
    tech_stack?: string[]
    ...
  }
}
```

**Database Table**: `positions` (UPDATE)

**Schema Match**: ✅ **PERFECT** - Uses JSONB for flexibility
```sql
-- Universal fields exist
work_arrangement TEXT,
core_hours TEXT,
meeting_culture TEXT,
team_size INTEGER,
autonomy_level TEXT,
mentoring_required BOOLEAN,
hands_on_vs_strategic TEXT,      -- matches execution_level
success_kpi TEXT,

-- Flexible storage
area_specific_data JSONB DEFAULT '{}',  -- ✅ Perfect for area variations
```

**⚠️ Issues**:
- Missing FastAPI endpoint for update
- Needs to update existing position by `position_code`

---

### **Form 4: ApplicationForm** (Candidate Application)

**Location**: `frontend/src/pages/ApplicationFormPage.tsx`

**Current Integration**: Likely expects `POST /api/v1/applications` or `POST /api/v1/applicants`

**Form Fields** (10+ fields):
```typescript
{
  full_name: string               // ✅ Required
  email: string                   // ✅ Required
  phone: string                   // ✅ Required
  linkedin_url?: string           // Optional
  portfolio_url?: string          // Optional
  location?: string               // Optional
  cover_letter?: string           // Optional
  resume_file: File               // ✅ Required (needs upload)
  portfolio_files?: File[]        // Optional (needs upload)
  position_code: string           // ✅ Required (from URL)
}
```

**Database Table**: `applicants`

**Schema Match**: ✅ **GOOD** - Most fields exist
```sql
CREATE TABLE applicants (
  id UUID,
  company_id UUID NOT NULL,         -- ✅ (from position lookup)
  position_id UUID NOT NULL,        -- ✅ (from position_code)
  full_name TEXT NOT NULL,          -- ✅ Match
  email TEXT NOT NULL,              -- ✅ Match
  phone TEXT,                       -- ✅ Match
  linkedin_url TEXT,                -- ✅ Match
  portfolio_url TEXT,               -- ✅ Match
  location TEXT,                    -- ✅ Match
  cover_letter TEXT,                -- ✅ Match
  resume_url TEXT,                  -- ✅ Match (after upload)
  portfolio_files JSONB DEFAULT '[]',  -- ✅ Match (array of URLs)
  source_type TEXT DEFAULT 'direct_application',  -- ✅ Auto-set
  application_status TEXT DEFAULT 'applied',  -- ✅ Auto-set
  applied_at TIMESTAMP,             -- ✅ Auto-set (or submitted_at)
  created_at TIMESTAMP,             -- ✅ Auto-set
  updated_at TIMESTAMP              -- ✅ Auto-set
);
```

**⚠️ Issues**:
- Needs file upload to Supabase Storage (`cvs` bucket)
- Needs `company_id` and `position_id` from `position_code` lookup
- RLS policy allows anon insert (✅ already configured)

---

## FastAPI Backend Analysis

### **Existing Endpoints**

#### `POST /api/v1/leads`
**File**: `backend/app/api/v1/leads.py`
**Service**: `backend/app/services/lead_service.py`
**Table**: `companies` (NOT `leads`)

**What it does**:
1. Creates `companies` record with `subscription_status = 'lead'`
2. Sends confirmation email to lead
3. Sends notification email to Prisma admin
4. Returns `company_id`

**Schema**:
```python
# backend/app/models/lead.py
class LeadCreate(BaseModel):
    contact_name: str
    position: str              # contact_position
    company_name: str
    contact_email: str
    contact_phone: str
    intent: str
    role_title: Optional[str]
    role_type: Optional[str]
    level: Optional[str]       # seniority
    work_mode: Optional[str]
    urgency: Optional[str]
    terms_acceptance: bool
```

#### `POST /api/v1/enrollment`
**File**: `backend/app/api/v1/enrollment.py`
**Service**: `backend/app/services/enrollment_service.py`
**Tables**: `companies` + `hr_users`

**What it does**:
1. Creates `companies` record with `subscription_status = 'active'`
2. Creates first `hr_users` record (company admin)
3. Sends onboarding email

**⚠️ NOT USED by public forms** - This is for Prisma admin to manually enroll clients

---

### **Missing Endpoints** (Phase 3 - Never Implemented)

❌ `POST /api/v1/positions` - Create position (HRForm)
❌ `PATCH /api/v1/positions/:code` - Update position (BusinessLeaderForm)
❌ `POST /api/v1/applicants` - Submit application (ApplicationForm)
❌ `POST /api/v1/upload/resume` - Upload CV file

---

## Recommended Architecture Change

### **Option A: Direct Supabase Integration (RECOMMENDED)**

**Pros**:
- ✅ Simpler deployment (no backend needed for MVP)
- ✅ Faster (no API hop)
- ✅ Leverage Supabase RLS for security
- ✅ Real-time capabilities (if needed later)
- ✅ Consistent with admin pages (Phase 5)
- ✅ Supabase Storage for file uploads

**Cons**:
- ❌ No email notifications (unless we use Supabase Edge Functions)
- ❌ Business logic in frontend (lead enrichment, validation)
- ❌ No server-side rate limiting

**Implementation**:
```typescript
// leadService.ts - NEW METHOD
async submitLeadDirect(data: Lead) {
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      contact_position: data.contact_position,
      company_name: data.company_name,
      industry: data.industry,
      company_size: data.company_size,
      intent: data.intent,
      role_title: data.role_title,
      role_type: data.role_type,
      seniority: data.seniority,
      work_mode: data.work_mode,
      urgency: data.urgency,
      status: 'pending',  // Default
    })
    .select()
    .single()

  if (error) throw error
  return lead
}
```

---

### **Option B: Keep FastAPI Backend**

**Pros**:
- ✅ Email notifications built-in
- ✅ Server-side validation
- ✅ Business logic centralized
- ✅ Rate limiting and security
- ✅ Can add complex workflows (AI, integrations)

**Cons**:
- ❌ Extra deployment (frontend + backend)
- ❌ Increased latency
- ❌ More maintenance
- ❌ Backend dev required for changes

**Implementation**:
- Fix schema mismatch (create `leads` table vs `companies`)
- Complete missing endpoints (positions, applicants)
- Deploy to Render/Railway/Fly.io

---

### **Option C: Hybrid Approach (BEST FOR PRODUCTION)**

**Use Direct Supabase for**:
- ✅ Lead submissions (`leads` table)
- ✅ Position creation/updates (`positions` table)
- ✅ Application submissions (`applicants` table)
- ✅ File uploads (Supabase Storage)

**Use FastAPI Backend for**:
- ✅ Email notifications (Supabase Edge Function or separate service)
- ✅ AI job description generation
- ✅ Complex business logic (later phases)
- ✅ Third-party integrations (LinkedIn, etc.)

**Best of Both Worlds**:
```typescript
// Submit directly to Supabase
const lead = await supabase.from('leads').insert(data)

// Then trigger async email via Edge Function or backend webhook
await supabase.functions.invoke('send-lead-email', { body: lead })
```

---

## Required Database Schema Changes

### **1. Expand `leads` Table** (Match LeadForm)

```sql
-- Add missing fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_position TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_size TEXT
  CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS role_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS seniority TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS work_mode TEXT
  CHECK (work_mode IN ('remote', 'hybrid', 'onsite'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS urgency TEXT
  CHECK (urgency IN ('immediate', '1-2-weeks', '1-month+', 'not-urgent'));

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_intent ON leads(intent);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
```

### **2. No Changes Needed for `positions`**
✅ Schema already perfect (001_initial_schema.sql)

### **3. No Changes Needed for `applicants`**
✅ Schema already perfect, but need to add `cv_url` alias:
```sql
-- Already done in 010_admin_mvp_schema.sql
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS cv_url TEXT;
```

---

## File Upload Strategy (Supabase Storage)

### **Setup Storage Bucket**

```sql
-- Already done in 011_admin_rls_policies.sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;
```

### **Upload Flow**

```typescript
// applicantService.ts
async uploadCV(file: File, applicantId: string) {
  const fileName = `${applicantId}/${Date.now()}_${file.name}`

  const { data, error } = await supabase.storage
    .from('cvs')
    .upload(fileName, file)

  if (error) throw error

  // Get public URL (or signed URL for private)
  const { data: { publicUrl } } = supabase.storage
    .from('cvs')
    .getPublicUrl(fileName)

  return publicUrl
}

// Then update applicant record
await supabase
  .from('applicants')
  .update({ cv_url: publicUrl, resume_url: publicUrl })
  .eq('id', applicantId)
```

---

## Action Plan

### **Phase 6A: Schema Updates** (Immediate)

1. ✅ Run schema migration for `leads` table expansion
2. ✅ Verify RLS policies cover new fields
3. ✅ Add indexes for performance
4. ✅ Test with sample data

**Files to Create**:
- `database/migrations/012_leads_table_expansion.sql`

---

### **Phase 6B: Service Layer Updates** (1-2 hours)

1. Update `leadService.ts`:
   - Add `submitLeadDirect()` method using Supabase
   - Keep `submitLead()` for backward compatibility (calls FastAPI)
   - Add toggle in config: `USE_DIRECT_SUPABASE`

2. Update `positionService.ts`:
   - Add `createPosition()` method using Supabase
   - Add `updatePosition()` for BusinessLeaderForm

3. Update `applicantService.ts`:
   - Add `submitApplication()` method
   - Add `uploadCV()` for file handling

4. Create `uploadService.ts`:
   - Centralized file upload logic
   - CV validation (size, type)
   - Error handling

**Files to Update**:
- `frontend/src/services/leadService.ts`
- `frontend/src/services/positionService.ts`
- `frontend/src/services/applicantService.ts`
- `frontend/src/services/uploadService.ts` (new)

---

### **Phase 6C: Form Integration** (2-3 hours)

1. **LeadForm.tsx**:
   - Switch from `api.post()` to `leadService.submitLeadDirect()`
   - Test form submission
   - Verify data appears in admin dashboard

2. **HRForm.tsx**:
   - Implement `positionService.createPosition()`
   - Handle auth context (`created_by`, `company_id`)
   - Test position creation

3. **BusinessLeaderForm.tsx**:
   - Implement `positionService.updatePosition()`
   - Match `position_code` from URL
   - Test position updates

4. **ApplicationFormPage.tsx**:
   - Implement file upload flow
   - Submit to `applicantService.submitApplication()`
   - Test end-to-end application

---

### **Phase 6D: Email Notifications** (Optional - Later)

**Option 1**: Supabase Edge Functions
```typescript
// supabase/functions/send-lead-email/index.ts
Deno.serve(async (req) => {
  const lead = await req.json()
  await sendEmailViaResend(lead)
  return new Response('OK')
})
```

**Option 2**: Database Triggers + Webhooks
```sql
-- Trigger on lead insert
CREATE TRIGGER on_lead_insert
AFTER INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION notify_webhook('https://api.example.com/webhooks/lead');
```

**Option 3**: Keep FastAPI for emails only
```typescript
// After Supabase insert, call backend for email
await api.post('/emails/lead-confirmation', { leadId })
```

---

## Migration Path (Recommended)

### **Week 1: Direct Supabase (MVP)**
1. Expand `leads` schema ✅
2. Update service layer ✅
3. Connect forms to Supabase ✅
4. Deploy frontend to Vercel ✅
5. **Result**: Working MVP without backend

### **Week 2: Email Notifications**
1. Add Supabase Edge Function for emails
2. Integrate Resend API
3. Test email flow
4. **Result**: Complete user experience

### **Week 3: Backend Enhancements (If Needed)**
1. Deploy FastAPI backend for complex features
2. Add AI job description generation
3. Add third-party integrations
4. **Result**: Production-ready with advanced features

---

## Conclusion

**Recommendation**: **Option A (Direct Supabase)** for MVP, then **Option C (Hybrid)** for production.

### **Why Direct Supabase First?**
1. ✅ Faster to market (no backend deployment)
2. ✅ Admin pages already use it (consistency)
3. ✅ RLS provides security
4. ✅ Cheaper to run (no backend hosting)
5. ✅ Can add backend incrementally later

### **Next Immediate Actions**:
1. Create `012_leads_table_expansion.sql`
2. Update service layer with `submitLeadDirect()` methods
3. Connect `LeadForm.tsx` to new method
4. Test end-to-end lead submission
5. Repeat for other 3 forms

**Estimated Time**: 4-6 hours for full migration
**Risk**: Low (can keep FastAPI as fallback)
**Impact**: High (complete MVP functionality)
