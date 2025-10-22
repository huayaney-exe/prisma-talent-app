# Diagnose invite_client Configuration Issue

## Error Message
```
Error al crear cliente:
Supabase configuration not set. Configure app.supabase_url and app.supabase_service_role_key.
```

This means the `invite_client()` function is reading **NULL values** from `app_config` table.

---

## Step-by-Step Diagnosis

### Step 1: Verify Migration 026 Was Applied

Check if the RLS policies were updated:

```sql
-- Check RLS policies on app_config
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'app_config'
ORDER BY policyname;
```

**Expected output** (after migration 026):
```
policyname                               | roles            | cmd
-----------------------------------------|------------------|---------
Authenticated can read config            | {authenticated}  | SELECT
Prevent authenticated deletes from config| {authenticated}  | DELETE
Prevent authenticated updates to config  | {authenticated}  | UPDATE
Prevent authenticated writes to config   | {authenticated}  | INSERT
Service role can read config             | {service_role}   | SELECT
```

**If you DON'T see "Authenticated can read config"**, migration 026 wasn't applied yet.

---

### Step 2: Test Config Access as Authenticated User

Simulate what the function sees:

```sql
-- Switch to authenticated role (simulates function behavior)
SET ROLE authenticated;

-- Try to read config (this is what invite_client() does)
SELECT key, length(value) as value_length
FROM app_config
WHERE key IN ('supabase_url', 'supabase_service_role_key')
ORDER BY key;

-- Reset to normal role
RESET ROLE;
```

**Expected output**:
```
key                        | value_length
---------------------------|-------------
supabase_service_role_key  | 219
supabase_url               | 40
```

**If you get 0 rows**, the RLS policy is still blocking access.

---

### Step 3: Verify Config Values Exist

Check that the values are actually in the table:

```sql
SELECT
  key,
  CASE
    WHEN key LIKE '%key%' THEN '[REDACTED ' || length(value) || ' chars]'
    ELSE value
  END as display_value,
  description
FROM app_config
ORDER BY key;
```

**Expected**: All 5 keys should have values (resend_api_key, supabase_url, supabase_service_role_key, frontend_url, admin_dashboard_url)

---

### Step 4: Test invite_client Function Directly

Call the function with test data:

```sql
-- Test invite_client RPC function
SELECT invite_client(
  p_email := 'test@example.com',
  p_company_id := (SELECT id FROM companies LIMIT 1),
  p_company_name := 'Test Company',
  p_hr_user_id := (SELECT id FROM hr_users LIMIT 1),
  p_full_name := 'Test User'
);
```

**If error persists**, the function still can't read config.

---

## Quick Fix Options

### Option 1: Apply Migration 026 (If Not Applied)

Copy/paste entire migration 026 into Supabase SQL Editor:
- File: `database/migrations/026_fix_email_and_config_rls.sql`

### Option 2: Manual RLS Policy Fix (Fastest)

If migration 026 was partially applied, just fix the RLS:

```sql
-- Drop old restrictive policy
DROP POLICY IF EXISTS "Block all other access" ON app_config;

-- Add new permissive read policy
CREATE POLICY "Authenticated can read config"
  ON app_config FOR SELECT
  TO authenticated
  USING (true);

-- Verify it worked
SET ROLE authenticated;
SELECT count(*) FROM app_config;  -- Should return 5
RESET ROLE;
```

### Option 3: Alternative - Bypass RLS for SECURITY DEFINER

If policies still don't work, modify the `invite_client` function to bypass RLS:

```sql
-- This is a workaround if RLS is too restrictive
CREATE OR REPLACE FUNCTION invite_client(
  p_email TEXT,
  p_company_id UUID,
  p_company_name TEXT,
  p_hr_user_id UUID,
  p_full_name TEXT
)
RETURNS jsonb AS $$
DECLARE
  auth_response net.http_response_result;
  redirect_url TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
  frontend_url TEXT;
  auth_user_id TEXT;
BEGIN
  -- Get configuration BYPASSING RLS (use current_setting as fallback)
  -- This works because SECURITY DEFINER functions run with elevated privileges
  BEGIN
    SELECT value INTO supabase_url FROM app_config WHERE key = 'supabase_url';
  EXCEPTION WHEN OTHERS THEN
    supabase_url := current_setting('app.supabase_url', true);
  END;

  BEGIN
    SELECT value INTO service_role_key FROM app_config WHERE key = 'supabase_service_role_key';
  EXCEPTION WHEN OTHERS THEN
    service_role_key := current_setting('app.supabase_service_role_key', true);
  END;

  BEGIN
    SELECT value INTO frontend_url FROM app_config WHERE key = 'frontend_url';
  EXCEPTION WHEN OTHERS THEN
    frontend_url := current_setting('app.frontend_url', true);
  END;

  -- Rest of function remains the same...

  redirect_url := frontend_url || '/client/dashboard';

  -- Validate required config
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Supabase configuration not set. Configure app.supabase_url and app.supabase_service_role_key.'
    );
  END IF;

  -- [Rest of function code continues...]
```

**But this is a workaround.** The proper fix is Option 1 or 2.

---

## Root Cause Summary

**Why is this happening?**

The `invite_client()` function is marked as `SECURITY DEFINER`, which means it **runs with elevated privileges**. However:

1. **RLS policies** in PostgreSQL are enforced at the **table level**, not the function level
2. Even with `SECURITY DEFINER`, the RLS policy **still checks the calling user's role**
3. When frontend calls `supabase.rpc('invite_client', ...)`, the calling user is **authenticated role**
4. If the RLS policy blocks `authenticated` from reading `app_config`, the SELECT returns NULL

**The Fix**: Migration 026 adds a policy allowing `authenticated` role to read (but not write) `app_config`.

---

## Recommended Action

**Run these queries in Supabase SQL Editor**:

```sql
-- 1. Check if migration 026 was applied
SELECT policyname FROM pg_policies WHERE tablename = 'app_config';

-- 2. If "Authenticated can read config" is missing, apply the fix:
DROP POLICY IF EXISTS "Block all other access" ON app_config;

CREATE POLICY "Authenticated can read config"
  ON app_config FOR SELECT
  TO authenticated
  USING (true);

-- 3. Verify it works
SET ROLE authenticated;
SELECT key, length(value) as len FROM app_config;
RESET ROLE;

-- 4. If Step 3 shows 5 rows, try creating client again from frontend
```

If this still doesn't work, we may need to switch to a different approach (PostgreSQL `current_setting()` or disabling RLS on `app_config` entirely).
