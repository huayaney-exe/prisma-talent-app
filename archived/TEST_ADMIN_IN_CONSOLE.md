# Test Admin Status in Browser Console

## 🧪 Quick Debug Test

Since you're successfully authenticated, let's verify the admin check is working.

---

## Step 1: Open Browser Console

1. Open http://localhost:3000/admin/login (or any admin page)
2. Press **F12** (or Cmd+Option+I on Mac)
3. Go to **Console** tab

---

## Step 2: Test Admin Query

Copy and paste this into the browser console:

```javascript
// Test 1: Check if we have a user session
console.log('🔍 Current user:', await supabase.auth.getUser())

// Test 2: Query prisma_admins table
const { data, error } = await supabase
  .from('prisma_admins')
  .select('id, email, full_name, auth_user_id, role, is_active')
  .eq('auth_user_id', 'e23845aa-e678-42b5-96f7-86bc3b3e80a7')
  .eq('is_active', true)
  .single()

console.log('✅ Admin query result:', data)
console.log('❌ Admin query error:', error)
```

---

## Expected Results

### ✅ SUCCESS - Should see:
```json
✅ Admin query result: {
  "id": "some-uuid",
  "email": "huayaney.exe@gmail.com",
  "full_name": "Luis Eduardo Huayaney",
  "auth_user_id": "e23845aa-e678-42b5-96f7-86bc3b3e80a7",
  "role": "super_admin",
  "is_active": true
}
❌ Admin query error: null
```

### ❌ FAILURE - Common Errors:

**Error: "PGRST116" or "permission denied"**
```
This means RLS policy is blocking the query.
FIX: Run the SQL below in Supabase SQL Editor
```

**Error: "0 rows" or data is null**
```
This means the admin record doesn't exist or isn't linked.
FIX: Run database/configure_your_admin.sql
```

**Error: "relation 'prisma_admins' does not exist"**
```
This means migration 005 wasn't applied.
FIX: Run supabase db push
```

---

## Step 3: If Query Fails - Fix RLS Policy

If you get a permission error, run this in **Supabase SQL Editor** (https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/editor):

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "prisma_admins_select" ON prisma_admins;

-- Create permissive policy for authenticated users
CREATE POLICY "prisma_admins_select" ON prisma_admins
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Verify policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'prisma_admins';
```

---

## Step 4: Test Again After Fix

After running the SQL fix, **refresh the browser** (Cmd+R) and run the console test again.

---

## Step 5: Verify AuthContext is Using the Query

Check that the AuthContext.tsx changes are loaded:

```javascript
// In browser console, check the current auth context
const authContext = window.__REACT_DEVTOOLS_GLOBAL_HOOK__

// Or simply check the network tab:
// 1. Open DevTools → Network tab
// 2. Filter by "prisma_admins"
// 3. Refresh page
// 4. Should see a GET request to prisma_admins with status 200
```

---

## 📊 Network Tab Check

1. Open DevTools → **Network** tab
2. Refresh the page
3. Filter by `prisma_admins`
4. Look for request like:

```
Request URL: https://vhjjibfblrkyfzcukqwa.supabase.co/rest/v1/prisma_admins?auth_user_id=eq.e23845aa-...&is_active=is.true

Status: 200 OK (✅ success)
Status: 401 Unauthorized (❌ RLS blocking)
Status: 404 Not Found (❌ table doesn't exist)
```

---

## 🐛 Still Not Working?

### Option A: Verify Database Record Exists

Run this in **Supabase SQL Editor**:

```sql
SELECT * FROM prisma_admins
WHERE email = 'huayaney.exe@gmail.com';
```

**Expected**: Should return 1 row with your email and auth_user_id

**If empty**: Run `database/configure_your_admin.sql` again

---

### Option B: Check Frontend Code Was Reloaded

The fix in `AuthContext.tsx` needs to be loaded. Verify:

1. Stop the dev server (Ctrl+C in terminal)
2. Restart: `npm run dev`
3. Hard reload browser (Cmd+Shift+R)
4. Clear cache: `localStorage.clear()` in console

---

### Option C: Manual Admin Check Override (Temporary Debug)

If nothing works, temporarily test with a manual override:

```javascript
// In browser console - TEMPORARY DEBUG ONLY
localStorage.setItem('debug_force_admin', 'true')
location.reload()
```

Then check `AuthContext.tsx` to see what error is showing in console.

---

## ✅ What Success Looks Like

### In Console:
```
✅ Admin query result: { id: '...', role: 'super_admin', is_active: true }
```

### In Network Tab:
```
GET prisma_admins → Status: 200 OK
Response: [{ "id": "...", "role": "super_admin" }]
```

### In Browser:
```
- No "Acceso Denegado" message
- Admin dashboard loads
- Navigation menu visible
```

---

## 📝 Report Back

After running the console test, tell me:

1. **What did the query return?** (copy the console output)
2. **Was there an error?** (error code and message)
3. **What's in Network tab?** (status code for prisma_admins request)

Then I can help fix the specific issue!

---

## 🔗 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa
- **SQL Editor**: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/editor
- **Auth Users**: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/auth/users

**Your Auth UID**: `e23845aa-e678-42b5-96f7-86bc3b3e80a7`
