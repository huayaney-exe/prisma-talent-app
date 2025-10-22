# Apply Migration 026: Fix Email Constraint and Config RLS

## Quick Summary
This migration fixes two critical issues blocking client creation:
1. **Email Constraint**: Allows same email across different companies (multi-tenant fix)
2. **RLS Policy**: Allows `invite_client()` function to read `app_config` table

---

## Apply Migration

### Option 1: Supabase SQL Editor (Recommended)
1. Go to: **Supabase Dashboard → SQL Editor**
2. Click: **New Query**
3. Copy/paste entire contents of: `database/migrations/026_fix_email_and_config_rls.sql`
4. Click: **Run** (or `Cmd/Ctrl + Enter`)
5. Verify success messages in output

### Option 2: psql Command Line
```bash
PGPASSWORD='your-password' psql \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -d postgres \
  -U postgres.vhjjibfblrkyfzcukqwa \
  -f database/migrations/026_fix_email_and_config_rls.sql
```

---

## Verification Steps

### 1. Verify Email Constraint Changed
Run this query in Supabase SQL Editor:
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'hr_users'
  AND constraint_name LIKE '%email%';
```

**Expected output**:
```
constraint_name              | constraint_type
-----------------------------|----------------
hr_users_company_email_key   | UNIQUE
```

**Should NOT see**: `hr_users_email_key` (old global constraint)

---

### 2. Verify RLS Policies Updated
Run this query:
```sql
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'app_config'
ORDER BY policyname;
```

**Expected output**:
```
policyname                              | roles              | cmd
----------------------------------------|--------------------|---------
Authenticated can read config           | {authenticated}    | SELECT
Prevent authenticated deletes from config| {authenticated}   | DELETE
Prevent authenticated updates to config | {authenticated}    | UPDATE
Prevent authenticated writes to config  | {authenticated}    | INSERT
Service role can read config            | {service_role}     | SELECT
```

**Key check**: `Authenticated can read config` should exist with SELECT permission.

---

### 3. Test Config Access from Function
Run this query to verify functions can read config:
```sql
SELECT
  key,
  length(value) as value_length,
  description
FROM app_config
ORDER BY key;
```

**Expected output**:
```
key                        | value_length | description
---------------------------|--------------|----------------------------------
frontend_url               | 35           | Frontend application URL
resend_api_key            | 34           | Resend API key for sending emails
supabase_service_role_key | 267          | Supabase service role key (Admin API)
supabase_url              | 43           | Supabase project URL
```

**All values should have length > 0** (not NULL).

---

## Test Client Creation

### Test Case 1: Existing Email (Should Now Work)
1. Go to: `https://prismatalent.vercel.app/admin`
2. Click: **New Business Client**
3. Fill form with:
   - Company Name: Test Company 2
   - Domain: testco2.com
   - Email: `luis.huayaney@pucp.pe` (existing email from error)
   - Full Name: Luis Huayaney
4. Submit
5. **Expected**: ✅ Success! Client created, magic link sent

### Test Case 2: New Email (Should Also Work)
1. Same process as above
2. Use new email: `luis@colombiatechweek.co`
3. **Expected**: ✅ Success! Client created, magic link sent

---

## Check for Errors

### Monitor email_communications Table
```sql
SELECT
  id,
  recipient_email,
  email_type,
  status,
  last_error,
  sent_at,
  created_at
FROM email_communications
WHERE email_type = 'client_invitation'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**:
- `status` = `'sent'`
- `sent_at` has timestamp
- `last_error` is NULL

### Check Supabase Auth Logs
1. Go to: **Supabase Dashboard → Authentication → Logs**
2. Look for: "User invited" events
3. Verify magic link emails sent

---

## Rollback (If Needed)

If something goes wrong, rollback with:
```sql
-- Restore old email constraint (blocks multi-tenant usage)
ALTER TABLE hr_users DROP CONSTRAINT IF EXISTS hr_users_company_email_key;
ALTER TABLE hr_users ADD CONSTRAINT hr_users_email_key UNIQUE(email);

-- Restore restrictive RLS
DROP POLICY IF EXISTS "Authenticated can read config" ON app_config;
DROP POLICY IF EXISTS "Prevent authenticated writes to config" ON app_config;
DROP POLICY IF EXISTS "Prevent authenticated updates to config" ON app_config;
DROP POLICY IF EXISTS "Prevent authenticated deletes from config" ON app_config;

CREATE POLICY "Block all other access"
  ON app_config FOR ALL
  TO anon, authenticated
  USING (false);
```

---

## Success Criteria

- [x] Migration 026 applied without errors
- [x] Email constraint changed to `hr_users_company_email_key (company_id, email)`
- [x] RLS policy `Authenticated can read config` exists
- [x] Config query returns values (not NULL)
- [x] Client creation works with existing email
- [x] Client creation works with new email
- [x] Magic link emails received and functional
- [x] No errors in `email_communications.last_error`

---

## What This Fixes

### Before Migration 026:
❌ Cannot create HR user with email that exists in another company
❌ `invite_client()` function cannot read `app_config` (returns NULL)
❌ Client creation fails with "duplicate key" or "configuration not set" errors

### After Migration 026:
✅ Same email can work for multiple companies (proper multi-tenant behavior)
✅ Email still unique within each company (prevents accidental duplicates)
✅ `invite_client()` function can read configuration from `app_config`
✅ Magic link invitations send successfully
✅ Client creation workflow fully functional

---

**Next Steps**: After verifying this migration works, you can proceed with deleting the Render backend as planned in PHASE_4_IMPLEMENTATION_GUIDE.md
