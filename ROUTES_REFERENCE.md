# Talent Platform - Complete URL Routes Reference

**Generated:** 2025-10-21
**Platform:** Full-stack React + FastAPI application
**Base URLs:**
- Frontend: http://localhost:3000 (or deployed URL)
- Backend API: http://localhost:8000/api/v1 (or deployed URL)

---

## FRONTEND ROUTES

All frontend routes are defined in `/frontend/src/App.tsx` using React Router v6.

### PUBLIC ROUTES

#### Landing & Lead Generation
| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/` | LandingPage | Landing page & company intro | Public |
| `/lead` | LeadFormPage | Lead capture form | Public |

#### Job & Application
| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/job/:code` | JobListingPage | Job posting page | Public (position_code in URL) |
| `/apply/:code` | ApplicationFormPage | Application submission form | Public |

#### Embedded Forms (No Authentication)
| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/hr-form` | HRForm | HR intake form (Position creation) | Public (can be embedded in client sites) |
| `/business-form?code=XX` | BusinessLeaderForm | Business leader form (Market specs) | Public (requires position code query param) |

---

### CLIENT ROUTES

All client routes require client authentication (magic link via Supabase).

#### Client Authentication
| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/client/login` | ClientLoginPage | Client login page | Public |
| `/client/dashboard` | ClientDashboardPage | Client portal dashboard | Protected (requireClient) |

---

### ADMIN ROUTES

All admin routes require Prisma admin authentication (Supabase Auth with admin role).

#### Admin Authentication
| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/admin/login` | AdminLoginPage | Admin login page | Public |

#### Admin Dashboard & Overview
| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/admin` | AdminDashboardPage | Main admin dashboard | Protected (requireAdmin) |

#### Lead Management
| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/admin/leads` | LeadManagementPage | View and manage all leads | Protected (requireAdmin) |

#### Client Management
| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/admin/clients/new` | NewClientPage | Create and onboard new client | Protected (requireAdmin) |

#### Position Management
| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/admin/positions` | PositionPipelinePage | View all positions in pipeline | Protected (requireAdmin) |
| `/admin/positions/:positionId` | PositionDetailPage | View single position details | Protected (requireAdmin) |
| `/admin/positions/:positionId/validate` | ValidateJDPage | Validate & publish job description | Protected (requireAdmin) |

#### Candidate Management
| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/admin/candidates` | CandidateReviewPage | List all applicants/candidates | Protected (requireAdmin) |
| `/admin/candidates/:code` | CandidateReviewPage | Review candidates for specific position | Protected (requireAdmin) |
| `/admin/shortlist/:code` | ShortlistGeneratorPage | Generate shortlist for position | Protected (requireAdmin) |

#### Disabled Routes (Missing Dependencies)
| Route | Component | Status | Reason |
|-------|-----------|--------|--------|
| `/admin/positions/:code/edit` | JobDescriptionEditorPage | Disabled | Missing @tiptap dependencies |

#### Error Handling
| Route | Component | Purpose |
|-------|-----------|---------|
| `*` (404) | 404 Page | Catch-all for undefined routes |

---

## BACKEND API ROUTES

All backend routes are prefixed with `/api/v1` and defined in separate routers.

### HEALTH & STATUS

#### Application Health
| Method | Endpoint | Purpose | Auth | Rate Limit |
|--------|----------|---------|------|-----------|
| GET | `/health` | Health check endpoint | None | Standard |
| GET | `/` | API root information | None | Standard |

---

### LEADS ENDPOINTS

**Router Prefix:** `/leads`
**Module:** `backend/app/api/v1/leads.py`

#### Create Lead (Public - Lead Capture)
| Method | Endpoint | Purpose | Auth | Rate Limit |
|--------|----------|---------|------|-----------|
| POST | `/api/v1/leads` | Submit interest form from landing page | None | 10/min per IP |

