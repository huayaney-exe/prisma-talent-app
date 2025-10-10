# Prisma Talent Platform - Production Architecture & Implementation Guide

**Architecture Philosophy**: Test-Driven, Production-Grade, Silicon Valley Standards
**Tech Stack**: FastAPI + React + Supabase + Vercel + Render
**Status**: Implementation-Ready Architecture (MVP - Manual JD Creation)
**Last Updated**: January 2025

> **⚠️ MVP SCOPE**: AI job description generation is **deferred to post-MVP**. Prisma admins will manually write job descriptions using a rich text editor.

---

## 📋 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack & Justification](#technology-stack--justification)
3. [Database Architecture](#database-architecture)
4. [Backend API Architecture (FastAPI)](#backend-api-architecture-fastapi)
5. [Frontend Architecture (React + TypeScript)](#frontend-architecture-react--typescript)
6. [Testing Strategy (TDD Approach)](#testing-strategy-tdd-approach)
7. [Implementation Checklist (4 Phases)](#implementation-checklist-4-phases)
8. [Deployment Architecture](#deployment-architecture)
9. [Quality Gates & Success Criteria](#quality-gates--success-criteria)

---

## 🏗️ System Architecture Overview

### **High-Level Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Vercel)                                               │
│  ├─ Public Site (React + TypeScript)                            │
│  │  ├─ Landing Page (Lead Capture)                              │
│  │  ├─ Job Listings (/job/{code})                               │
│  │  └─ Application Forms (/apply/{code})                        │
│  │                                                               │
│  ├─ Client Dashboard (React + TypeScript)                       │
│  │  ├─ HR User Portal                                           │
│  │  └─ Business User Forms                                      │
│  │                                                               │
│  └─ Admin Dashboard (React + TypeScript)                        │
│     ├─ Lead Management                                          │
│     ├─ Client Enrollment                                        │
│     ├─ Position Pipeline                                        │
│     └─ Candidate Qualification                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/REST API
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Backend API (Render - FastAPI + Python 3.11+)                  │
│  ├─ API Gateway (FastAPI Router)                                │
│  ├─ Authentication Middleware (Supabase Auth)                   │
│  ├─ Rate Limiting & Security (SlowAPI)                          │
│  │                                                               │
│  ├─ Core Services                                               │
│  │  ├─ Email Service (Resend)                                   │
│  │  ├─ Storage Service (Supabase Storage)                       │
│  │  └─ Analytics Service (PostHog)                              │
│  │  # AI Service (OpenAI) - Post-MVP Feature                    │
│  │                                                               │
│  ├─ Business Logic Layer                                        │
│  │  ├─ Lead Management                                          │
│  │  ├─ Client Lifecycle                                         │
│  │  ├─ Position Workflow                                        │
│  │  ├─ Candidate Processing                                     │
│  │  └─ Notification Orchestration                               │
│  │                                                               │
│  └─ Data Access Layer (Repository Pattern)                      │
│     ├─ Company Repository                                       │
│     ├─ Position Repository                                      │
│     ├─ Applicant Repository                                     │
│     └─ Admin Repository                                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Supabase Client SDK
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Auth + Storage)                         │
│  ├─ PostgreSQL Database                                         │
│  │  ├─ Core Tables (8 tables)                                   │
│  │  ├─ Row-Level Security (RLS)                                 │
│  │  └─ Indexes & Constraints                                    │
│  │                                                               │
│  ├─ Supabase Auth                                               │
│  │  ├─ JWT-based authentication                                 │
│  │  ├─ Role-based access control                                │
│  │  └─ Magic link & password auth                               │
│  │                                                               │
│  └─ Supabase Storage                                            │
│     └─ Resume uploads (/resumes/{position}/{applicant})         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ External APIs
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│  ├─ Resend (Email Service)                                      │
│  ├─ OpenAI (GPT-4 for Job Descriptions)                         │
│  ├─ PostHog (Analytics)                                         │
│  └─ Sentry (Error Tracking)                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack & Justification

### **Backend: FastAPI (Python 3.11+)**

**Why FastAPI?**
- ⚡ **Performance**: Async/await support, one of the fastest Python frameworks (comparable to Node.js)
- 📚 **Auto-Documentation**: OpenAPI (Swagger) + ReDoc automatically generated
- 🔒 **Type Safety**: Pydantic models for request/response validation
- 🚀 **Production-Ready**: Used by Netflix, Microsoft, Uber
- 🧪 **Testing**: Built-in test client, excellent pytest integration
- 📦 **Modern Python**: Leverages Python 3.11+ performance improvements

**Core Dependencies (MVP)**:
```python
# pyproject.toml (Poetry)
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.109.0"
uvicorn = {extras = ["standard"], version = "^0.27.0"}
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
supabase = "^2.3.0"
resend = "^0.7.0"
slowapi = "^0.1.9"  # Rate limiting
python-jose = {extras = ["cryptography"], version = "^3.3.0"}  # JWT
python-multipart = "^0.0.6"  # File uploads
httpx = "^0.26.0"  # Async HTTP client
structlog = "^24.1.0"  # Structured logging
sentry-sdk = {extras = ["fastapi"], version = "^1.39.0"}
# openai = "^1.10.0"  # Post-MVP: AI job description generation

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.23.0"
pytest-cov = "^4.1.0"
httpx = "^0.26.0"  # For TestClient
faker = "^22.0.0"  # Test data generation
black = "^24.1.0"  # Code formatting
ruff = "^0.1.0"  # Linting
mypy = "^1.8.0"  # Type checking
```

---

### **Frontend: React 18 + TypeScript + Vite**

**Why React + TypeScript?**
- 💪 **Type Safety**: Catch errors at compile time, not runtime
- 🏢 **Industry Standard**: Most popular frontend stack in Silicon Valley
- ⚡ **Vite**: Lightning-fast HMR and build times
- 📦 **Component Ecosystem**: Vast library of production-ready components
- 🧪 **Testing**: React Testing Library + Vitest for fast unit tests

**Core Dependencies**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.49.0",
    "@headlessui/react": "^1.7.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "prettier": "^3.2.0"
  }
}
```

---

### **Database: Supabase (PostgreSQL + Auth + Storage)**

**Why Supabase?**
- 🗄️ **PostgreSQL**: Industry-standard relational database
- 🔐 **Built-in Auth**: JWT-based, role-based access control
- 📦 **Storage**: S3-compatible file storage
- 🚀 **Realtime**: PostgreSQL change data capture (future feature)
- 🔒 **Row-Level Security**: Multi-tenant isolation at database level
- 💰 **Cost-Effective**: Free tier sufficient for MVP, scales predictably

---

### **Email: Resend**

**Why Resend?**
- 🚀 **Developer-First**: Best-in-class API design
- 📧 **Deliverability**: High inbox placement rates
- 🎨 **React Email**: Type-safe email templates
- 📊 **Analytics**: Built-in open/click tracking
- 💰 **Pricing**: 100 emails/day free, $20/month for 50K

---

### **~~AI: OpenAI GPT-4~~ (Post-MVP Feature)**

**Deferred to Post-MVP**:
- **MVP Approach**: Prisma admin manually writes job descriptions using rich text editor
- **Rationale**: Faster to market, better quality control, learn what makes good JDs
- **Future Enhancement**: AI-assisted generation once we have 20+ examples to train on
- **Estimated Cost (when implemented)**: ~$0.01-0.03 per job description

---

## 🗄️ Database Architecture

### **Enhanced Schema (8 Core Tables)**

#### **1. `prisma_admins` (NEW)** - Prisma Internal Users
```sql
CREATE TABLE IF NOT EXISTS prisma_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id),

  -- Authorization
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions JSONB DEFAULT '{"can_enroll_clients": true, "can_publish_positions": true, "can_qualify_candidates": true}',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES prisma_admins(id)
);

-- Indexes
CREATE INDEX idx_prisma_admins_email ON prisma_admins(email);
CREATE INDEX idx_prisma_admins_auth_user_id ON prisma_admins(auth_user_id);
CREATE INDEX idx_prisma_admins_is_active ON prisma_admins(is_active);
```

#### **2. `companies` - Business Clients**
```sql
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Data
  company_name TEXT NOT NULL,
  company_domain TEXT UNIQUE NOT NULL,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),

  -- Business Details
  website_url TEXT,
  linkedin_url TEXT,
  company_description TEXT,
  logo_url TEXT,

  -- Subscription
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('lead', 'trial', 'active', 'suspended', 'cancelled')),
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
  trial_end_date TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),

  -- Primary Contact (from lead form)
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT,
  primary_contact_position TEXT,

  -- Onboarding
  lead_source TEXT CHECK (lead_source IN ('landing_page', 'referral', 'outbound', 'event', 'other')),
  lead_submitted_at TIMESTAMP,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES prisma_admins(id),
  enrolled_by UUID REFERENCES prisma_admins(id)
);

