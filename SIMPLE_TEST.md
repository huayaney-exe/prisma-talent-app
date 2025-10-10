# Simple Admin Test

## 🎯 One Command to Test Everything

Open http://localhost:3000/admin/login, press F12, paste this in console:

```javascript
(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('prisma_admins')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  console.log('User:', user?.email);
  console.log('Admin data:', data);
  console.log('Error:', error);
  console.log('Has admin access:', !!data && !error);
})()
```

## What to look for:

**✅ SUCCESS**:
```
Admin data: { id: "...", email: "huayaney.exe@gmail.com", role: "super_admin" }
Error: null
Has admin access: true
```
→ If you see this but still get "Acceso Denegado", do hard reload (Cmd+Shift+R)

**❌ FAILURE**:
```
Error: { code: "PGRST116", message: "..." }
```
→ RLS policy is blocking. Need to fix in Supabase SQL Editor.

**❌ NO RECORD**:
```
Admin data: null
Error: null
```
→ Admin record doesn't exist. Need to run `database/configure_your_admin.sql`

---

## Quick Fix if RLS is blocking:

Go to https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/editor

Run this SQL:

```sql
DROP POLICY IF EXISTS "prisma_admins_select" ON prisma_admins;

CREATE POLICY "prisma_admins_select" ON prisma_admins
  FOR SELECT TO authenticated
  USING (is_active = TRUE);
```

Then test again.