**Request Body:**
```json
{
  "contact_name": "Juan Pérez",
  "position": "VP Product",
  "company_name": "Tech Startup SAC",
  "contact_email": "juan@techstartup.com",
  "contact_phone": "+51999999999",
  "intent": "hiring",
  "role_title": "Senior Product Manager",
  "role_type": "Product Manager",
  "level": "Senior (5-8 años)",
  "work_mode": "Híbrido",
  "urgency": "Standard",
  "terms_acceptance": true
}
```

**Response:** LeadResponse with ID and success message

#### Get All Leads (Admin Only)
| Method | Endpoint | Purpose | Auth | Parameters |
|--------|----------|---------|------|-----------|
| GET | `/api/v1/leads` | Get list of all leads | Prisma Admin | `status_filter` (default: "lead") |

**Response:** List[LeadListResponse]

#### Get Lead Details (Admin Only)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/leads/{lead_id}` | Get detailed lead info | Prisma Admin |

**Response:** Complete lead/company record

---

### ENROLLMENT ENDPOINTS

**Router Prefix:** `/enrollment`
**Module:** `backend/app/api/v1/enrollment.py`

#### Enroll New Client (Admin Only)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/enrollment` | Enroll new client company | Prisma Admin |

**Request Body:**
```json
{
  "company_name": "Tech Company",
  "primary_contact_email": "contact@techcompany.com",
  "primary_contact_name": "Name",
  "subscription_plan": "professional"
}
```

**Response:** ClientEnrollmentResponse with company ID, HR user ID, and token

#### Get Enrolled Clients (Admin Only)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/enrollment/clients` | Get list of enrolled clients | Prisma Admin |

**Response:** List of companies with trial/active status

---

### CLIENTS ENDPOINTS

**Router Prefix:** `/clients`
**Module:** `backend/app/api/v1/clients.py`

#### Invite Client (Send Magic Link)
| Method | Endpoint | Purpose | Auth | Rate Limit |
|--------|----------|---------|------|-----------|
| POST | `/api/v1/clients/invite` | Send magic link invitation to client | Service Role Key | 10/min |

**Request Body:**
```json
{
  "email": "contact@company.com",
  "company_id": "uuid",
  "company_name": "Company Name",
  "hr_user_id": "uuid",
  "full_name": "Full Name"
}
```

**Response:** InviteClientResponse with auth_user_id and success message

**Notes:**
- Uses Supabase Admin Auth (service_role_key)
- Frontend creates company + HR user records first
- This endpoint sends the magic link email from Supabase
- Redirects to `/client/dashboard` after auth

#### Resend Client Invitation
| Method | Endpoint | Purpose | Auth | Rate Limit |
|--------|----------|---------|------|-----------|
| POST | `/api/v1/clients/invite/{company_id}/resend` | Resend invitation to existing client | Service Role Key | 5/min |

**Response:** InviteClientResponse with success message

---

### EMAILS ENDPOINTS

**Router Prefix:** `/emails`
**Module:** `backend/app/api/v1/emails.py`

#### Email Health & Status

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/emails/health` | Get email worker health & metrics | None |

**Response:** EmailHealthResponse with worker status and metrics

#### Email Queries

| Method | Endpoint | Purpose | Auth | Parameters |
|--------|----------|---------|------|-----------|
| GET | `/api/v1/emails/pending` | Get pending emails | None | `limit` (1-100), `offset` |
| GET | `/api/v1/emails/failed` | Get failed emails (DLQ) | None | `limit` (1-100), `offset` |
| GET | `/api/v1/emails/{email_id}` | Get specific email status | None | - |
| GET | `/api/v1/emails/stats/summary` | Get email statistics | None | - |

**Response:** List[EmailStatusResponse] or EmailStatusResponse

**Statistics Response:**
```json
{
  "total_sent": 150,
  "total_pending": 5,
  "total_failed": 2,
  "total_delivered": 145,
  "total_opened": 89,
  "open_rate": 61.38
}
```

#### Email Management

| Method | Endpoint | Purpose | Auth | Rate Limit |
|--------|----------|---------|------|-----------|
| POST | `/api/v1/emails/retry` | Retry failed emails | None | Standard |
| POST | `/api/v1/emails/test` | Send test email | None | Standard |

**Retry Request:**
```json
{
  "email_ids": ["id1", "id2", "id3"]
}
```

**Test Email Request:**
```json
{
  "recipient_email": "test@example.com",
  "recipient_name": "Test User"
}
```

#### Resend Webhook

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/emails/webhooks/resend` | Receive delivery tracking events from Resend | Webhook Key |

