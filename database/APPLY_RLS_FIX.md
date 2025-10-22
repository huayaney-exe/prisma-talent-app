# URGENT: Apply RLS Infinite Recursion Fix

## Problem
The application is experiencing **infinite recursion in RLS (Row Level Security) policies** that blocks all database queries:

```
Error: infinite recursion detected in policy for relation "hr_users"
```

**Root Cause**: Circular reference in RLS policies:
- `companies` policy queries `hr_users` table
- `hr_users` policy queries `hr_users` table again → infinite loop
- Admin users have no `hr_users` record, causing all admin queries to fail

## Solution
Migration `016_fix_rls_infinite_recursion.sql` fixes this by:
1. Dropping problematic circular policies
2. Adding admin bypass (service_role can access everything)
3. Maintaining tenant isolation for client users

## How to Apply (Choose One Method)

### Method 1: Supabase Dashboard SQL Editor (Recommended)

1. **Go to Supabase Dashboard**:
   - URL: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa
   - Navigate to: **SQL Editor**

2. **Create New Query**:
   - Click "+ New query"

3. **Copy Migration SQL**:
   - Open: `database/migrations/016_fix_rls_infinite_recursion.sql`
   - Copy ALL content (153 lines)
   - Paste into SQL Editor

4. **Run Migration**:
   - Click "Run" or press Cmd+Enter
   - Wait for success message
   - Should see: "✅ RLS policies updated - infinite recursion fixed"

5. **Verify Fix**:
   - Refresh your app at http://localhost:3000/admin/clients/new
   - Domain validation should work without errors

### Method 2: Supabase CLI (If installed)

```bash
cd database
supabase db push --linked
```

### Method 3: psql Command Line (If PostgreSQL client installed)

```bash
cd database
psql "postgresql://postgres.vhjjibfblrkyfzcukqwa:HLe35uRDB2024@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f migrations/016_fix_rls_infinite_recursion.sql
```

## What This Migration Does

### Drops Problematic Policies
```sql
DROP POLICY IF EXISTS "company_access" ON companies;
DROP POLICY IF EXISTS "tenant_isolation" ON hr_users;
-- ... (all circular policies)
```

### Creates Admin Bypass Policies
```sql
CREATE POLICY "admin_full_access_companies" ON companies
  FOR ALL TO authenticated
  USING (
    -- Prisma admins (service_role) can access everything
    auth.jwt()->>'role' = 'service_role'
    OR
    -- Clients can only access their own company
    id IN (SELECT company_id FROM hr_users WHERE id = auth.uid())
  );
```

### Key Changes
- ✅ **Admin Access**: Users with `service_role` can access all data
- ✅ **Tenant Isolation**: Client users still restricted to their company
- ✅ **No Circular Reference**: Policies don't query themselves
- ✅ **Public Access**: Job seekers can still view/apply to positions

## Important Notes

### Frontend Authentication
After applying this migration, ensure your frontend uses the correct Supabase keys:

**For Admin Operations** (clientService.ts):
```typescript
// Use service role key for admin operations
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // ← This bypasses RLS
)
```

**For Client Operations** (regular app):
```typescript
// Use anon key for client operations
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY  // ← This enforces RLS
)
```

### Environment Variables
Make sure these are set in `frontend/.env.local`:
```bash
VITE_SUPABASE_URL=https://vhjjibfblrkyfzcukqwa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Verification Steps

After applying migration:

1. **Test Domain Validation**:
   - Go to: http://localhost:3000/admin/clients/new
   - Enter domain: "test.com"
   - Tab out of field (onBlur)
   - Should show validation result (no 500 error)

2. **Test Client Creation**:
   - Fill complete form
   - Submit
   - Should create company without RLS errors

3. **Test Client Access**:
   - Login as a client user
   - Should only see their company's data
   - Should NOT see other companies

4. **Check Browser Console**:
   - Should see no more RLS errors
   - No "infinite recursion" messages

## Rollback (If Needed)

If something goes wrong, you can rollback by re-applying the original RLS policies:

```bash
cd database
# Re-apply original policies
psql $DATABASE_URL -f migrations/002_rls_policies.sql
```

## Migration Status

- [x] Migration created: `016_fix_rls_infinite_recursion.sql`
- [ ] Migration applied to database
- [ ] Tested domain validation works
- [ ] Tested client creation works
- [ ] Verified tenant isolation maintained

## Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify RLS policies in Table Editor → Select table → RLS tab
3. Test with service_role key directly in SQL editor
