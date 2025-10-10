# Integration Testing Guide

Production-grade frontend integration testing with backend and verification checklist.

## Overview

This guide covers backend integration testing for the Prisma Talent Platform frontend after completing all form implementations.

## Prerequisites

✅ **Required**:
- Backend API running on `http://localhost:8000`
- Supabase project configured with proper environment variables
- PostgreSQL database with schema migrated
- Email service configured (Resend or SendGrid)

## Environment Setup

### 1. Verify Environment Variables

Create `/frontend/.env` from `.env.example`:

```bash
# API
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App
VITE_APP_NAME="Prisma Talent"
VITE_APP_URL=http://localhost:3000
```

### 2. Start Backend Services

```bash
# Terminal 1: Start backend API
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

### 3. Verify Backend Health

```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}

curl http://localhost:8000/api/v1/docs
# Expected: Swagger UI documentation page
```

## Test Scenarios

### Scenario 1: Lead Submission Flow

**Objective**: Verify leads can be submitted and stored correctly.

**Steps**:

1. Navigate to `http://localhost:3000/lead-form`
2. Fill out the Lead Form with test data:
   - **Name**: "Test User"
   - **Email**: "test@example.com"
   - **Phone**: "+51999999999"
   - **Position**: "CEO"
   - **Company**: "Test Company Inc"
   - **Industry**: "SaaS"
   - **Company Size**: "11-50"
   - **Intent**: "Conversation"
3. Click "Enviar Solicitud"

**Expected Results**:
- ✅ Form submits without errors
- ✅ Success modal appears with "¡Solicitud Recibida!"
- ✅ Network request to `POST /api/v1/leads` returns 201
- ✅ Response contains `lead_id`, `company_id`, `subscription_status`

**Backend Verification**:

```sql
-- Verify lead was created
SELECT * FROM leads
WHERE contact_email = 'test@example.com'
ORDER BY created_at DESC LIMIT 1;

-- Verify company was created or linked
SELECT * FROM companies
WHERE company_name = 'Test Company Inc';
```

**Edge Cases to Test**:
- Submit with `intent: hiring` and verify position fields are required
- Submit duplicate email and verify error handling
- Submit with invalid email format and verify validation

---

### Scenario 2: HR Form → Position Creation Flow

**Objective**: Verify HR can create positions and business leaders receive notification emails.

**Steps**:

1. Navigate to `http://localhost:3000/hr-form`
2. Fill out the HR Form:
   - **Position Name**: "Senior Product Manager - Payments"
   - **Area**: "Product Management"
   - **Seniority**: "Senior"
   - **Business Leader Name**: "Carlos Rodriguez"
   - **Business Leader Position**: "VP of Product"
   - **Business Leader Email**: "carlos@testcompany.com"
   - **Salary Range**: "$100,000 - $150,000"
   - **Equity**: Check box, add "0.5% - 1% with 4-year vesting"
   - **Contract Type**: "Full-Time"
   - **Target Fill Date**: Select date 2 months from now
   - **Position Type**: "New"
   - **Critical Notes**: "Looking for fintech experience"
3. Click "Crear Posición y Notificar Líder"

**Expected Results**:
- ✅ Form submits without errors
- ✅ Success modal shows position code (e.g., "POS-20250115-001")
- ✅ Network request to `POST /api/v1/positions` returns 201
- ✅ Email notification sent to business leader with magic link

**Backend Verification**:

```sql
-- Verify position was created
SELECT * FROM positions
WHERE position_name = 'Senior Product Manager - Payments';

-- Verify workflow stage is correct
SELECT position_code, workflow_stage, created_at
FROM positions
ORDER BY created_at DESC LIMIT 1;
-- Expected: workflow_stage = 'hr_completed'

-- Verify business user fields
SELECT business_user_name, business_user_email
FROM positions
WHERE position_code = 'POS-20250115-001';
```

**Email Verification**:
- Check email logs or inbox for carlos@testcompany.com
- Verify email contains:
  - Position name and code
  - Magic link to complete business specs
  - Clear call-to-action

---

### Scenario 3: Business Leader Form → Complete Specs Flow

**Objective**: Verify business leaders can complete area-specific questions.

**Steps**:

