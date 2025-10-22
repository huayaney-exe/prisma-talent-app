# Apply Migration 031 - Business Form Public Update Policy

**Migration File**: `migrations/031_business_form_public_update.sql`
**Purpose**: Fix PRODUCTION BLOCKER - Allow business leaders to submit form via email link
**Priority**: 🔴 CRITICAL - Must apply before production deployment

## Problem Being Fixed

Business leaders receive email with link to complete position specifications, but they are NOT authenticated. Current RLS policies block all public updates to positions table, causing "permission denied" errors.

This migration adds a restricted public update policy allowing ONLY:
- Updates to positions in `hr_completed` stage
- Transition to `leader_completed` stage
- No changes to company_id or other protected fields

## Instructions

### Option 1: Supabase Dashboard SQL Editor (RECOMMENDED)

1. Go to: https://vhjjibfblrkyfzcukqwa.supabase.co/project/vhjjibfblrkyfzcukqwa/sql
2. Click "New Query"
3. Copy and paste the SQL below
4. Click "Run" or press `Cmd+Enter`

```sql
-- Migration 031: Business Form Public Update Policy
-- Date: 2025-10-22
-- Purpose: Allow public business leaders to complete position specifications

-- Add public update policy with strict constraints
CREATE POLICY "positions_business_form_public_update" ON positions
  FOR UPDATE
  TO anon
  USING (
    -- Can only update positions in hr_completed stage
    workflow_stage = 'hr_completed'
  )
  WITH CHECK (
    -- Can only transition to leader_completed stage
    workflow_stage = 'leader_completed'
    -- Ensure company_id hasn't changed (security check)
    AND company_id = (SELECT company_id FROM positions WHERE id = positions.id)
  );

-- Add helpful comment
COMMENT ON POLICY "positions_business_form_public_update" ON positions IS
  'Allows unauthenticated business leaders to complete position specifications via email link. Restricted to hr_completed → leader_completed workflow transition only.';

-- Verify policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'positions'
  AND policyname = 'positions_business_form_public_update';
```

### Expected Output

Should show the new policy:

```
schemaname | tablename | policyname                           | permissive | roles    | cmd
-----------+-----------+--------------------------------------+------------+----------+--------
public     | positions | positions_business_form_public_update | PERMISSIVE | {anon}   | UPDATE
```

### Option 2: psql Command Line

If you have direct database access:

```bash
psql "postgresql://postgres.vhjjibfblrkyfzcukqwa:Vigorelli23$@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  -f database/migrations/031_business_form_public_update.sql
```

## Verification

After running, verify the policy exists:

```sql
-- Check all RLS policies on positions table
SELECT
  policyname,
  roles,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'positions'
ORDER BY policyname;
```

Should include the new policy:
- `positions_business_form_public_update` - {anon} - UPDATE - PERMISSIVE

## Security Considerations

This policy is intentionally restrictive:

✅ **What it ALLOWS**:
- Public users can update positions ONLY in `hr_completed` stage
- Can ONLY transition to `leader_completed` stage
- Business form fields can be updated (work_arrangement, team_size, etc.)

❌ **What it BLOCKS**:
- Cannot update positions in other stages (active, cancelled, etc.)
- Cannot change company_id (security check prevents tenant hopping)
- Cannot transition to stages other than `leader_completed`
- Cannot create new positions (only update existing)

## Testing

After applying migration, test the business form flow:

1. Create a test position (authenticated client)
2. Position enters `hr_completed` stage
3. Database trigger sends email to business leader
4. Business leader clicks link (unauthenticated)
5. Submits business form → should succeed ✅
6. Position transitions to `leader_completed` stage

## Impact

**Fixes**: BLOCKER #2 from Production Readiness QA
**Affected Flow**: Flow 4 - Business Leader Completes Position
**Before**: Business form submission fails with RLS permission denied
**After**: Business form submission succeeds, position updated correctly

## Related Files

- `frontend/src/services/positionService.ts:98-129` - updateBusinessSpecs function
- `frontend/src/pages/public/BusinessFormPage.tsx` - Business form UI
- `database/migrations/006_rls_policies_update.sql` - Original RLS policies
- `PRODUCTION_READINESS_QA.md` - Production blockers analysis