-- Indexes
CREATE INDEX idx_companies_domain ON companies(company_domain);
CREATE INDEX idx_companies_subscription_status ON companies(subscription_status);
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);
```

#### **3. `hr_users` - Client HR Team Members**
```sql
CREATE TABLE IF NOT EXISTS hr_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identity
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  position_title TEXT,
  phone TEXT,
  auth_user_id UUID REFERENCES auth.users(id),

  -- Authorization
  role TEXT DEFAULT 'hr_user' CHECK (role IN ('company_admin', 'hr_manager', 'hr_user')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,

  -- Permissions
  can_create_positions BOOLEAN DEFAULT TRUE,
  can_manage_team BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID, -- Can be prisma_admin or another hr_user
  invitation_accepted_at TIMESTAMP,
  invitation_token TEXT UNIQUE
);

-- Indexes
CREATE INDEX idx_hr_users_company_id ON hr_users(company_id);
CREATE INDEX idx_hr_users_email ON hr_users(email);
CREATE INDEX idx_hr_users_auth_user_id ON hr_users(auth_user_id);
CREATE INDEX idx_hr_users_is_active ON hr_users(is_active, company_id);
```

#### **4. `positions` - Job Openings (Enhanced)**
```sql
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  position_code TEXT UNIQUE NOT NULL DEFAULT ('POS_' || upper(substring(gen_random_uuid()::text, 1, 8))),

  -- Workflow Tracking (MVP - No AI stages)
  workflow_stage TEXT DEFAULT 'hr_draft' CHECK (workflow_stage IN (
    'hr_draft',           -- HR started but not submitted
    'hr_completed',       -- HR form submitted
    'business_notified',  -- Business user emailed
    'business_in_progress', -- Business user opened form
    'business_completed', -- Business form submitted
    'jd_writing',         -- Prisma admin writing JD manually
    'jd_draft',           -- JD draft saved (not published)
    'active',             -- Published with JD, accepting applications
    'shortlisting',       -- Prisma qualifying candidates
    'shortlist_sent',     -- Top 3-5 sent to client
    'interviewing',       -- Client interviewing candidates
    'filled',             -- Position closed - hire made
    'cancelled'           -- Position cancelled
  )),

  -- HR Form Fields
  position_name TEXT NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('product-management', 'engineering-tech', 'growth', 'design')),
  seniority TEXT NOT NULL CHECK (seniority IN ('mid-level', 'senior', 'lead-staff', 'director+')),

  -- Business User Info (from HR form)
  business_user_name TEXT NOT NULL,
  business_user_position TEXT NOT NULL,
  business_user_email TEXT NOT NULL,

  -- Position Details
  salary_range TEXT NOT NULL,
  equity_included BOOLEAN DEFAULT FALSE,
  equity_details TEXT,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('full-time', 'part-time', 'contract')),
  target_fill_date DATE NOT NULL,
  position_type TEXT NOT NULL CHECK (position_type IN ('new', 'replacement')),
  critical_notes TEXT,

  -- Business Form Fields (Universal)
  work_arrangement TEXT, -- remote/hybrid/onsite
  core_hours TEXT,
  meeting_culture TEXT,
  team_size INTEGER,
  autonomy_level TEXT,
  mentoring_required BOOLEAN,
  execution_level TEXT, -- hands-on vs strategic
  success_kpi TEXT,

  -- Area-Specific Data (JSONB)
  area_specific_data JSONB DEFAULT '{}',

  -- Job Description
  job_description_id UUID REFERENCES job_descriptions(id),
  public_url TEXT UNIQUE, -- e.g., https://talent.getprisma.io/job/POS_ABC123
  published_at TIMESTAMP,

  -- Metrics
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  shortlist_size INTEGER DEFAULT 0,

  -- Timestamps
  hr_completed_at TIMESTAMP,
  business_notified_at TIMESTAMP,
  business_completed_at TIMESTAMP,
  jd_draft_created_at TIMESTAMP,
  jd_completed_at TIMESTAMP,       -- When admin finished writing JD
  shortlist_sent_at TIMESTAMP,
  filled_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES hr_users(id),
  published_by UUID REFERENCES prisma_admins(id)
);

-- Indexes
CREATE INDEX idx_positions_company_id ON positions(company_id);
CREATE INDEX idx_positions_position_code ON positions(position_code);
CREATE INDEX idx_positions_workflow_stage ON positions(workflow_stage);
CREATE INDEX idx_positions_area ON positions(area);
CREATE INDEX idx_positions_active ON positions(workflow_stage) WHERE workflow_stage = 'active';
CREATE INDEX idx_positions_created_at ON positions(created_at DESC);
```

#### **5. `job_descriptions` - AI-Generated JDs**
```sql
CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,

  -- Content (MVP: All manually written by Prisma admin)
  content TEXT NOT NULL,           -- Job description content (rich text HTML)
  draft_content TEXT,              -- Auto-saved draft

  -- Metadata (MVP: No AI generation)
  -- Post-MVP: Add ai_generated_content, ai_model, tokens, cost fields

  -- Status (MVP: Simplified workflow)
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES prisma_admins(id),  -- Admin who wrote it
  published_at TIMESTAMP,
  published_by UUID REFERENCES prisma_admins(id)
);

-- Indexes
CREATE INDEX idx_job_descriptions_position_id ON job_descriptions(position_id);
CREATE INDEX idx_job_descriptions_status ON job_descriptions(status);
```

#### **6. `applicants` - Candidate Applications**
```sql
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Personal Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,

  -- Professional Info
  current_role TEXT,
  current_company TEXT,
  years_experience INTEGER,

  -- Application
  motivation TEXT, -- Why interested (500 chars)
  resume_url TEXT NOT NULL, -- Supabase Storage path
  portfolio_links JSONB DEFAULT '[]', -- Array of URLs

  -- Source Tracking
  application_source TEXT DEFAULT 'direct' CHECK (application_source IN (
    'direct',              -- Direct application from public page
    'community_referral',  -- Referred by Prisma community member
    'prisma_sourced',      -- Sourced by Prisma team
    'linkedin',            -- Found via LinkedIn
    'other'
  )),
  referrer_name TEXT,
  referrer_email TEXT,

  -- Qualification (Prisma Admin Actions)
  application_status TEXT DEFAULT 'new' CHECK (application_status IN (
    'new',                 -- Just submitted
    'under_review',        -- Prisma reviewing
    'shortlisted',         -- Top 3-5 candidates
    'sent_to_client',      -- Included in shortlist email
    'interviewing',        -- Client interviewing
    'rejected',            -- Not a fit
    'hired',               -- Got the job
    'withdrew'             -- Candidate withdrew
  )),

  -- Prisma Scoring
  skills_match_score INTEGER CHECK (skills_match_score BETWEEN 1 AND 5),
  experience_score INTEGER CHECK (experience_score BETWEEN 1 AND 5),
  cultural_fit_score INTEGER CHECK (cultural_fit_score BETWEEN 1 AND 5),
  overall_score DECIMAL(3, 2), -- Average of above

  -- Prisma Notes
  prisma_notes TEXT,
  rejection_reason TEXT,

  -- Timestamps
  applied_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  shortlisted_at TIMESTAMP,
  sent_to_client_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  reviewed_by UUID REFERENCES prisma_admins(id),
  shortlisted_by UUID REFERENCES prisma_admins(id)
);

