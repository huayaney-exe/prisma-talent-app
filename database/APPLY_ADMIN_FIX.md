# Apply Admin RLS Fix (Migration 017)

## Problem
The previous fix (migration 016) checked for `service_role` in JWT, but your admin users use the **anon key** with `authenticated` role. Admin users are identified by the `prisma_admins` table, not JWT role.

**Current Error**: 500 errors when querying companies table because RLS policy doesn't recognize admin users.

## Solution
Migration `017_fix_admin_rls_check.sql` correctly identifies admins by checking the `prisma_admins` table:

```sql
EXISTS (
  SELECT 1 FROM prisma_admins
  WHERE auth_user_id = auth.uid()
  AND is_active = true
)
```

## How to Apply

### Supabase Dashboard SQL Editor

1. **Go to**: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/sql

2. **Click**: "+ New query"

3. **Copy & Paste**:
   - Open `database/migrations/017_fix_admin_rls_check.sql`
   - Copy ALL content (200 lines)
   - Paste into SQL Editor

4. **Run**: Click "Run" or Cmd+Enter

5. **Verify Success**: Should see:
   ```
   ✅ RLS policies updated - admin check now uses prisma_admins table
   🔐 Admin users verified via: EXISTS(SELECT 1 FROM prisma_admins...)
   👥 Client tenant isolation maintained
   📊 Performance indexes created for fast RLS checks
   ```

## What This Does

### Replaces Service Role Check
❌ **Old (Wrong)**:
```sql
auth.jwt()->>'role' = 'service_role'  -- Only works with service_role key
```

✅ **New (Correct)**:
```sql
EXISTS (
  SELECT 1 FROM prisma_admins
  WHERE auth_user_id = auth.uid()
  AND is_active = true
)
```

### Adds Performance Indexes
```sql
-- Fast admin verification
CREATE INDEX idx_prisma_admins_auth_user_active ON prisma_admins(auth_user_id, is_active);

-- Fast company lookup
CREATE INDEX idx_companies_primary_contact_auth_id ON companies(primary_contact_auth_id);
```

## After Applying

Your admin user (`huayaney.exe@gmail.com`) will be able to:
- ✅ Query companies table
- ✅ Validate domain uniqueness
- ✅ Create new business clients
- ✅ Access all admin features

## Test Immediately After

1. **Refresh browser** at: http://localhost:3000/admin/clients/new

2. **Enter domain**: "test.com"

3. **Tab out** (trigger onBlur validation)

4. **Expected**:
   - No 500 errors
   - Either validation passes OR shows "Este dominio ya está registrado"
   - Console shows successful 200 response

5. **Fill form and submit** to create test client

## Verification Query

After applying, run this in SQL Editor to verify your admin access:

```sql
-- Check if you're recognized as admin
SELECT
  pa.id as admin_id,
  pa.role,
  pa.is_active,
  au.email
FROM prisma_admins pa
JOIN auth.users au ON au.id = pa.auth_user_id
WHERE au.email = 'huayaney.exe@gmail.com';
```

Should return your admin record.

## Rollback (If Needed)

If something goes wrong, re-apply migration 017:
```bash
# Just re-run the same migration
# It drops existing policies first, so it's idempotent
```