1. Use position code from Scenario 2 (e.g., "POS-20250115-001")
2. Navigate to `http://localhost:3000/business-form?code=POS-20250115-001`
3. Verify position context card displays correctly
4. Answer all Product Management questions (9 questions):
   - **Customer Contact**: "Weekly"
   - **Product Maturity**: "Growth - scaling product"
   - **Data Infrastructure**: "Advanced - experimentation platform"
   - **Discovery Method**: "Continuous - user interviews + data"
   - **Success Ownership**: "Direct - owns OKRs"
   - **Tech Collaboration**: "High - daily pairing"
   - **Roadmap Building**: "Collaborative - cross-functional"
   - **Backlog Refinement**: "Weekly cadence"
   - **Experimentation**: "High - A/B tests monthly"
5. Navigate through all questions using "Siguiente" button
6. On last question, click "Completar Especificaciones"

**Expected Results**:
- ✅ Position loads with correct details
- ✅ Progress bar updates (11%, 22%, 33%, etc.)
- ✅ All 9 questions displayed with proper types
- ✅ Form submits successfully
- ✅ Success modal: "¡Especificaciones Completadas!"
- ✅ Network request to `PATCH /api/v1/positions/{code}/business-specs` returns 200

**Backend Verification**:

```sql
-- Verify workflow stage advanced
SELECT workflow_stage FROM positions
WHERE position_code = 'POS-20250115-001';
-- Expected: workflow_stage = 'business_completed'

-- Verify area_specific_data was stored
SELECT area_specific_data FROM positions
WHERE position_code = 'POS-20250115-001';
-- Should contain JSON with all 9 answers
```

**Edge Cases to Test**:
- Navigate back and forth between questions
- Leave required fields empty and verify validation
- Submit with invalid position code and verify error handling

---

### Scenario 4: Cross-Area Testing

**Objective**: Verify all 4 areas work correctly with their specific questions.

**Test Matrix**:

| Area | Questions | Key Fields |
|------|-----------|------------|
| Product Management | 9 | customer_contact, product_maturity, data_infrastructure |
| Engineering & Tech | 9 | tech_stack, architecture, code_review |
| Growth | 9 | growth_channels, budget, experimentation |
| Design | 9 | design_system, user_research, prototyping |

**Steps**:

For each area:
1. Create new position via HR Form with different `area` value
2. Complete Business Leader Form with area-specific questions
3. Verify all questions render correctly
4. Verify submission stores data in `area_specific_data`

**Expected Results**:
- ✅ Each area loads unique question set from `areaQuestions.ts`
- ✅ Question count matches: 9 questions per area
- ✅ Field types render correctly (text, textarea, select, number)
- ✅ All data stored in PostgreSQL JSONB column

---

## API Endpoint Verification

### Lead Endpoints

```bash
# Create lead
curl -X POST http://localhost:8000/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "contact_name": "API Test",
    "contact_email": "api@test.com",
    "contact_phone": "+51999999999",
    "contact_position": "CTO",
    "company_name": "API Test Co",
    "intent": "hiring",
    "role_title": "Senior Engineer",
    "role_type": "Engineering",
    "seniority": "Senior"
  }'

# Expected: 201 Created
# Response: { "id": "...", "company_id": "...", "message": "..." }
```

### Position Endpoints

```bash
# Create position (requires authentication)
curl -X POST http://localhost:8000/api/v1/positions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "position_name": "API Test Position",
    "area": "engineering-tech",
    "seniority": "senior",
    "business_user_name": "Tech Lead",
    "business_user_position": "CTO",
    "business_user_email": "cto@test.com",
    "salary_range": "$120k-$180k",
    "equity_included": false,
    "contract_type": "full-time",
    "target_fill_date": "2025-06-01",
    "position_type": "new"
  }'

# Expected: 201 Created
# Response: { "id": "...", "position_code": "POS-...", "workflow_stage": "hr_completed" }

# Get position by code (public endpoint)
curl http://localhost:8000/api/v1/positions/code/POS-20250115-001

# Expected: 200 OK
# Response: Full position object

# Update business specs
curl -X PATCH http://localhost:8000/api/v1/positions/POS-20250115-001/business-specs \
  -H "Content-Type: application/json" \
  -d '{
    "customer_contact": "weekly",
    "product_maturity": "growth",
    "data_infrastructure": "advanced"
  }'

# Expected: 200 OK
# Response: Updated position with workflow_stage = 'business_completed'
```