-- Indexes
CREATE INDEX idx_applicants_position_id ON applicants(position_id);
CREATE INDEX idx_applicants_company_id ON applicants(company_id);
CREATE INDEX idx_applicants_application_status ON applicants(application_status);
CREATE INDEX idx_applicants_email ON applicants(email);
CREATE INDEX idx_applicants_overall_score ON applicants(overall_score DESC NULLS LAST);
CREATE INDEX idx_applicants_applied_at ON applicants(applied_at DESC);
```

#### **7. `application_activities` - Activity Log**
```sql
CREATE TABLE IF NOT EXISTS application_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Activity
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'application_submitted',
    'status_changed',
    'note_added',
    'email_sent',
    'score_updated',
    'shortlist_added',
    'shortlist_sent',
    'interview_scheduled',
    'hired',
    'rejected'
  )),
  activity_description TEXT NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Flexible data (old_status, new_status, score_details, etc.)

  -- Actor
  performed_by UUID, -- Can be prisma_admin, hr_user, or NULL (system)
  performed_by_type TEXT CHECK (performed_by_type IN ('prisma_admin', 'hr_user', 'system', 'candidate')),

  -- Audit
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activities_position_id ON application_activities(position_id, created_at DESC);
CREATE INDEX idx_activities_applicant_id ON application_activities(applicant_id, created_at DESC);
CREATE INDEX idx_activities_activity_type ON application_activities(activity_type);
CREATE INDEX idx_activities_created_at ON application_activities(created_at DESC);
```

#### **8. `email_communications` - Email Tracking**
```sql
CREATE TABLE IF NOT EXISTS email_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  applicant_id UUID REFERENCES applicants(id) ON DELETE SET NULL,

  -- Email Details
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_type TEXT CHECK (recipient_type IN ('hr_user', 'business_user', 'prisma_admin', 'candidate')),

  -- Content
  email_type TEXT NOT NULL CHECK (email_type IN (
    'client_onboarding',
    'business_user_request',
    'business_specs_completed',
    'prisma_admin_jd_required',
    'position_published',
    'application_received',
    'shortlist_sent',
    'interview_scheduled',
    'candidate_rejected'
  )),
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_version TEXT DEFAULT 'v1.0',

  -- Delivery
  resend_email_id TEXT UNIQUE, -- Resend API ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounce_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Template variables, tracking data

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  sent_by UUID REFERENCES prisma_admins(id)
);

-- Indexes
CREATE INDEX idx_emails_position_id ON email_communications(position_id);
CREATE INDEX idx_emails_recipient_email ON email_communications(recipient_email);
CREATE INDEX idx_emails_email_type ON email_communications(email_type);
CREATE INDEX idx_emails_status ON email_communications(status);
CREATE INDEX idx_emails_sent_at ON email_communications(sent_at DESC);
```

---

### **Row-Level Security (RLS) Policies**

```sql
-- Enable RLS on all tables
ALTER TABLE prisma_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_communications ENABLE ROW LEVEL SECURITY;

-- Prisma Admins: Full access
CREATE POLICY "Prisma admins have full access"
  ON prisma_admins FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Prisma admins can manage all companies"
  ON companies FOR ALL
  USING (true)
  WITH CHECK (true);

-- HR Users: Scoped to their company
CREATE POLICY "HR users can view their company"
  ON companies FOR SELECT
  USING (id IN (
    SELECT company_id FROM hr_users
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "HR users can view their company team"
  ON hr_users FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM hr_users
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "HR users can view their company positions"
  ON positions FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM hr_users
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "HR users can create positions for their company"
  ON positions FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM hr_users
      WHERE auth_user_id = auth.uid()
      AND can_create_positions = true
    )
  );

-- Public: Read-only access to active positions
CREATE POLICY "Anyone can view active positions"
  ON positions FOR SELECT
  USING (workflow_stage = 'active');

CREATE POLICY "Anyone can view published job descriptions"
  ON job_descriptions FOR SELECT
  USING (status = 'published');

-- Applicants: Public can insert, only Prisma admins can update
CREATE POLICY "Anyone can submit applications"
  ON applicants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Prisma admins can view all applications"
  ON applicants FOR SELECT
  USING (true); -- Scoped to prisma_admins via backend auth

CREATE POLICY "Prisma admins can update applications"
  ON applicants FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

---

## 🚀 Backend API Architecture (FastAPI)

### **Project Structure**

```
backend/
├── pyproject.toml              # Poetry dependencies
├── .env.example                # Environment variables template
├── README.md                   # Setup instructions
│
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Settings (Pydantic BaseSettings)
│   │
│   ├── core/                   # Core infrastructure
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, password hashing, auth
│   │   ├── database.py         # Supabase client singleton
│   │   ├── logging.py          # Structured logging setup
│   │   └── exceptions.py       # Custom exceptions
│   │
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   ├── deps.py             # Dependency injection (auth, db)
│   │   │
│   │   └── v1/                 # API v1
│   │       ├── __init__.py
│   │       ├── router.py       # Main router aggregator
│   │       │
│   │       ├── leads.py        # POST /leads (interest form)
│   │       ├── clients.py      # Client enrollment, management
│   │       ├── positions.py    # Position CRUD, workflow
│   │       ├── job_descriptions.py  # AI generation
│   │       ├── applicants.py   # Application submission, qualification
│   │       ├── emails.py       # Email sending endpoints
│   │       └── admin.py        # Admin-only endpoints
│   │
│   ├── models/                 # Pydantic models
│   │   ├── __init__.py
│   │   ├── lead.py
│   │   ├── company.py
│   │   ├── position.py
│   │   ├── applicant.py
│   │   ├── job_description.py
│   │   └── email.py
│   │
│   ├── repositories/           # Data access layer
│   │   ├── __init__.py
│   │   ├── base.py             # Base repository with common methods
│   │   ├── company.py
│   │   ├── position.py
│   │   ├── applicant.py
│   │   └── admin.py
│   │
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── email_service.py    # Resend integration
│   │   ├── storage_service.py  # Supabase Storage
│   │   ├── analytics_service.py # PostHog
│   │   # ai_service.py - Post-MVP feature
│   │   │
│   │   └── workflows/          # Business workflows
│   │       ├── __init__.py
│   │       ├── lead_workflow.py
│   │       ├── enrollment_workflow.py
│   │       ├── position_workflow.py
│   │       └── candidate_workflow.py
│   │
│   └── templates/              # Email templates
│       ├── __init__.py
│       ├── client_onboarding.html
│       ├── business_user_request.html
│       ├── business_specs_completed.html
│       ├── prisma_admin_jd_required.html
│       ├── position_published.html
│       └── application_received.html
│
└── tests/                      # Tests
    ├── __init__.py
    ├── conftest.py             # Pytest fixtures
    │
    ├── unit/                   # Unit tests
    │   ├── test_services/
    │   ├── test_repositories/
    │   └── test_models/
    │
    └── integration/            # Integration tests
        ├── test_api/
        └── test_workflows/
```

---

### **Core API Endpoints**

#### **Authentication & Authorization**

