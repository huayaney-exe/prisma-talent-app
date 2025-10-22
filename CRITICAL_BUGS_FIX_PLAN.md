# Critical Bugs - Architecture-Aligned Fix Plan

**Date**: 2025-10-22
**Architecture**: Pure Supabase (Database + Triggers + Edge Functions + RLS)
**Status**: 🔴 5 CRITICAL BUGS - Ready to Fix

---

## Architecture Principles (Our Foundation)

1. **Database-First**: Business logic in SQL functions, triggers, and RLS policies
2. **Edge Functions**: For operations requiring service_role_key or external APIs
3. **Frontend**: Direct Supabase queries for reads, RPC/Edge Functions for complex writes
4. **No Backend Server**: All eliminated, running pure Supabase
5. **Immediate Triggers**: Database triggers fire instantly on INSERT/UPDATE

---

## 🔴 BUG #1: Missing /client/positions Route

### Current State
- [ClientDashboardPage.tsx:114](frontend/src/pages/client/ClientDashboardPage.tsx#L114) has button: "Ver Posiciones"
- Navigates to `/client/positions`
- **Route doesn't exist in App.tsx**
- **Result**: 404 error

### Architecture Decision: Create the Route

**Why**: Clients need to view their positions - this is core functionality.

**Implementation Plan**:

**Option A**: Full positions page (RECOMMENDED)
```typescript
// 1. Create: frontend/src/pages/client/ClientPositionsPage.tsx
export function ClientPositionsPage() {
  const { user } = useAuth()
  const [positions, setPositions] = useState([])

  useEffect(() => {
    loadPositions()
  }, [user?.id])

  const loadPositions = async () => {
    if (!user?.id) return

    // Get company_id from user metadata or companies table
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('primary_contact_auth_id', user.id)
      .single()

    if (!company) return

    // Get all positions for this company
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load positions:', error)
      return
    }

    setPositions(data || [])
  }

  return (
    <div>
      {/* List positions with workflow_stage badges */}
      {/* Show position_code, position_name, area, workflow_stage */}
      {/* Click to view details */}
    </div>
  )
}

// 2. Add route to App.tsx
<Route
  path="/client/positions"
  element={
    <ProtectedRoute requireClient>
      <ClientPositionsPage />
    </ProtectedRoute>
  }
/>
```

**Option B**: Redirect to HR form (TEMPORARY WORKAROUND)
```typescript
// Just change the button in ClientDashboardPage.tsx
<Button onClick={() => navigate('/hr-form')} ...>
  Crear Nueva Posición
</Button>
```

**RECOMMENDATION**: Option A - Build proper positions list page
**Effort**: 2-3 hours
**Priority**: HIGH - Clients need this immediately after onboarding

---

## 🔴 BUG #2: Hardcoded UUID in Position Creation

### Current State
- [positionService.ts:54](frontend/src/services/positionService.ts#L54)
- Uses: `created_by: '00000000-0000-0000-0000-000000000000'`
- **Database expects**: `created_by UUID NOT NULL REFERENCES hr_users(id)`

### Problem Analysis
1. **Database constraint**: positions.created_by must reference hr_users.id
2. **RLS policies**: Likely check `created_by = auth.uid()` for permissions
3. **Audit trail**: Breaks attribution of who created the position
4. **Frontend context**: HRForm is used by both:
   - Authenticated clients (from /client/dashboard)
   - Public users (embedded /hr-form page)

### Architecture Decision: Handle Both Authenticated & Public Use Cases

**Why**: HR form serves dual purposes:
- **Authenticated**: Client users creating positions for their company
- **Public**: Embedded in client websites (no auth)

**Implementation Plan**:

```typescript
// frontend/src/services/positionService.ts

async createPosition(data: HRFormData, companyId?: string): Promise<Position> {
  try {
    // 1. Get current auth session (may be null for public forms)
    const { data: { session } } = await supabase.auth.getSession()

    // 2. Determine company_id
    let finalCompanyId = companyId

    if (!finalCompanyId && session?.user) {
      // Authenticated user - get their company
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('primary_contact_auth_id', session.user.id)
        .single()

      if (company) {
        finalCompanyId = company.id
      }
    }

    if (!finalCompanyId) {
      throw new Error('Company ID is required. Please contact support.')
    }

    // 3. Get hr_user_id for created_by
    let createdBy: string | null = null

    if (session?.user) {
      // Authenticated: Find hr_user record
      const { data: hrUser } = await supabase
        .from('hr_users')
        .select('id')
        .eq('company_id', finalCompanyId)
        .eq('email', session.user.email)
        .maybeSingle()

      createdBy = hrUser?.id || null
    }

    // 4. Insert position
    const { data: position, error } = await supabase
      .from('positions')
      .insert({
        company_id: finalCompanyId,
        position_name: data.position_name,
        area: data.area,
        seniority: data.seniority,
        leader_name: data.business_user_name,
        leader_position: data.business_user_position,
        leader_email: data.business_user_email,
        salary_range: data.salary_range,
        equity_included: data.equity_included,
        equity_details: data.equity_details,
        contract_type: data.contract_type,
        timeline: data.target_fill_date,
        position_type: data.position_type,
        critical_notes: data.critical_notes,
        workflow_stage: 'hr_completed',
        hr_completed_at: new Date().toISOString(),
        created_by: createdBy,  // ✅ NULL for public, UUID for authenticated
      })
      .select()
      .single()

    if (error) throw error
    return position as Position
  } catch (error) {
    console.error('[PositionService] Create position failed:', error)
    throw new Error(getErrorMessage(error))
  }
}
```

**Database Migration Required**:

```sql
-- migration 030_make_positions_created_by_nullable.sql

-- Make created_by nullable for public HR form submissions
ALTER TABLE positions
  ALTER COLUMN created_by DROP NOT NULL;

-- Update constraint
ALTER TABLE positions
  DROP CONSTRAINT IF EXISTS positions_created_by_fkey,
  ADD CONSTRAINT positions_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES hr_users(id)
    ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN positions.created_by IS
  'HR user who created this position. NULL for public form submissions before client auth setup.';
```

**RECOMMENDATION**: Make created_by nullable + smart detection
**Effort**: 1 hour
**Priority**: CRITICAL - Affects all position creation

---

## 🔴 BUG #3: Invalid Applicant Database Query

### Current State
- [applicantService.ts:100](frontend/src/services/applicantService.ts#L100)
- Query: `.select('*, positions(position_code, position_name, company_name)')`
- **Problem**: positions table doesn't have company_name column

### Database Schema
```
positions:
  - position_code
  - position_name
  - company_id (FK → companies)

companies:
  - company_name
```

### Architecture Decision: Fix Join Syntax

**Why**: Need nested join to get company name through positions → companies relationship

**Implementation Plan**:

```typescript
// frontend/src/services/applicantService.ts

async getAllApplicants(positionCode?: string, qualificationStatus?: string) {
  try {
    let query = supabase
      .from('applicants')
      .select(`
        *,
        positions!inner(
          position_code,
          position_name,
          company_id,
          companies(company_name)
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by position code (see Bug #4 fix)
    if (positionCode) {
      // Get position ID first
      const { data: position } = await supabase
        .from('positions')
        .select('id')
        .eq('position_code', positionCode)
        .maybeSingle()

      if (position) {
        query = query.eq('position_id', position.id)
      }
    }

    // Filter by qualification status
    if (qualificationStatus && qualificationStatus !== 'all') {
      query = query.eq('qualification_status', qualificationStatus)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    console.error('[ApplicantService] Get all applicants failed:', error)
    throw new Error(getErrorMessage(error))
  }
}
```

**Alternative (if nested join doesn't work)**:

```typescript
// Fetch applicants first, then enrich with company names
const { data: applicants, error } = await supabase
  .from('applicants')
  .select(`
    *,
    positions(position_code, position_name, company_id)
  `)
  .order('created_at', { ascending: false })

if (error) throw error

// Enrich with company names
const enriched = await Promise.all(
  applicants.map(async (app) => {
    if (!app.positions?.company_id) return app

    const { data: company } = await supabase
      .from('companies')
      .select('company_name')
      .eq('id', app.positions.company_id)
      .single()

    return {
      ...app,
      positions: {
        ...app.positions,
        company_name: company?.company_name
      }
    }
  })
)

return enriched
```

**RECOMMENDATION**: Try nested join first, fallback to enrichment if needed
**Effort**: 30 minutes
**Priority**: CRITICAL - Admin cannot view applicants

---

## 🔴 BUG #4: Broken Position Code Filtering

### Current State
- [applicantService.ts:104](frontend/src/services/applicantService.ts#L104)
- Uses: `query.eq('positions.position_code', positionCode)`
- **Problem**: Supabase doesn't support filtering on joined table fields with dot notation

### Architecture Decision: Fetch Position ID First

**Why**: Supabase filters work on direct columns, not joined tables

**Implementation Plan**:

```typescript
// frontend/src/services/applicantService.ts

async getAllApplicants(positionCode?: string, qualificationStatus?: string) {
  try {
    let query = supabase
      .from('applicants')
      .select(`
        *,
        positions!inner(
          position_code,
          position_name,
          company_id,
          companies(company_name)
        )
      `)
      .order('created_at', { ascending: false })

    // ✅ FIX: Filter by position_id, not position_code
    if (positionCode) {
      // Step 1: Get position ID from code
      const { data: position, error: posError } = await supabase
        .from('positions')
        .select('id')
        .eq('position_code', positionCode)
        .maybeSingle()

      if (posError) {
        console.error('Failed to find position:', posError)
        return []  // Return empty if position not found
      }

      if (!position) {
        console.warn(`Position with code ${positionCode} not found`)
        return []  // Return empty array, not error
      }

      // Step 2: Filter applicants by position_id
      query = query.eq('position_id', position.id)
    }

    // Filter by qualification status
    if (qualificationStatus && qualificationStatus !== 'all') {
      query = query.eq('qualification_status', qualificationStatus)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[ApplicantService] Get all applicants failed:', error)
    throw new Error(getErrorMessage(error))
  }
}
```

**Same fix needed in**:
- `getQualifiedApplicants()` - line 177

```typescript
async getQualifiedApplicants(positionCode: string) {
  try {
    // Step 1: Get position ID
    const { data: position, error: posError } = await supabase
      .from('positions')
      .select('id')
      .eq('position_code', positionCode)
      .single()

    if (posError) throw posError
    if (!position) throw new Error('Position not found')

    // Step 2: Query applicants by position_id
    const { data, error } = await supabase
      .from('applicants')
      .select(`
        *,
        positions!inner(
          position_code,
          position_name,
          companies(company_name)
        )
      `)
      .eq('position_id', position.id)
      .eq('qualification_status', 'qualified')
      .order('score', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('[ApplicantService] Get qualified applicants failed:', error)
    throw new Error(getErrorMessage(error))
  }
}
```

**RECOMMENDATION**: Always resolve position_code → position_id before filtering
**Effort**: 30 minutes
**Priority**: CRITICAL - Applicant filtering completely broken

---

## 🔴 BUG #5: Resend Invitation Security Issue

### Current State
- [clientService.ts:228](frontend/src/services/clientService.ts#L228)
- Uses: `supabase.auth.admin.inviteUserByEmail()`
- **Problem**: Requires service_role_key which CANNOT be in frontend

### Security Analysis
- `supabase.auth.admin.*` methods require service_role_key
- Service_role_key = **full database access**, bypasses all RLS
- **If in frontend .env**: Exposed to all users in browser (CRITICAL SECURITY BREACH)
- **If using anon key**: Method will fail with permission error

### Architecture Decision: Use Edge Function (Like createClient)

**Why**: Edge Functions run server-side with service_role_key securely

**Current Working Pattern**:
```typescript
// clientService.ts:124 - THIS WORKS
const { data: inviteResult, error: inviteError } = await supabase.functions.invoke('invite-client', {
  body: {
    email: data.primary_contact_email.toLowerCase(),
    company_id: company.id,
    company_name: data.company_name,
    hr_user_id: hrUser.id,
    full_name: data.primary_contact_name,
  }
})
```

**Implementation Plan**:

**Step 1**: Update resendInvitation function

```typescript
// frontend/src/services/clientService.ts

async resendInvitation(companyId: string) {
  try {
    // Get company primary contact
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('primary_contact_email, company_name, id')
      .eq('id', companyId)
      .single()

    if (companyError) throw companyError

    // Get HR user for metadata
    const { data: hrUser, error: hrUserError } = await supabase
      .from('hr_users')
      .select('id, full_name')
      .eq('company_id', companyId)
      .eq('email', company.primary_contact_email)
      .single()

    if (hrUserError) throw hrUserError

    // ✅ FIX: Use Edge Function instead of admin API
    const { data: inviteResult, error: inviteError } = await supabase.functions.invoke('invite-client', {
      body: {
        email: company.primary_contact_email.toLowerCase(),
        company_id: company.id,
        company_name: company.company_name,
        hr_user_id: hrUser.id,
        full_name: hrUser.full_name,
        resend: true,  // Flag to indicate this is a resend
      }
    })

    if (inviteError) {
      throw new Error(`Edge Function error: ${inviteError.message}`)
    }

    if (!inviteResult?.success) {
      throw new Error(inviteResult?.error || 'Failed to resend invitation')
    }

    return {
      message: `✅ Invitación reenviada a ${company.primary_contact_email}`,
    }
  } catch (error) {
    console.error('[ClientService] Resend invitation failed:', error)
    throw new Error(getErrorMessage(error))
  }
}
```

**Step 2**: Update Edge Function (if needed)

```typescript
// supabase/functions/invite-client/index.ts

// Add support for resend parameter
const { email, company_id, company_name, hr_user_id, full_name, resend } = req.body

// Edge Function already handles invitations correctly
// Just ensure it supports the resend flag (optional - for logging/tracking)

if (resend) {
  console.log(`Resending invitation to ${email} for company ${company_name}`)
}

// Rest of Edge Function logic remains the same
// Supabase Auth handles duplicate invitations gracefully
```

**Step 3**: Verify Environment Variables

```bash
# frontend/.env - SHOULD ONLY HAVE anon key
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx  # ✅ Public, safe for frontend

# ❌ NEVER in frontend/.env:
# VITE_SUPABASE_SERVICE_ROLE_KEY=xxx  # SECURITY BREACH

# Edge Function environment (secure server-side):
SUPABASE_SERVICE_ROLE_KEY=xxx  # ✅ Only available in Edge Functions
```

**RECOMMENDATION**: Use Edge Function pattern consistently
**Effort**: 15 minutes (just update client service)
**Priority**: CRITICAL - Security vulnerability if service_role_key exposed

---

## Implementation Sequence

### Phase 1: Immediate Fixes (Today) - 3 hours
```
1. Bug #5 - Resend Invitation (15 min) ← START HERE (security)
2. Bug #2 - Hardcoded UUID + Migration (1 hour)
3. Bug #3 - Applicant Query (30 min)
4. Bug #4 - Position Filtering (30 min)
```

### Phase 2: Client Positions Page (Tomorrow) - 3 hours
```
5. Bug #1 - Create ClientPositionsPage (2-3 hours)
```

---

## Testing Checklist

After implementing fixes:

```bash
# Bug #1: Client Positions
- [ ] Client can navigate to /client/positions
- [ ] Positions list loads correctly
- [ ] Shows correct workflow_stage for each position
- [ ] Empty state shows when no positions

# Bug #2: Position Creation
- [ ] Authenticated client creates position → created_by = hr_user.id
- [ ] Public form creates position → created_by = NULL
- [ ] Position shows up in admin dashboard
- [ ] No foreign key constraint errors

# Bug #3: Applicant Query
- [ ] Admin can load applicants page
- [ ] Company name displays correctly
- [ ] No "relation does not exist" errors
- [ ] Join returns expected data structure

# Bug #4: Position Filtering
- [ ] Admin can filter applicants by position_code
- [ ] Shows correct applicants for selected position
- [ ] Empty state when no applicants for position
- [ ] getQualifiedApplicants works for shortlist

# Bug #5: Resend Invitation
- [ ] Admin can resend invitation from leads page
- [ ] Client receives magic link email
- [ ] No console errors about admin API
- [ ] Check frontend/.env has NO service_role_key
```

---

## Success Criteria

✅ **All 5 critical bugs fixed**
✅ **No security vulnerabilities** (service_role_key only in Edge Functions)
✅ **Architecture consistency** (Database-first, Edge Functions for admin ops)
✅ **User workflows functional** (Lead → Client, Position creation, Applicant review)
✅ **Database integrity** (Proper FKs, nullable where needed, RLS working)

---

## Next Steps After Critical Fixes

1. **HIGH Priority Bugs** (Phase 2):
   - Business form URL validation
   - Domain validation error handling
   - Position workflow stage checks

2. **Database Verification**:
   - Run schema queries to confirm assumptions
   - Test RLS policies with different user types
   - Verify trigger behavior for email sending

3. **Integration Testing**:
   - End-to-end lead to client workflow
   - Complete position workflow (HR → Leader → Admin → Active)
   - Applicant submission and review flow
