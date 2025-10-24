# Apply Migration 036: Remove Email Trigger (Architecture Fix)

## What This Does

This migration removes the incorrect database trigger-based email system and completes the transition to the correct Edge Function architecture.

## Why This Matters

**OLD (WRONG):**
```
Position Created → Database Trigger → pg_net → Edge Function → Email
❌ Unreliable (pg_net background worker issues)
❌ Security risk (service_role_key in database)
❌ No user feedback
❌ Inconsistent with invite-client pattern
```

**NEW (CORRECT):**
```
Position Created → Frontend calls Edge Function → Email
✅ Direct invocation (reliable)
✅ Secure (keys only in Edge Function environment)
✅ User feedback on success/failure
✅ Matches invite-client pattern exactly
```

## How to Apply

### Option 1: Supabase SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/sql
2. Click: **New Query**
3. Copy the entire contents of `database/migrations/036_remove_email_trigger.sql`
4. Paste into the editor
5. Click: **Run** (Ctrl+Enter / Cmd+Enter)

### Expected Output

```
✅ Trigger notify_leader_on_hr_completion removed successfully
✅ All old email functions removed successfully
📧 Email notifications now handled by Edge Function: send-position-email
🔧 Frontend calls Edge Function directly after position creation
✅ Architecture now consistent with invite-client pattern
```

## Verification

After applying the migration:

### 1. Verify Trigger Removed
```sql
SELECT * FROM pg_trigger WHERE tgname = 'notify_leader_on_hr_completion';
```
**Expected:** 0 rows (trigger no longer exists)

### 2. Verify Functions Removed
```sql
SELECT proname FROM pg_proc
WHERE proname IN (
  'trigger_send_position_email',
  'send_email_on_position_complete',
  'send_email_via_resend'
);
```
**Expected:** 0 rows (functions no longer exist)

### 3. Verify Edge Function Deployed
```bash
curl -i https://vhjjibfblrkyfzcukqwa.supabase.co/functions/v1/send-position-email \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```
**Expected:** HTTP 400 with error about missing fields (proves function exists and responds)

## Testing

### Test 1: Create Position (Should work without trigger)

1. Navigate to `/admin/clients` or login as HR user
2. Click: **Crear Posición** on any company
3. Fill out the complete HR form
4. Click: **Crear Posición**
5. **Expected:**
   - Position created successfully ✅
   - Console shows: "📧 Sending email notification via Edge Function"
   - Console shows: "✅ Email notification sent: Email sent successfully to [name]"
   - No database trigger errors
   - Email delivered via Resend

### Test 2: Verify Email Communication Created

Check that email record was created by Edge Function:

```sql
SELECT
  id,
  email_type,
  recipient_email,
  status,
  sent_at,
  resend_email_id,
  created_at
FROM email_communications
WHERE email_type = 'leader_form_request'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- New row with `status = 'sent'`
- `sent_at` timestamp populated
- `resend_email_id` populated
- `template_data` contains position and company info

### Test 3: Verify Email Delivered

1. Go to: https://resend.com/emails
2. Look for email to business leader
3. **Expected:** Email delivered successfully with correct content

## Troubleshooting

### Issue: Migration fails with "relation does not exist"

**Cause:** Trigger or function already removed

**Solution:** This is safe to ignore - the migration is idempotent

### Issue: Position created but no email sent

**Debugging Steps:**

1. Check browser console for errors:
```javascript
// Look for:
"[PositionService] 📧 Sending email notification via Edge Function"
"[PositionService] ✅ Email notification sent: ..."
// Or:
"[PositionService] ⚠️ Email notification failed: ..."
```

2. Check Edge Function logs:
   - Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/functions
   - Click: send-position-email
   - View: Logs tab
   - Look for errors or missing API key

3. Verify Resend API key exists:
```sql
SELECT name FROM vault.secrets WHERE name = 'resend_api_key';
```

4. Test Edge Function manually:
```bash
curl -X POST https://vhjjibfblrkyfzcukqwa.supabase.co/functions/v1/send-position-email \
  -H "Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "position_id": "your-position-id-here",
    "company_id": "your-company-id-here"
  }'
```

### Issue: "Position code already exists" error

**Cause:** Position code generation uses timestamp which could theoretically collide

**Solution:** Wait 1 second and retry. This is extremely rare.

## Rollback (Not Recommended)

If you absolutely must revert to the trigger approach (NOT RECOMMENDED due to pg_net issues):

```sql
-- This will restore the broken trigger approach
-- Only use if Edge Function approach fails completely

-- WARNING: You'll need to manually restore functions from migration 022
-- WARNING: This brings back all pg_net reliability issues
-- WARNING: This is NOT the correct architecture
```

**Better Option:** Debug the Edge Function issue instead of rolling back.

## Architecture Comparison

### invite-client (Existing, Correct)
```typescript
// Frontend: clientService.ts
const { data, error } = await supabase.functions.invoke('invite-client', {
  body: { email, company_id, company_name, hr_user_id, full_name }
})
```

### send-position-email (Now Correct)
```typescript
// Frontend: positionService.ts
const { data, error } = await supabase.functions.invoke('send-position-email', {
  body: { position_id, company_id }
})
```

**Both follow the exact same pattern!**

## Success Checklist

- [ ] Migration 036 executed without errors
- [ ] Trigger `notify_leader_on_hr_completion` removed
- [ ] Functions removed (trigger_send_position_email, etc.)
- [ ] Position creation works without trigger
- [ ] Email notification sent via Edge Function
- [ ] Email communication record created
- [ ] Email delivered via Resend
- [ ] Business leader receives notification

Once all checks pass, the architecture fix is complete!