```python
# app/core/security.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from supabase import Client

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase_client)
) -> dict:
    """Verify JWT token and return user data."""
    try:
        token = credentials.credentials
        # Verify with Supabase
        user = supabase.auth.get_user(token)
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

async def get_current_prisma_admin(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
) -> dict:
    """Verify user is a Prisma admin."""
    admin = supabase.table("prisma_admins")\
        .select("*")\
        .eq("auth_user_id", current_user.id)\
        .eq("is_active", True)\
        .single()\
        .execute()

    if not admin.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    return admin.data

async def get_current_hr_user(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
) -> dict:
    """Verify user is an HR user."""
    hr_user = supabase.table("hr_users")\
        .select("*, companies(*)")\
        .eq("auth_user_id", current_user.id)\
        .eq("is_active", True)\
        .single()\
        .execute()

    if not hr_user.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    return hr_user.data
```

---

#### **1. Lead Management API**

```python
# app/api/v1/leads.py
from fastapi import APIRouter, Depends, status
from app.models.lead import LeadCreate, LeadResponse
from app.services.workflows.lead_workflow import LeadWorkflow
from app.core.database import get_supabase_client

router = APIRouter(prefix="/leads", tags=["leads"])

@router.post(
    "",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit interest form",
    description="Public endpoint for lead capture from landing page"
)
async def create_lead(
    lead_data: LeadCreate,
    workflow: LeadWorkflow = Depends()
) -> LeadResponse:
    """
    Creates a new lead from interest form submission.

    **Workflow**:
    1. Validate and sanitize input
    2. Create company record (status: 'lead')
    3. Send notification to Prisma admin
    4. Send auto-confirmation email to lead
    5. Log activity

    **TDD**: See tests/integration/test_api/test_leads.py
    """
    result = await workflow.process_new_lead(lead_data)
    return result
```

**Pydantic Models**:
```python
# app/models/lead.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Literal
from datetime import datetime

class LeadCreate(BaseModel):
    # Contact info
    contact_name: str = Field(..., min_length=2, max_length=100)
    contact_email: EmailStr
    contact_phone: str = Field(..., pattern=r'^\+?[\d\s\-()]+$')
    contact_position: str = Field(..., max_length=100)

    # Company info
    company_name: str = Field(..., min_length=2, max_length=200)
    industry: Optional[str] = None
    company_size: Optional[Literal['1-10', '11-50', '51-200', '201-1000', '1000+']] = None

    # Intent
    intent: Literal['hiring', 'conversation']

    # Conditional position details (if intent = 'hiring')
    role_title: Optional[str] = Field(None, max_length=100)
    role_type: Optional[str] = None
    seniority: Optional[str] = None
    work_mode: Optional[Literal['remote', 'hybrid', 'onsite']] = None
    urgency: Optional[Literal['immediate', '1-2-weeks', '1-month+', 'not-urgent']] = None

    @validator('role_title', 'role_type', 'seniority')
    def required_if_hiring(cls, v, values):
        if values.get('intent') == 'hiring' and not v:
            raise ValueError('Required when intent is hiring')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "contact_name": "Ana Silva",
                "contact_email": "ana@techcorp.com",
                "contact_phone": "+51 999 999 999",
                "contact_position": "Head of Product",
                "company_name": "TechCorp SAC",
                "industry": "fintech",
                "company_size": "51-200",
                "intent": "hiring",
                "role_title": "Senior Product Manager",
                "role_type": "Product Manager",
                "seniority": "Senior (5-8 años)",
                "work_mode": "remote",
                "urgency": "1-2-weeks"
            }
        }

class LeadResponse(BaseModel):
    id: str
    company_id: str
    subscription_status: str
    lead_submitted_at: datetime
    message: str = "Lead submitted successfully. You'll receive a confirmation email shortly."

    class Config:
        from_attributes = True
```

---

#### **2. Client Enrollment API (Prisma Admin)**

```python
# app/api/v1/clients.py
from fastapi import APIRouter, Depends, status
from app.models.company import ClientEnrollment, ClientResponse
from app.services.workflows.enrollment_workflow import EnrollmentWorkflow
from app.core.security import get_current_prisma_admin

router = APIRouter(prefix="/clients", tags=["clients"])

@router.post(
    "/enroll",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enroll new business client",
    description="Prisma admin action: Convert lead to active client"
)
async def enroll_client(
    enrollment_data: ClientEnrollment,
    workflow: EnrollmentWorkflow = Depends(),
    admin: dict = Depends(get_current_prisma_admin)
) -> ClientResponse:
    """
    Enrolls a new business client from qualified lead.

    **Workflow**:
    1. Update company status: 'lead' → 'trial'
    2. Create initial HR user (company_admin)
    3. Generate magic link for password setup
    4. Send Notification #1 (client onboarding email)
    5. Log enrollment activity

    **Authorization**: Requires prisma_admin role

    **TDD**: See tests/integration/test_api/test_clients.py::test_enroll_client
    """
    result = await workflow.enroll_client(enrollment_data, enrolled_by=admin['id'])
    return result

@router.get(
    "/{company_id}",
    response_model=ClientResponse,
    summary="Get client details"
)
async def get_client(
    company_id: str,
    admin: dict = Depends(get_current_prisma_admin)
) -> ClientResponse:
    """Get full client profile with positions and metrics."""
    # Implementation...
    pass

@router.get(
    "",
    response_model=list[ClientResponse],
    summary="List all clients with filtering"
)
async def list_clients(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_current_prisma_admin)
) -> list[ClientResponse]:
    """List clients with pagination and filtering."""
    # Implementation...
    pass
```

---

#### **3. Position Workflow API**

```python
# app/api/v1/positions.py
from fastapi import APIRouter, Depends, status, UploadFile, File
from app.models.position import (
    PositionCreateHR,
    PositionUpdateBusiness,
    PositionResponse,
    PositionPublic
)
from app.services.workflows.position_workflow import PositionWorkflow
from app.core.security import get_current_hr_user, get_current_prisma_admin

router = APIRouter(prefix="/positions", tags=["positions"])

@router.post(
    "",
    response_model=PositionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create position (HR form)"
)
async def create_position(
    position_data: PositionCreateHR,
    workflow: PositionWorkflow = Depends(),
    hr_user: dict = Depends(get_current_hr_user)
) -> PositionResponse:
    """
    HR user creates new position.

    **Workflow**:
    1. Validate HR user has permission
    2. Create position record (status: 'hr_completed')
    3. Send Notification #2 to business user
    4. Log activity

    **TDD**: tests/integration/test_api/test_positions.py::test_create_position_as_hr
    """
    result = await workflow.create_position(
        position_data,
        created_by=hr_user['id'],
        company_id=hr_user['company_id']
    )
    return result

@router.patch(
    "/{position_code}/business-specs",
    response_model=PositionResponse,
    summary="Add business specifications"
)
async def add_business_specs(
    position_code: str,
    business_data: PositionUpdateBusiness,
    workflow: PositionWorkflow = Depends()
) -> PositionResponse:
    """
    Business user adds technical specifications.

    **Workflow**:
    1. Load position by code
    2. Update area_specific_data (JSONB)
    3. Update workflow_stage: 'business_completed'
    4. Send Notification #3 to HR user
    5. Send Notification #4 to Prisma admin
    6. Log activity

    **Note**: This endpoint uses position_code (no auth required).
    Business user receives magic link in email.

    **TDD**: tests/integration/test_api/test_positions.py::test_add_business_specs
    """
    result = await workflow.add_business_specifications(position_code, business_data)
    return result

@router.post(
    "/{position_id}/job-description",
    response_model=dict,
    summary="Create/update job description (Prisma admin - Manual)"
)
async def create_job_description(
    position_id: str,
    jd_content: str,
    workflow: PositionWorkflow = Depends(),
    admin: dict = Depends(get_current_prisma_admin)
) -> dict:
    """
    Prisma admin manually creates/updates job description.

    **MVP Workflow** (No AI):
    1. Fetch position with HR + business data (displayed to admin)
    2. Admin writes JD in rich text editor
    3. Save to job_descriptions table (status: 'draft')
    4. Update position workflow_stage: 'jd_draft'
    5. Auto-save every 30 seconds to draft_content

    **Post-MVP**: Add AI-assisted generation button

    **TDD**: tests/integration/test_api/test_positions.py::test_create_jd_manual
    """
    result = await workflow.create_job_description_manual(
        position_id,
        jd_content,
        admin['id']
    )
    return result

@router.post(
    "/{position_id}/publish",
    response_model=PositionResponse,
    summary="Publish position with JD (Prisma admin)"
)
async def publish_position(
    position_id: str,
    workflow: PositionWorkflow = Depends(),
    admin: dict = Depends(get_current_prisma_admin)
) -> PositionResponse:
    """
    Prisma admin publishes position after writing JD.

    **MVP Workflow**:
    1. Validate JD exists and has content
    2. Update JD status: 'draft' → 'published'
    3. Generate public URL: /job/{position_code}
    4. Update position workflow_stage: 'active'
    5. Send Notification #5 to HR user (with public link)
    6. Log activity

    **TDD**: tests/integration/test_api/test_positions.py::test_publish_position
    """
    result = await workflow.publish_position(position_id, admin['id'])
    return result

@router.get(
    "/public/{position_code}",
    response_model=PositionPublic,
    summary="Get public position details"
)
async def get_public_position(
    position_code: str
) -> PositionPublic:
    """
    Public endpoint for job posting page.
    Only returns positions with workflow_stage = 'active'.

    **TDD**: tests/integration/test_api/test_positions.py::test_get_public_position
    """
    # Implementation uses repository pattern
    pass
```