---

## Error Handling Verification

### Test Error Scenarios

1. **Network Errors**:
   - Stop backend server
   - Try submitting form
   - Expected: "No se pudo conectar con el servidor" error message

2. **Validation Errors (422)**:
   - Submit incomplete form
   - Expected: Field-specific error messages in Spanish

3. **Not Found (404)**:
   - Navigate to `/business-form?code=INVALID-CODE`
   - Expected: Error message "No se pudo cargar la información de la posición"

4. **Server Errors (500)**:
   - Simulate database connection failure
   - Expected: "Ha ocurrido un error inesperado" error message

---

## Performance Testing

### Load Time Benchmarks

- **Initial Page Load**: < 2 seconds
- **Form Submission**: < 1 second
- **Position Load (Business Form)**: < 500ms
- **File Upload (Applicant Form)**: < 3 seconds for 5MB PDF

### Network Request Monitoring

Open Chrome DevTools → Network tab:

1. Verify API requests use correct base URL
2. Verify Authorization headers are present where required
3. Verify response times are within benchmarks
4. Verify no unnecessary duplicate requests

---

## Completion Checklist

### Lead Form
- [ ] Submit with `intent: conversation` works
- [ ] Submit with `intent: hiring` requires position fields
- [ ] Email validation works correctly
- [ ] Success modal displays
- [ ] Form resets after submission
- [ ] Error messages display in Spanish
- [ ] Network request to `/leads` returns 201

### HR Form
- [ ] All required fields validated
- [ ] Equity checkbox shows/hides details field
- [ ] Date picker works correctly
- [ ] Success modal shows position code
- [ ] Position code can be copied
- [ ] Email notification sent to business leader
- [ ] Network request to `/positions` returns 201

### Business Leader Form
- [ ] Position loads from URL parameter
- [ ] Position context card displays correctly
- [ ] All 4 areas load correct question sets
- [ ] Progress bar updates correctly
- [ ] Navigation (previous/next) works
- [ ] Required field validation works
- [ ] Success modal displays after submission
- [ ] Network request to `/positions/{code}/business-specs` returns 200
- [ ] Workflow stage advances to `business_completed`

### Error Handling
- [ ] Network errors display user-friendly messages
- [ ] Validation errors show field-specific messages
- [ ] 404 errors handled gracefully
- [ ] Loading states display correctly
- [ ] Forms disabled during submission

### Performance
- [ ] Page loads < 2 seconds
- [ ] API requests < 1 second
- [ ] No console errors in production build
- [ ] No memory leaks after multiple submissions

---

## Next Steps After Integration Testing

Once all tests pass:

1. **Frontend Deployment**:
   ```bash
   cd frontend
   npm run build
   # Deploy dist/ to Vercel or similar
   ```

2. **Backend Deployment**:
   - Deploy FastAPI to Railway, Render, or AWS
   - Configure production environment variables
   - Set up database backups

3. **Monitoring Setup**:
   - Add Sentry for error tracking
   - Set up logging (LogTail, DataDog)
   - Configure uptime monitoring (UptimeRobot)

4. **Production Validation**:
   - Re-run all test scenarios on production URLs
   - Verify email delivery in production
   - Test with real data

---

## Troubleshooting

### Common Issues

**Issue**: CORS errors in browser console
**Solution**: Verify backend has CORS configured:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Issue**: 401 Unauthorized on position endpoints
**Solution**: Ensure authentication is configured correctly or use public endpoints for testing

**Issue**: Validation errors in Spanish not displaying
**Solution**: Verify Zod schemas in `lib/validation.ts` have Spanish error messages

**Issue**: Position not loading in Business Leader Form
**Solution**: Verify position code in URL matches database and workflow_stage is correct

---

## Summary

This integration testing guide provides comprehensive coverage for verifying the Prisma Talent Platform frontend with the backend API. Follow each scenario systematically to ensure production-grade quality before deployment.

**Total Testing Time**: 2-3 hours for complete verification
**Required**: Backend API running, Supabase configured, email service active
**Outcome**: Production-ready frontend validated against all backend endpoints
