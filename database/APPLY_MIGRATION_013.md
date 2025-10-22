# How to Apply Email Worker Migration

## ⚠️ IMPORTANT: Two Different Migration Files

There are TWO separate migration files with different purposes:
1. **`supabase/migrations/013_client_auth_system.sql`** - Client authentication (already applied ✅)
2. **`database/migrations/013_email_worker_columns.sql`** - Email worker fix (**NEEDS TO BE APPLIED** ⚠️)

This guide is for applying the EMAIL WORKER migration.

## Problem
Backend email worker fails with error:
```
❌ Error processing pending emails: {'message': 'column email_communications.next_retry_at does not exist', 'code': '42703'}
```

## Solution
Apply the email worker migration from `database/migrations/013_email_worker_columns.sql` via Supabase Dashboard SQL Editor.

## Steps

### 1. Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa
2. Click "SQL Editor" in the left sidebar
3. Click "New query"

### 2. Copy and paste the following SQL

```sql
-- Migration: Add email worker columns to email_communications table
-- Date: 2025-10-10
-- Purpose: Support email worker with retry logic, status tracking, and template data

-- Add worker-required columns to email_communications
ALTER TABLE email_communications
  -- Resend integration
  ADD COLUMN IF NOT EXISTS resend_email_id TEXT,

  -- Retry logic
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP,

  -- Status tracking
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'opened', 'clicked',
    'bounced', 'complained', 'failed', 'retry_scheduled'
  )),
  ADD COLUMN IF NOT EXISTS error_message TEXT,

  -- Template data (JSONB for flexible template variables)
  ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}',

  -- Reply-to override
  ADD COLUMN IF NOT EXISTS reply_to_email TEXT;

-- Create index for worker queries (pending emails ready to send)
CREATE INDEX IF NOT EXISTS idx_email_communications_worker_pending
  ON email_communications (sent_at, retry_count, next_retry_at)
  WHERE sent_at IS NULL AND retry_count < 3;

-- Create index for failed emails (dead letter queue)
CREATE INDEX IF NOT EXISTS idx_email_communications_failed
  ON email_communications (status, failed_at)
  WHERE status = 'failed';

-- Create index for Resend webhook lookups
CREATE INDEX IF NOT EXISTS idx_email_communications_resend_id
  ON email_communications (resend_email_id)
  WHERE resend_email_id IS NOT NULL;

-- Update sent_at default to NULL (worker will set it after sending)
ALTER TABLE email_communications
  ALTER COLUMN sent_at DROP DEFAULT;

-- Add comment explaining worker behavior
COMMENT ON TABLE email_communications IS
  'Email communications tracking with worker-based delivery.
   Worker polls for sent_at IS NULL records and sends via Resend API.
   Implements exponential backoff retry (1min, 5min, 15min) with max 3 attempts.';

COMMENT ON COLUMN email_communications.status IS
  'Email delivery status:
   - pending: Waiting to be sent
   - sent: Successfully sent via Resend
   - delivered: Confirmed delivered to inbox
   - opened: Recipient opened email
   - clicked: Recipient clicked link
   - bounced: Email bounced
   - complained: Marked as spam
   - failed: Exceeded retry attempts (dead letter)
   - retry_scheduled: Failed but scheduled for retry';

COMMENT ON COLUMN email_communications.retry_count IS
  'Number of send attempts. Max 3 before moving to dead letter queue.';

COMMENT ON COLUMN email_communications.next_retry_at IS
  'Timestamp for next retry attempt. NULL means ready to send now.';

COMMENT ON COLUMN email_communications.template_data IS
  'JSONB data for template rendering. Structure depends on email_type.
   Example for leader_form_request:
   {"leader_name": "Carlos", "company_name": "TechCorp", "position_name": "Senior PM",
    "position_code": "SR-PM-001", "form_url": "https://..."}';
```

### 3. Run the query
1. Click "Run" button (or press Cmd/Ctrl + Enter)
2. Wait for success message
3. Verify output shows: "Success. No rows returned"

### 4. Verify migration
Backend should stop showing the `next_retry_at` error. Check backend logs:
```
✅ No more "column email_communications.next_retry_at does not exist" errors
```

## Alternative: Using psql CLI (if you have database password)
```bash
PGPASSWORD='YOUR_DB_PASSWORD' psql \
  -h db.vhjjibfblrkyfzcukqwa.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  -f migrations/013_email_worker_columns.sql
```

## Expected Result
- ✅ Email worker stops throwing errors
- ✅ Emails can be sent with retry logic
- ✅ Email status tracking enabled
- ✅ Resend integration fully functional