---

#### **4. Applicant Management API**

```python
# app/api/v1/applicants.py
from fastapi import APIRouter, Depends, status, UploadFile, File
from app.models.applicant import ApplicantCreate, ApplicantResponse, ApplicantQualify
from app.services.workflows.candidate_workflow import CandidateWorkflow
from app.services.storage_service import StorageService
from app.core.security import get_current_prisma_admin

router = APIRouter(prefix="/applicants", tags=["applicants"])

@router.post(
    "",
    response_model=ApplicantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit application (public)"
)
async def submit_application(
    applicant_data: ApplicantCreate,
    resume: UploadFile = File(...),
    workflow: CandidateWorkflow = Depends(),
    storage: StorageService = Depends()
) -> ApplicantResponse:
    """
    Public endpoint for candidate application submission.

    **Workflow**:
    1. Validate position is 'active'
    2. Validate file type (PDF only, max 5MB)
    3. Upload resume to Supabase Storage: /resumes/{position_id}/{applicant_id}/
    4. Create applicant record (status: 'new')
    5. Send Notification #6 to candidate (confirmation)
    6. Notify Prisma admin (internal Slack/email)
    7. Log activity

    **TDD**: tests/integration/test_api/test_applicants.py::test_submit_application
    **TDD**: tests/unit/test_services/test_storage_service.py::test_upload_resume
    """
    # Upload resume
    resume_url = await storage.upload_resume(
        file=resume,
        position_id=applicant_data.position_id
    )

    # Create application
    result = await workflow.submit_application(
        applicant_data,
        resume_url=resume_url
    )

    return result

@router.patch(
    "/{applicant_id}/qualify",
    response_model=ApplicantResponse,
    summary="Qualify applicant (Prisma admin)"
)
async def qualify_applicant(
    applicant_id: str,
    qualification: ApplicantQualify,
    workflow: CandidateWorkflow = Depends(),
    admin: dict = Depends(get_current_prisma_admin)
) -> ApplicantResponse:
    """
    Prisma admin qualifies applicant (scoring + status change).

    **Workflow**:
    1. Update scores (skills, experience, cultural fit)
    2. Calculate overall_score (average)
    3. Update application_status
    4. Add prisma_notes
    5. Log activity

    **TDD**: tests/integration/test_api/test_applicants.py::test_qualify_applicant
    """
    result = await workflow.qualify_applicant(
        applicant_id,
        qualification,
        reviewed_by=admin['id']
    )
    return result

@router.post(
    "/positions/{position_id}/shortlist",
    response_model=dict,
    summary="Send shortlist to client (Prisma admin)"
)
async def send_shortlist(
    position_id: str,
    applicant_ids: list[str],
    workflow: CandidateWorkflow = Depends(),
    admin: dict = Depends(get_current_prisma_admin)
) -> dict:
    """
    Prisma admin sends shortlist (top 3-5 candidates) to HR user.

    **Workflow**:
    1. Validate applicants belong to position
    2. Validate applicants are 'shortlisted' status
    3. Generate shortlist summary document
    4. Send email to HR user with candidate profiles
    5. Update workflow_stage: 'shortlist_sent'
    6. Update applicants status: 'sent_to_client'
    7. Log activity

    **TDD**: tests/integration/test_api/test_applicants.py::test_send_shortlist
    """
    result = await workflow.send_shortlist(
        position_id,
        applicant_ids,
        sent_by=admin['id']
    )
    return result

@router.get(
    "/positions/{position_id}",
    response_model=list[ApplicantResponse],
    summary="List applicants for position (Prisma admin)"
)
async def list_applicants(
    position_id: str,
    status: Optional[str] = None,
    min_score: Optional[float] = None,
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_current_prisma_admin)
) -> list[ApplicantResponse]:
    """List applicants with filtering and sorting."""
    # Implementation...
    pass
```

---

#### **5. Email Service API**

```python
# app/api/v1/emails.py
from fastapi import APIRouter, Depends, status
from app.models.email import EmailSend, EmailResponse
from app.services.email_service import EmailService
from app.core.security import get_current_prisma_admin

router = APIRouter(prefix="/emails", tags=["emails"])

@router.post(
    "/send",
    response_model=EmailResponse,
    summary="Send email (internal use)"
)
async def send_email(
    email_data: EmailSend,
    email_service: EmailService = Depends(),
    admin: dict = Depends(get_current_prisma_admin)
) -> EmailResponse:
    """
    Internal endpoint for sending emails.
    Called by workflows, not directly by frontend.

    **TDD**: tests/unit/test_services/test_email_service.py::test_send_email
    """
    result = await email_service.send_email(
        recipient=email_data.recipient_email,
        template=email_data.template_name,
        data=email_data.template_data,
        sent_by=admin['id']
    )
    return result
```

---

### **Service Layer Example: Job Description Management (MVP)**

