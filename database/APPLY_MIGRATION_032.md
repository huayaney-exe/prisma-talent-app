# Apply Migration 032: Fix last_error Column

## Problem Summary

**Error:** `column "last_error" of relation "email_communications" does not exist`

**Impact:**
- ❌ Position creation fails completely
- ❌ No emails sent to business leaders
- ❌ No job descriptions auto-generated
- ❌ Workflow broken at hr_draft → hr_completed transition

**Root Cause:**
- Migration 013 added `error_message` column
- Migration 022's `send_email_via_resend()` function tries to use `last_error` column
- Schema mismatch causes trigger failure

## How to Apply Migration

### Option 1: Supabase SQL Editor (Recommended)

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa
2. Navigate to: **SQL Editor** (left sidebar)
3. Click: **New Query**
4. Copy and paste the entire contents of `database/migrations/032_add_last_error_column.sql`
5. Click: **Run** (Ctrl+Enter / Cmd+Enter)
6. Verify success message appears: ✅ SUCCESS: Column last_error added

### Option 2: Direct psql Connection

```bash
# Use direct connection (not pooler)
psql "postgresql://postgres.[project-ref]:[password]@[host]:5432/postgres" \
  -f database/migrations/032_add_last_error_column.sql
```

### Option 3: Manual SQL Commands

If you prefer to run commands individually:

```sql
-- Step 1: Add the column
ALTER TABLE email_communications
  ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Step 2: Add documentation
COMMENT ON COLUMN email_communications.last_error IS
  'Last error message from email send attempt. Used by send_email_via_resend() function for retry logic and debugging.';

-- Step 3: Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'email_communications'
  AND column_name = 'last_error';
```

Expected output:
```
 column_name | data_type | is_nullable
-------------+-----------+-------------
 last_error  | text      | YES
```

## Testing After Migration

### Test 1: Create Position as Admin

1. Go to: `/admin/clients`
2. Click: **Crear Posición** on any company
3. Fill out the form completely
4. Click: **Crear Posición**
5. **Expected:** Success! Position created, no errors

### Test 2: Verify Email Sent

Check email_communications table:

```sql
SELECT
  id,
  email_type,
  recipient_email,
  status,
  sent_at,
  last_error
FROM email_communications
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** New row with `email_type = 'leader_form_request'`, `status = 'sent'`

### Test 3: Verify Job Description Created

```sql
SELECT
  jd.id,
  jd.position_id,
  jd.generation_model,
  jd.created_at,
  LENGTH(jd.generated_content) as content_length
FROM job_descriptions jd
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** New row with `generation_model = 'template-v1'`

## Rollback (If Needed)

If you need to revert this migration:

```sql
ALTER TABLE email_communications
  DROP COLUMN IF EXISTS last_error;
```

⚠️ **Warning:** Rollback will break email functionality again!

## Verification Checklist

- [ ] Migration 032 executed successfully
- [ ] Column `last_error` exists in `email_communications` table
- [ ] Position creation works without errors
- [ ] Business leader receives email notification
- [ ] Job description auto-generated
- [ ] Console shows: ✅✅✅ Job description created successfully!

## After Verification

Once verified working:

```bash
git add database/migrations/032_add_last_error_column.sql
git add database/APPLY_MIGRATION_032.md
git commit -m "fix: Add missing last_error column to email_communications table"
git push
```
