# Apply Migration 034: Switch to Edge Function for Email Sending

## Problem Summary

**Previous Approach:** Migration 022 used pg_net with PostgreSQL function
**Issue:** pg_net background worker not processing HTTP requests, emails never sent
**Correct Approach:** Use Supabase Edge Functions (following invite-client pattern)

## Solution: Edge Function Architecture

### What Changed
1. ✅ Deployed `send-position-email` Edge Function (already done)
2. 🔄 Update database trigger to call Edge Function instead of pg_net function
3. 🔧 Set required database parameters for Edge Function invocation

## Step 1: Set Database Parameters

These parameters allow the trigger to call the Edge Function securely.

### Option 1: Supabase SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/sql
2. Click: **New Query**
3. Run this SQL:

```sql
-- Set Supabase URL for Edge Function calls
ALTER DATABASE postgres
SET app.supabase_url = 'https://vhjjibfblrkyfzcukqwa.supabase.co';

-- Set service role key for authenticated Edge Function calls
-- Replace <YOUR_SERVICE_ROLE_KEY> with actual key from Settings > API
ALTER DATABASE postgres
SET app.supabase_service_role_key = '<YOUR_SERVICE_ROLE_KEY>';
```

4. Get your service role key from: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/settings/api
   - Look for: **service_role** key (NOT anon key)
   - Copy the secret key

5. Replace `<YOUR_SERVICE_ROLE_KEY>` in the SQL above and run

### Verify Parameters Set
```sql
-- Verify parameters are set correctly
SELECT name, setting
FROM pg_settings
WHERE name LIKE 'app.%';
```

Expected output:
```
           name                  |                    setting
---------------------------------+------------------------------------------------
 app.supabase_service_role_key  | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 app.supabase_url               | https://vhjjibfblrkyfzcukqwa.supabase.co
```

## Step 2: Apply Migration 034

### Option 1: Supabase SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/sql
2. Click: **New Query**
3. Copy and paste the entire contents of `database/migrations/034_use_edge_function_for_emails.sql`
4. Click: **Run** (Ctrl+Enter / Cmd+Enter)
5. Verify success message appears: ✅ Trigger notify_leader_on_hr_completion created successfully

### Option 2: Direct psql Connection

```bash
psql "postgresql://postgres.[project-ref]:[password]@[host]:5432/postgres" \
  -f database/migrations/034_use_edge_function_for_emails.sql
```

## Step 3: Verify Edge Function Deployment

Check that the Edge Function is deployed and accessible:

```bash
# Check Edge Function deployment status
curl -i https://vhjjibfblrkyfzcukqwa.supabase.co/functions/v1/send-position-email \
  -H "Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email_id": "test"}'
```

Expected response: HTTP 400 or 404 (function exists but rejects invalid email_id)
NOT Expected: Connection refused, timeout, or 502 (would indicate deployment issue)

## Testing After Migration

### Test 1: Create Position as Admin

1. Go to: `/admin/clients`
2. Click: **Crear Posición** on any company
3. Fill out the complete form
4. Click: **Crear Posición**
5. **Expected:** Success! Position created, no errors

### Test 2: Verify Email Communication Created

Check email_communications table:

```sql
SELECT
  id,
  email_type,
  recipient_email,
  status,
  sent_at,
  last_error,
  created_at
FROM email_communications
WHERE email_type = 'leader_form_request'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- New row with `email_type = 'leader_form_request'`
- `status = 'pending'` initially, then updated to `'sent'` within seconds
- `sent_at` timestamp populated
- `resend_email_id` populated (from Resend API response)
- `last_error` should be NULL

### Test 3: Verify Email Sent via Resend

1. Go to: https://resend.com/emails
2. Look for email to business leader
3. **Expected:** Email delivered successfully

### Test 4: Check pg_net Requests (Optional Debugging)

```sql
-- Check if Edge Function was called successfully
SELECT
  id,
  created,
  method,
  url,
  status_code,
  content
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
```

**Expected:**
- `method = 'POST'`
- `url` contains `/functions/v1/send-position-email`
- `status_code = 200`

## Troubleshooting

### Issue: "permission denied to set parameter"

**Solution:** You need superuser/admin access. Use Supabase SQL Editor which has appropriate permissions.

### Issue: Edge Function returns 401 Unauthorized

**Cause:** `app.supabase_service_role_key` not set or incorrect

**Solution:**
1. Verify service role key from: Settings > API
2. Re-run database parameter setup with correct key

### Issue: Edge Function times out

**Cause:** Resend API key not in vault or invalid

**Solution:**
```sql
-- Verify vault secret exists
SELECT name, description
FROM vault.secrets
WHERE name = 'resend_api_key';

-- If missing, create it
SELECT vault.create_secret(
  're_MJrfYpFi_5BTo4wyogiZsUSr28u75jWRa',
  'resend_api_key'
);
```

### Issue: Email record created but never sent

**Debugging Steps:**

1. Check Edge Function logs:
   - Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/functions
   - Click: send-position-email
   - View: Logs tab

2. Check email_communications for error details:
```sql
SELECT id, status, last_error, retry_count
FROM email_communications
WHERE status IN ('pending', 'failed')
ORDER BY created_at DESC;
```

## Architecture Benefits

### Why Edge Functions > pg_net

| Aspect | Edge Function | pg_net Function |
|--------|--------------|----------------|
| **Reliability** | ✅ Immediate execution | ❌ Depends on background worker |
| **Debugging** | ✅ Supabase Dashboard logs | ❌ PostgreSQL logs only |
| **Performance** | ✅ Deno runtime, optimized | ⚠️ PostgreSQL overhead |
| **Pattern** | ✅ Matches invite-client | ❌ Different architecture |
| **Monitoring** | ✅ Built-in observability | ❌ Manual setup needed |

### Existing Pattern Alignment

This migration aligns with the existing `invite-client` Edge Function:

```
✅ invite-client/index.ts → Sends client invitation emails
✅ send-position-email/index.ts → Sends position notification emails

Both follow same pattern:
1. Accept parameters via POST body
2. Use Supabase admin client
3. Retrieve secrets from vault
4. Call external API (Resend)
5. Update database with results
```

## Rollback (If Needed)

If you need to revert to the pg_net approach:

```sql
-- Restore old trigger
DROP TRIGGER IF EXISTS notify_leader_on_hr_completion ON positions;

CREATE TRIGGER notify_leader_on_hr_completion
  AFTER UPDATE OF workflow_stage ON positions
  FOR EACH ROW
  WHEN (OLD.workflow_stage = 'hr_draft' AND NEW.workflow_stage = 'hr_completed')
  EXECUTE FUNCTION send_email_on_position_complete();

-- Note: send_email_on_position_complete() function from migration 022
```

⚠️ **Warning:** Rollback will restore pg_net issues (emails won't send)!

## Verification Checklist

- [ ] Database parameters set (`app.supabase_url`, `app.supabase_service_role_key`)
- [ ] Migration 034 executed successfully
- [ ] Trigger `notify_leader_on_hr_completion` exists
- [ ] Edge Function deployed and accessible
- [ ] Resend API key in vault (`resend_api_key`)
- [ ] Position creation works without errors
- [ ] Email communication record created
- [ ] Email sent successfully via Resend
- [ ] Business leader receives email notification

## After Verification

Once verified working:

```bash
git add database/migrations/034_use_edge_function_for_emails.sql
git add database/APPLY_MIGRATION_034.md
git add supabase/functions/send-position-email/index.ts
git commit -m "feat: Switch email system to Edge Functions for reliability

- Deploy send-position-email Edge Function
- Update trigger to call Edge Function instead of pg_net
- Align with existing invite-client pattern
- Fix email delivery issues from pg_net background worker

Fixes email notification system for position workflow."
git push
```