```python
# app/services/job_description_service.py
from typing import Dict, Optional
from app.core.database import get_supabase_client
from app.models.position import PositionFull
from app.models.job_description import JobDescriptionCreate, JobDescriptionUpdate
import structlog

logger = structlog.get_logger()

class JobDescriptionService:
    """
    MVP: Manual job description creation by Prisma admin.
    Post-MVP: Add AI-assisted generation methods.
    """

    def __init__(self, supabase_client=None):
        self.supabase = supabase_client or get_supabase_client()

    async def create_draft(
        self,
        position_id: str,
        content: str,
        created_by: str
    ) -> Dict:
        """
        Create a new job description draft (manual entry by admin).

        **MVP Workflow**:
        1. Admin views position details (HR + business form data)
        2. Admin writes JD in rich text editor
        3. Save draft to job_descriptions table
        4. Update position workflow_stage: 'jd_draft'

        **TDD**: tests/unit/test_services/test_job_description_service.py
        """
        try:
            logger.info("Creating JD draft", position_id=position_id)

            # Create JD record
            result = self.supabase.table("job_descriptions").insert({
                "position_id": position_id,
                "content": content,
                "draft_content": content,  # Same as content initially
                "status": "draft",
                "created_by": created_by
            }).execute()

            jd_id = result.data[0]["id"]

            # Update position workflow stage
            self.supabase.table("positions").update({
                "workflow_stage": "jd_draft",
                "job_description_id": jd_id,
                "jd_draft_created_at": "NOW()"
            }).eq("id", position_id).execute()

            logger.info("JD draft created", position_id=position_id, jd_id=jd_id)

            return result.data[0]

        except Exception as e:
            logger.error("JD draft creation failed", position_id=position_id, error=str(e))
            raise

    async def update_draft(
        self,
        jd_id: str,
        content: str
    ) -> Dict:
        """
        Update existing draft (auto-save every 30 seconds).
        """
        result = self.supabase.table("job_descriptions").update({
            "draft_content": content,
            "updated_at": "NOW()"
        }).eq("id", jd_id).execute()

        return result.data[0]

    async def publish(
        self,
        jd_id: str,
        position_id: str,
        published_by: str
    ) -> Dict:
        """
        Publish job description (make it live).

        **Workflow**:
        1. Move draft_content → content
        2. Update status: 'draft' → 'published'
        3. Update position workflow_stage: 'active'
        4. Trigger notification to HR user

        **TDD**: tests/unit/test_services/test_job_description_service.py::test_publish
        """
        try:
            logger.info("Publishing JD", jd_id=jd_id)

            # Get current draft content
            jd_result = self.supabase.table("job_descriptions")\
                .select("draft_content")\
                .eq("id", jd_id)\
                .single()\
                .execute()

            draft_content = jd_result.data["draft_content"]

            # Publish JD
            result = self.supabase.table("job_descriptions").update({
                "content": draft_content,  # Publish the draft
                "status": "published",
                "published_at": "NOW()",
                "published_by": published_by
            }).eq("id", jd_id).execute()

            # Update position
            self.supabase.table("positions").update({
                "workflow_stage": "active",
                "jd_completed_at": "NOW()"
            }).eq("id", position_id).execute()

            logger.info("JD published successfully", jd_id=jd_id, position_id=position_id)

            return result.data[0]

        except Exception as e:
            logger.error("JD publish failed", jd_id=jd_id, error=str(e))
            raise

    async def get_position_context(self, position_id: str) -> Dict:
        """
        Get all position data for admin to write JD.

        **Returns**: Combined HR form + business form data + company info
        """
        result = self.supabase.table("positions")\
            .select("*, companies(*)")\
            .eq("id", position_id)\
            .single()\
            .execute()

        return result.data

    # Post-MVP: Add AI-assisted generation
    # async def generate_with_ai(self, position_id: str) -> Dict:
    #     """Generate JD using OpenAI GPT-4 (post-MVP)."""
    #     pass
```

---

## 🧪 Testing Strategy (TDD Approach)

### **Test Pyramid**

```
        ┌─────────────┐
        │   E2E (5%)  │  ← Playwright tests (critical user flows)
        └─────────────┘
      ┌─────────────────┐
      │ Integration (25%)│  ← API endpoint tests, workflow tests
      └─────────────────┘
    ┌─────────────────────┐
    │   Unit Tests (70%)  │  ← Service logic, repositories, models
    └─────────────────────┘
```

---

### **Backend Testing (FastAPI + Pytest)**

#### **Test Configuration**

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_supabase_client
from supabase import Client
from unittest.mock import Mock

@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)

@pytest.fixture
def mock_supabase():
    """Mocked Supabase client for unit tests."""
    mock = Mock(spec=Client)
    return mock

@pytest.fixture
def override_supabase(mock_supabase):
    """Override Supabase dependency for testing."""
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def sample_lead_data():
    """Sample lead form data for testing."""
    return {
        "contact_name": "Test User",
        "contact_email": "test@example.com",
        "contact_phone": "+51999999999",
        "contact_position": "Head of Product",
        "company_name": "TestCorp",
        "industry": "fintech",
        "company_size": "51-200",
        "intent": "hiring",
        "role_title": "Senior PM",
        "role_type": "Product Manager",
        "seniority": "Senior",
        "work_mode": "remote",
        "urgency": "1-2-weeks"
    }

@pytest.fixture
def prisma_admin_token():
    """Generate valid JWT for Prisma admin."""
    # Implementation...
    pass
```

---

#### **Unit Test Examples (MVP - Manual JD)**

```python
# tests/unit/test_services/test_job_description_service.py
import pytest
from app.services.job_description_service import JobDescriptionService
from unittest.mock import Mock, patch

@pytest.mark.asyncio
async def test_create_draft_success(mock_supabase):
    """Test successful JD draft creation (manual entry by admin)."""
    # Arrange
    jd_service = JobDescriptionService(mock_supabase)
    position_id = "test-position-id"
    content = "<h1>Senior Product Manager</h1><p>Join our team...</p>"
    admin_id = "admin-123"

    mock_supabase.table("job_descriptions").insert.return_value.execute.return_value = Mock(
        data=[{
            "id": "jd-123",
            "position_id": position_id,
            "content": content,
            "status": "draft"
        }]
    )

    # Act
    result = await jd_service.create_draft(position_id, content, admin_id)

    # Assert
    assert result["id"] == "jd-123"
    assert result["status"] == "draft"
    mock_supabase.table("positions").update.assert_called_once()

@pytest.mark.asyncio
async def test_publish_jd_success(mock_supabase):
    """Test successful JD publication."""
    # Arrange
    jd_service = JobDescriptionService(mock_supabase)
    jd_id = "jd-123"
    position_id = "position-123"
    admin_id = "admin-123"

    mock_supabase.table("job_descriptions").select.return_value.eq.return_value.single.return_value.execute.return_value = Mock(
        data={"draft_content": "<p>Updated JD content</p>"}
    )

    # Act
    result = await jd_service.publish(jd_id, position_id, admin_id)

    # Assert
    mock_supabase.table("job_descriptions").update.assert_called()
    mock_supabase.table("positions").update.assert_called_with({
        "workflow_stage": "active",
        "jd_completed_at": "NOW()"
    })

@pytest.mark.asyncio
async def test_auto_save_draft(mock_supabase):
    """Test draft auto-save (every 30 seconds)."""
    # Arrange
    jd_service = JobDescriptionService(mock_supabase)
    jd_id = "jd-123"
    updated_content = "<p>Updated content...</p>"

    # Act
    result = await jd_service.update_draft(jd_id, updated_content)

    # Assert
    mock_supabase.table("job_descriptions").update.assert_called_with({
        "draft_content": updated_content,
        "updated_at": "NOW()"
    })
```

---

#### **Integration Test Examples**

```python
# tests/integration/test_api/test_leads.py
import pytest
from fastapi import status

def test_create_lead_success(client, sample_lead_data, override_supabase):
    """Test successful lead creation from interest form."""
    # Act
    response = client.post("/api/v1/leads", json=sample_lead_data)

    # Assert
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["company_id"] is not None
    assert data["subscription_status"] == "lead"
    assert "message" in data

def test_create_lead_missing_required_fields(client):
    """Test lead creation fails with missing required fields."""
    # Arrange
    incomplete_data = {
        "contact_name": "Test",
        "contact_email": "invalid"  # Invalid email
    }

    # Act
    response = client.post("/api/v1/leads", json=incomplete_data)

    # Assert
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    errors = response.json()["detail"]
    assert any(err["loc"] == ["body", "contact_email"] for err in errors)

def test_create_lead_hiring_intent_requires_position_details(client):
    """Test that hiring intent requires position fields."""
    # Arrange
    data = {
        **sample_lead_data,
        "intent": "hiring",
        "role_title": None  # Missing required field for hiring
    }

    # Act
    response = client.post("/api/v1/leads", json=data)

    # Assert
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
```

```python
# tests/integration/test_api/test_positions.py
import pytest
from fastapi import status

def test_create_position_as_hr_user(client, hr_user_token, sample_position_data):
    """Test HR user can create position."""
    # Arrange
    headers = {"Authorization": f"Bearer {hr_user_token}"}

    # Act
    response = client.post(
        "/api/v1/positions",
        json=sample_position_data,
        headers=headers
    )

    # Assert
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["position_code"].startswith("POS_")
    assert data["workflow_stage"] == "hr_completed"