**Events Supported:**
- `email.delivered` - Email successfully delivered
- `email.opened` - Recipient opened email
- `email.clicked` - Recipient clicked link
- `email.bounced` - Email bounced
- `email.complained` - Marked as spam

---

## SUPABASE DIRECT CALLS (Frontend)

The frontend also makes direct calls to Supabase (bypassing the backend) for:
- Lead submission (public)
- Position creation (HR form)
- Position updates (business form)
- Application submission
- File uploads (CV, portfolio)
- Company/user management
- Position/applicant queries

**Base:** Supabase SDK via authenticated clients

---

## AUTHENTICATION FLOWS

### Admin Authentication
1. POST `/admin/login` - Form submission
2. Frontend calls Supabase Auth directly
3. Receives JWT token → stored in localStorage
4. All admin API calls include `Authorization: Bearer {token}`

### Client Authentication
1. User receives magic link email
2. Link redirects to `/client/dashboard?code=<code>`
3. Supabase Auth confirms session
4. Frontend redirects to `/client/dashboard`

### Public/Lead Flow
1. No authentication required for `/lead`, `/job/:code`, `/apply/:code`
2. Lead/application data saved directly to Supabase

---

## RATE LIMITING & SECURITY

### Rate Limits
- `/leads` (POST): 10 requests per minute per IP
- `/clients/invite` (POST): 10 requests per minute
- `/clients/invite/{company_id}/resend` (POST): 5 requests per minute
- Other endpoints: Standard Limiter applied

### CORS Configuration
- Configured in main.py
- Allows credentials
- Allows all methods and headers
- Origins configured via environment

### Authentication Methods
1. **Public Routes:** No auth required
2. **Admin Routes:** Requires Prisma admin role (Supabase Auth)
3. **Client Routes:** Requires client role (Supabase Auth via magic link)
4. **Service Routes:** Requires service_role_key for admin operations

---

## ENVIRONMENT VARIABLES

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_URL=http://localhost:3000
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
API_BASE_URL=/api/v1
FRONTEND_URL=http://localhost:3000
```

---

## SUMMARY STATISTICS

| Category | Count |
|----------|-------|
| **Frontend Routes** | 26 |
| **Public Routes** | 6 |
| **Client Routes** | 2 |
| **Admin Routes** | 18 |
| **Backend Endpoints** | 25+ |
| **API Routers** | 4 (leads, enrollment, clients, emails) |
| **Total Unique Routes** | 50+ |

---

## API DOCUMENTATION

**Development:**
- OpenAPI/Swagger Docs: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`
- Available when `DEBUG=true`

**Production:**
- Docs disabled by default
- Can be enabled via `DEBUG` environment variable

---

## WORKFLOW INTEGRATIONS

### Lead to Client Workflow
1. Lead submits via `/lead` form → POST `/api/v1/leads`
2. Admin approves in `/admin/leads`
3. Admin creates client in `/admin/clients/new`
4. System sends magic link via POST `/api/v1/clients/invite`
5. Client logs in via `/client/login`
6. Client accesses `/client/dashboard`

### Position Workflow
1. HR user submits form via `/hr-form`
2. Business leader completes `/business-form?code=XX`
3. Admin reviews in `/admin/positions/:positionId`
4. Admin validates/publishes via `/admin/positions/:positionId/validate`
5. Job published at `/job/:code`
6. Applicants apply via `/apply/:code`

### Recruitment Workflow
1. Applicants apply via `/apply/:code`
2. Admin reviews in `/admin/candidates`
3. Admin qualifies/rejects in `/admin/candidates/:code`
4. Admin generates shortlist via `/admin/shortlist/:code`

