# Apply Migration 030 - Make positions.created_by Nullable

**Migration File**: `migrations/030_make_positions_created_by_nullable.sql`
**Purpose**: Allow public HR form submissions without authentication

## Instructions

### Option 1: Supabase Dashboard SQL Editor (RECOMMENDED)

1. Go to: https://vhjjibfblrkyfzcukqwa.supabase.co/project/vhjjibfblrkyfzcukqwa/sql
2. Click "New Query"
3. Copy and paste the SQL below
4. Click "Run" or press `Cmd+Enter`

```sql
-- Migration 030: Make positions.created_by nullable for public HR form submissions
-- Date: 2025-10-22
-- Purpose: Allow public (non-authenticated) users to submit HR forms
--          while maintaining audit trail for authenticated client users

-- Make created_by nullable
ALTER TABLE positions
  ALTER COLUMN created_by DROP NOT NULL;

-- Update constraint to handle NULL gracefully
ALTER TABLE positions
  DROP CONSTRAINT IF EXISTS positions_created_by_fkey,
  ADD CONSTRAINT positions_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES hr_users(id)
    ON DELETE SET NULL;

-- Add helpful comment
COMMENT ON COLUMN positions.created_by IS
  'HR user who created this position. NULL for public form submissions (before client auth is set up). Will be populated for authenticated client users creating positions from their dashboard.';

-- Verify change
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'positions' AND column_name = 'created_by';
```

### Expected Output

Should show:
```
column_name  | is_nullable | data_type
-------------+-------------+-----------
created_by   | YES         | uuid
```

### Option 2: psql Command Line

If you have direct database access:

```bash
psql "postgresql://postgres.vhjjibfblrkyfzcukqwa:Vigorelli23$@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  -f database/migrations/030_make_positions_created_by_nullable.sql
```

## Verification

After running, verify the change:

```sql
SELECT
  column_name,
  is_nullable,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_name = 'positions' AND column_name = 'created_by';
```

Should return:
- `is_nullable`: YES
- `data_type`: uuid

## What This Enables

✅ **Authenticated clients** can create positions → `created_by = hr_user.id`
✅ **Public HR forms** can create positions → `created_by = NULL`
✅ **Audit trail** maintained for authenticated users
✅ **No breaking changes** to existing data

## Related Code Changes

- ✅ `frontend/src/services/positionService.ts` - Smart detection logic implemented
- ✅ Migration file created in `database/migrations/030_*`