def test_add_business_specs(client, position_code, business_specs_data):
    """Test business user can add specifications via position code."""
    # Act
    response = client.patch(
        f"/api/v1/positions/{position_code}/business-specs",
        json=business_specs_data
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["workflow_stage"] == "business_completed"
    assert data["area_specific_data"] is not None

def test_create_jd_manually_as_prisma_admin(client, admin_token, position_id):
    """Test Prisma admin can manually create job description."""
    # Arrange
    headers = {"Authorization": f"Bearer {admin_token}"}
    jd_content = "<h1>Senior Product Manager</h1><p>Join our team...</p>"

    # Act
    response = client.post(
        f"/api/v1/positions/{position_id}/job-description",
        json={"content": jd_content},
        headers=headers
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "id" in data
    assert data["status"] == "draft"

def test_publish_position_with_jd_as_prisma_admin(client, admin_token, position_id):
    """Test Prisma admin can publish position after writing JD."""
    # Arrange
    headers = {"Authorization": f"Bearer {admin_token}"}

    # First, create a JD draft
    jd_content = "<h1>Senior PM</h1><p>Great opportunity...</p>"
    client.post(
        f"/api/v1/positions/{position_id}/job-description",
        json={"content": jd_content},
        headers=headers
    )

    # Act - Now publish
    response = client.post(
        f"/api/v1/positions/{position_id}/publish",
        headers=headers
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["workflow_stage"] == "active"
    assert data["public_url"] is not None
    assert data["jd_completed_at"] is not None
```

---

### **Frontend Testing (React + Vitest)**

```typescript
// src/components/LeadForm/LeadForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LeadForm from './LeadForm';
import { submitLead } from '@/api/leads';

vi.mock('@/api/leads');

describe('LeadForm', () => {
  it('renders all required fields', () => {
    render(<LeadForm />);

    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument();
  });

  it('shows position fields when hiring intent selected', async () => {
    render(<LeadForm />);

    const hiringRadio = screen.getByLabelText(/busco contratar talento/i);
    fireEvent.click(hiringRadio);

    await waitFor(() => {
      expect(screen.getByLabelText(/título del rol/i)).toBeInTheDocument();
    });
  });

  it('submits form successfully', async () => {
    const mockSubmit = vi.mocked(submitLead);
    mockSubmit.mockResolvedValue({ success: true });

    render(<LeadForm />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Test User' }
    });
    // ... fill other fields

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
      expect(screen.getByText(/gracias/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<LeadForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' }
    });
    fireEvent.blur(screen.getByLabelText(/email/i));

    await waitFor(() => {
      expect(screen.getByText(/email válido/i)).toBeInTheDocument();
    });
  });
});
```

---

## ✅ Implementation Checklist (4 Phases)

### **Phase 1: Foundation (Week 1) - Database + Backend Core**

#### **Day 1: Database Setup** ⏱️ 6-8 hours
- [ ] **Test**: Write schema validation tests
- [ ] **Implement**: Execute migrations 001-004
- [ ] **Implement**: Create `prisma_admins` table (migration 005)
- [ ] **Implement**: Add new workflow stages to `positions`
- [ ] **Test**: Verify all tables created successfully
- [ ] **Test**: Test RLS policies with sample data
- [ ] **Quality Gate**: All migrations pass, RLS policies working

#### **Day 2: Backend Project Setup** ⏱️ 6-8 hours
- [ ] **Test**: Setup pytest configuration
- [ ] **Implement**: Initialize FastAPI project structure
- [ ] **Implement**: Configure Poetry dependencies
- [ ] **Implement**: Setup environment variables (.env.example)
- [ ] **Implement**: Configure Supabase client singleton
- [ ] **Implement**: Setup structured logging (structlog)
- [ ] **Test**: Verify `/health` endpoint works
- [ ] **Test**: Verify Supabase connection
- [ ] **Quality Gate**: Backend runs locally, tests pass

#### **Day 3-4: Authentication & Core Services** ⏱️ 12-16 hours
- [ ] **Test**: Write auth middleware tests
- [ ] **Implement**: JWT authentication middleware
- [ ] **Implement**: Role-based access control (prisma_admin, hr_user)
- [ ] **Test**: Test auth with mock tokens
- [ ] **Test**: Write email service unit tests (mocked Resend)
- [ ] **Implement**: Email service with Resend integration
- [ ] **Implement**: Email templates (HTML)
- [ ] **Test**: Test email sending (use Resend sandbox)
- [ ] **Quality Gate**: Auth working, emails sending

#### **Day 5: Lead Management API** ⏱️ 6-8 hours
- [ ] **Test**: Write `POST /leads` integration tests
- [ ] **Implement**: Lead model (Pydantic)
- [ ] **Implement**: Lead repository (Supabase queries)
- [ ] **Implement**: Lead workflow (create + notifications)
- [ ] **Implement**: `POST /api/v1/leads` endpoint
- [ ] **Test**: Run integration tests
- [ ] **Quality Gate**: Lead form submission working end-to-end

---

### **Phase 2: Client & Position Workflows (Week 2)**

#### **Day 1: Client Enrollment** ⏱️ 8 hours
- [ ] **Test**: Write enrollment workflow tests
- [ ] **Implement**: Client enrollment models
- [ ] **Implement**: Enrollment repository
- [ ] **Implement**: Enrollment workflow (company + HR user creation)
- [ ] **Implement**: Notification #1 (onboarding email)
- [ ] **Implement**: `POST /api/v1/clients/enroll` endpoint
- [ ] **Test**: Integration tests for enrollment
- [ ] **Quality Gate**: Enrollment creates company, HR user, sends email

#### **Day 2-3: Position Creation (HR Form)** ⏱️ 12-16 hours
- [ ] **Test**: Write position creation tests
- [ ] **Implement**: Position models (HR form)
- [ ] **Implement**: Position repository (CRUD)
- [ ] **Implement**: Position workflow (create + business user notification)
- [ ] **Implement**: Notification #2 (business user request)
- [ ] **Implement**: `POST /api/v1/positions` endpoint
- [ ] **Test**: Integration tests with HR auth
- [ ] **Quality Gate**: HR can create position, business user gets email

#### **Day 4-5: Business Specifications** ⏱️ 12-16 hours
- [ ] **Test**: Write business specs update tests
- [ ] **Implement**: Business specs models (area-specific JSONB)
- [ ] **Implement**: Position workflow (update + notifications)
- [ ] **Implement**: Notification #3 (HR user) & #4 (Prisma admin)
- [ ] **Implement**: `PATCH /api/v1/positions/{code}/business-specs` endpoint
- [ ] **Test**: Integration tests with position code
- [ ] **Quality Gate**: Business form updates position, sends 2 emails

#### **Day 6-7: Manual Job Description System** ⏱️ 12-16 hours
- [ ] **Test**: Write JD service unit tests (manual creation)
- [ ] **Implement**: Job description service (create, update, publish)
- [ ] **Implement**: Job description repository
- [ ] **Implement**: `POST /api/v1/positions/{id}/job-description` endpoint (create draft)
- [ ] **Implement**: `PATCH /api/v1/positions/{id}/job-description` endpoint (update draft)
- [ ] **Implement**: `POST /api/v1/positions/{id}/publish` endpoint
- [ ] **Implement**: Notification #5 (position published)
- [ ] **Test**: Integration tests for JD creation/publish workflow
- [ ] **Quality Gate**: Admin can write JD, auto-save works, publish succeeds

---

### **Phase 3: Frontend & Application System (Week 3)**

#### **Day 1-2: Frontend Setup (React + TypeScript)** ⏱️ 12-16 hours
- [ ] **Test**: Setup Vitest configuration
- [ ] **Implement**: Initialize Vite + React + TypeScript project
- [ ] **Implement**: Setup TailwindCSS
- [ ] **Implement**: Configure React Router
- [ ] **Implement**: Setup Supabase client
- [ ] **Implement**: Setup React Query for API calls
- [ ] **Implement**: Create API client (Axios + types)
- [ ] **Test**: Write component unit tests
- [ ] **Quality Gate**: Frontend builds, routing works

#### **Day 3-4: Public Job Pages** ⏱️ 12-16 hours
- [ ] **Test**: Write JobPage component tests
- [ ] **Implement**: Job listing page (`/job/{code}`)
- [ ] **Implement**: Fetch position + JD from API
- [ ] **Implement**: Display company, role details, compensation
- [ ] **Implement**: Responsive design (mobile-first)
- [ ] **Test**: Integration tests with mock API
- [ ] **Quality Gate**: Public job page displays correctly

#### **Day 5-7: Application Form & Storage** ⏱️ 16-20 hours
- [ ] **Test**: Write application form tests
- [ ] **Implement**: Application form component (`/apply/{code}`)
- [ ] **Implement**: Form validation with Zod + React Hook Form
- [ ] **Implement**: Resume upload with progress indicator
- [ ] **Implement**: Storage service (Supabase Storage integration)
- [ ] **Implement**: `POST /api/v1/applicants` endpoint
- [ ] **Implement**: Notification #6 (application confirmation)
- [ ] **Test**: E2E test: Fill form → Upload resume → Submit
- [ ] **Quality Gate**: Application submission working, resume uploaded

---

### **Phase 4: Admin Dashboard & Deployment (Week 4)**

#### **Day 1-3: Prisma Admin Dashboard** ⏱️ 20-24 hours
- [ ] **Test**: Write dashboard component tests
- [ ] **Implement**: Admin login page (Supabase Auth)
- [ ] **Implement**: Dashboard overview (metrics)
- [ ] **Implement**: Lead management view (table + filters)
- [ ] **Implement**: Client enrollment form
- [ ] **Implement**: Position pipeline view (Kanban/table)
- [ ] **Implement**: **Job Description Editor** (rich text WYSIWYG)
  - [ ] TipTap or Quill.js for rich text editing
  - [ ] Auto-save every 30 seconds
  - [ ] Display position context (HR + business data) in sidebar
  - [ ] Preview mode
- [ ] **Implement**: Applicant list view (with filters)
- [ ] **Implement**: Applicant detail modal (scoring interface)
- [ ] **Test**: Integration tests for all admin actions
- [ ] **Quality Gate**: Admin dashboard fully functional, JD editor works

#### **Day 4-5: Candidate Qualification & Shortlist** ⏱️ 12-16 hours
- [ ] **Test**: Write qualification workflow tests
- [ ] **Implement**: Applicant qualification API endpoints
- [ ] **Implement**: Shortlist creation UI
- [ ] **Implement**: Shortlist email generation
- [ ] **Implement**: `POST /api/v1/applicants/positions/{id}/shortlist` endpoint
- [ ] **Test**: E2E test: Qualify → Shortlist → Send email
- [ ] **Quality Gate**: Shortlist workflow complete

#### **Day 6: Deployment Configuration** ⏱️ 6-8 hours
- [ ] **Implement**: Backend Dockerfile (FastAPI)
- [ ] **Implement**: Deploy backend to Render
- [ ] **Implement**: Configure environment variables on Render
- [ ] **Implement**: Frontend build configuration (Vite)
- [ ] **Implement**: Deploy frontend to Vercel
- [ ] **Implement**: Configure custom domain
- [ ] **Test**: Production smoke tests
- [ ] **Quality Gate**: Both frontend and backend deployed

#### **Day 7: E2E Testing & Launch** ⏱️ 6-8 hours
- [ ] **Test**: Write Playwright E2E tests (critical flows)
- [ ] **Test**: Run full E2E test suite on production
- [ ] **Test**: Test all 6 email notifications end-to-end
- [ ] **Implement**: Setup error monitoring (Sentry)
- [ ] **Implement**: Setup analytics (PostHog)
- [ ] **Test**: Performance testing (load test API)
- [ ] **Test**: Security audit (OWASP Top 10)
- [ ] **Quality Gate**: All tests pass, monitoring active

---

## 🚀 Deployment Architecture

### **Backend Deployment (Render)**

```yaml
# render.yaml
services:
  - type: web
    name: prisma-talent-backend
    env: python
    region: oregon
    plan: starter # $7/month
    buildCommand: "pip install poetry && poetry install --only main"
    startCommand: "poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    healthCheckPath: /health
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.7
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: SENTRY_DSN
        sync: false
```

**Dockerfile** (if needed):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry==1.7.1

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-interaction --no-ansi

# Copy application
COPY app ./app

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### **Frontend Deployment (Vercel)**

```json
// vercel.json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_BASE_URL": "@api-base-url",
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://prisma-talent-api.onrender.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

---

## 📊 Quality Gates & Success Criteria

### **Per-Phase Quality Gates**

| Phase | Quality Gate | Success Criteria |
|-------|-------------|------------------|
| **Phase 1** | Database & Core Services | ✅ All migrations pass<br>✅ Auth middleware tests pass<br>✅ Email service sends test emails<br>✅ Lead API creates records |
| **Phase 2** | Client & Position Workflows | ✅ Enrollment creates company + user<br>✅ HR form creates position<br>✅ Business form updates position<br>✅ AI generates quality JDs<br>✅ All 5 notifications send |
| **Phase 3** | Frontend & Applications | ✅ Public job page displays<br>✅ Application form validates<br>✅ Resume upload succeeds<br>✅ Application saved to DB<br>✅ Confirmation email sent |
| **Phase 4** | Admin Dashboard & Launch | ✅ Admin can enroll clients<br>✅ Admin can qualify applicants<br>✅ Shortlist email generated<br>✅ E2E tests pass<br>✅ Production deployed |

---

### **Overall Success Metrics (Post-Launch)**

**Technical Quality**:
- 🧪 **Test Coverage**: ≥80% backend, ≥70% frontend
- ⚡ **API Response Time**: P95 < 500ms
- 🔒 **Security**: OWASP Top 10 compliant
- 📊 **Error Rate**: < 1% of requests
- 🚀 **Uptime**: ≥99.5%

**Business Metrics (MVP - 30 days)**:
- 📋 **3+ clients enrolled** via Prisma admin
- 🎯 **5+ positions published** (full workflow with manual JD)
- ✍️ **5+ job descriptions written** manually by Prisma admin (100% quality)
- 📧 **6/6 notifications** sending correctly
- 👥 **20+ candidate applications** submitted
- ✅ **1+ shortlist delivered** to client

**Post-MVP Enhancement Trigger**:
- When we have **20+ job descriptions** written, analyze patterns for AI training
- Implement AI-assisted generation as optional tool, not replacement

---

## 🔐 Security Checklist

- [ ] **Authentication**: JWT validation on all protected endpoints
- [ ] **Authorization**: Role-based access control (RLS + middleware)
- [ ] **Input Validation**: Pydantic models validate all inputs
- [ ] **SQL Injection**: Supabase client uses parameterized queries
- [ ] **XSS**: React escapes all user input by default
- [ ] **CSRF**: SameSite cookies + CORS configuration
- [ ] **File Upload**: File type validation, size limits, virus scanning
- [ ] **Rate Limiting**: SlowAPI middleware on public endpoints
- [ ] **HTTPS**: Enforced on Vercel + Render
- [ ] **Secrets**: Environment variables, never in code
- [ ] **Logging**: No PII logged, structured logging for auditing
- [ ] **Error Handling**: Generic errors to clients, detailed logs internally

---

## 📚 Documentation Requirements

Each phase must include:
- [ ] **API Documentation**: Auto-generated OpenAPI (Swagger)
- [ ] **Architecture Diagrams**: Updated as system evolves
- [ ] **Runbook**: Setup, deployment, troubleshooting
- [ ] **Test Documentation**: How to run tests, coverage reports
- [ ] **Changelog**: Track changes per deployment

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Maintained By**: Development Team
**Review Cycle**: After each phase completion
**Status**: Implementation-Ready
