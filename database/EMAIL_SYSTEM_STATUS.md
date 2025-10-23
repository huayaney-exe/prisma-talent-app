# Email System Implementation Status

## Current State: Partially Functional ⚠️

### ✅ What Works

1. **Position Creation Workflow** - Complete
   - Admin can create positions for any company
   - Position progresses: `hr_draft` → `hr_completed` → `leader_notified`
   - Job descriptions auto-generated from template
   - Database triggers fire correctly

2. **Email Record Creation** - Complete
   - Email records created in `email_communications` table
   - Template data populated correctly
   - Business leader email addresses captured

3. **Email Infrastructure** - Configured
   - Resend API key stored in Supabase vault
   - `send_email_via_resend()` function created
   - Database triggers configured

### ❌ What Doesn't Work

**Email Delivery** - `pg_net` background worker not processing HTTP requests

**Root Cause:** Supabase's `pg_net` extension requires a background worker to process async HTTP requests. This worker may not be enabled by default or may have configuration issues.

## Technical Details

### Problem Timeline

1. **Initial Issue:** `last_error` column didn't exist → Fixed with migration 032
2. **API Key Issue:** Permission denied setting database parameter → Fixed by using vault
3. **Function Update Issue:** `CREATE OR REPLACE` didn't take effect → Fixed by DROP + CREATE
4. **pg_net Response Issue:** Incorrect response structure handling → Fixed response parsing
5. **Current Issue:** HTTP requests timeout (background worker not processing queue)

### Attempted Solutions

| Iteration | Approach | Result |
|-----------|----------|--------|
| V1 | Synchronous `SELECT FROM net.http_post()` | Error: invalid enum value "4" |
| V2 | Extract status/content with type casting | Error: column "status" does not exist |
| V3 | Poll `net._http_response` table | Timeout after 30 seconds |
| V4 | Simplified async with optimistic update | Queued but never processed |

### Current Function

Location: `database/FIX_EMAIL_PGNET_V2.sql` (last attempted version)

The function correctly:
- Retrieves API key from vault ✅
- Builds email body from template ✅
- Queues HTTP request via `net.http_post()` ✅
- Returns request ID ✅

The function fails because:
- `pg_net` background worker doesn't process the queue ❌
- Requests stay in pending state indefinitely ❌

## Recommended Solutions

### Option 1: Supabase Edge Function (RECOMMENDED) ✅

Move email sending to a Supabase Edge Function (Deno runtime):

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { emailId } = await req.json()

  // Fetch email record from database
  // Call Resend API directly
  // Update database with result

  return new Response(JSON.stringify({ success: true }))
})
```

**Pros:**
- Runs in isolated Deno environment
- Direct HTTP calls to Resend (no pg_net needed)
- Can be invoked from database trigger
- Supabase manages scaling

**Cons:**
- Requires separate deployment
- Different codebase (TypeScript vs SQL)

### Option 2: Backend API Endpoint

Add email sending to the existing backend API:

```python
# backend/app/services/email_service.py
import resend

async def send_position_notification(position_id: str):
    # Fetch position and email data
    # Call Resend API
    # Update email_communications table
```

**Pros:**
- Centralized with existing backend code
- Easy to test and debug
- Can reuse existing auth/database logic

**Cons:**
- Requires backend to be running
- Need to trigger from database somehow

### Option 3: Enable pg_net Background Worker

Contact Supabase support to enable/configure `pg_net` background worker:

```sql
-- Check if pg_net worker is running
SELECT * FROM net._http_response LIMIT 5;

-- Check pg_net configuration
SHOW pg_net.batch_size;
SHOW pg_net.ttl;
```

**Pros:**
- Uses existing SQL function
- No additional infrastructure

**Cons:**
- Requires Supabase support intervention
- May not be available on all plans
- Less control over retry logic

### Option 4: Client-Side Email Trigger (Quick Fix)

Trigger email send from frontend after position creation:

```typescript
// After position creation succeeds
await fetch('/api/send-email', {
  method: 'POST',
  body: JSON.stringify({ positionId: position.id })
})
```

**Pros:**
- Quick to implement
- No server-side infrastructure changes

**Cons:**
- Less reliable (requires frontend to complete)
- No automatic retry
- Not truly automated

## Recommended Implementation Plan

**Phase 1: Immediate (Supabase Edge Function)**

1. Create `supabase/functions/send-position-email/index.ts`
2. Implement Resend API call
3. Deploy edge function
4. Update database trigger to invoke edge function
5. Test end-to-end flow

**Phase 2: Enhancement (Optional)**

1. Add retry logic to edge function
2. Implement webhook for Resend delivery status
3. Add email analytics/tracking
4. Create admin email dashboard

## Current Workaround

**For Testing:**

Emails can be manually sent using Resend dashboard:
1. Go to https://resend.com/emails
2. Use "Send Email" button
3. Use data from `email_communications` table

**Query to get email data:**
```sql
SELECT
  recipient_email,
  subject_line,
  template_data,
  email_type
FROM email_communications
WHERE position_id = '[position-id]'
ORDER BY created_at DESC
LIMIT 1;
```

## Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `032_add_last_error_column.sql` | Add missing column | ✅ Applied |
| `033_use_vault_for_resend_api_key.sql` | Use vault for API key | ✅ Applied |
| `FORCE_UPDATE_EMAIL_FUNCTION.sql` | Force function recreation | ✅ Applied |
| `FIX_EMAIL_FUNCTION_PGNET.sql` | First pg_net fix attempt | ⚠️ Didn't work |
| `FIX_EMAIL_PGNET_V2.sql` | Async polling approach | ⚠️ Timeout issue |
| `SIMPLIFIED_EMAIL_TRIGGER.sql` | Optimistic async version | ⚠️ Worker not processing |

## Next Steps

1. **Decision:** Choose between Edge Function (Option 1) or Backend API (Option 2)
2. **Implementation:** Build chosen solution
3. **Testing:** Verify emails actually deliver
4. **Deployment:** Deploy to production
5. **Monitoring:** Set up email delivery monitoring

## Summary

**Position creation workflow:** 100% functional ✅
**Job description generation:** 100% functional ✅
**Email delivery:** 0% functional (infrastructure issue) ❌

**Blockers:** pg_net background worker not configured/enabled in Supabase
**Solution:** Implement email sending via Supabase Edge Function or Backend API
