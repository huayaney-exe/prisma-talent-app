# Fix "Access Denied" Issue - URGENT

## Problem
You're successfully logged in with:
- **Email**: huayaney.exe@gmail.com
- **User ID**: e23845aa-e678-42b5-96f7-86bc3b3e80a7
- **Auth Status**: ✅ Authenticated

But getting "Access Denied" (No tienes permisos de administrador) because the `prisma_admins` table still has the default `admin@getprisma.io` email.

---

## Solution (2 minutes)

### Step 1: Open Supabase SQL Editor
**URL**: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/sql/new

### Step 2: Copy and Paste This SQL
```sql
-- Configure Luis Huayaney as Admin
UPDATE prisma_admins
SET
  email = 'huayaney.exe@gmail.com',
  full_name = 'Luis Eduardo Huayaney',
  auth_user_id = 'e23845aa-e678-42b5-96f7-86bc3b3e80a7',
  role = 'super_admin',
  is_active = true,
  updated_at = NOW()
WHERE email = 'admin@getprisma.io';

-- Verify it worked
SELECT
  email,
  full_name,
  auth_user_id,
  role,
  is_active
FROM prisma_admins
WHERE email = 'huayaney.exe@gmail.com';
```

### Step 3: Click "Run"

**Expected Result**:
```
UPDATE 1

email: huayaney.exe@gmail.com
full_name: Luis Eduardo Huayaney
auth_user_id: e23845aa-e678-42b5-96f7-86bc3b3e80a7
role: super_admin
is_active: true
```

### Step 4: Refresh Your Browser
Go back to the admin page and refresh (Cmd+R or F5)

✅ **You should now have access!**

---

## Why This Fixes It

The frontend checks if you're an admin by querying:
```typescript
SELECT * FROM prisma_admins
WHERE auth_user_id = 'your-auth-user-id'
AND is_active = true
```

Currently, the `prisma_admins` table has:
- ❌ email: admin@getprisma.io
- ❌ auth_user_id: NULL

After running the SQL:
- ✅ email: huayaney.exe@gmail.com
- ✅ auth_user_id: e23845aa-e678-42b5-96f7-86bc3b3e80a7

This links your Supabase Auth account to the admin role.

---

## Alternative: If SQL Editor Doesn't Work

Use the Table Editor:

1. Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/editor
2. Select table: `prisma_admins`
3. Click on the row with `admin@getprisma.io`
4. Edit these fields:
   - email: `huayaney.exe@gmail.com`
   - full_name: `Luis Eduardo Huayaney`
   - auth_user_id: `e23845aa-e678-42b5-96f7-86bc3b3e80a7`
5. Click "Save"
6. Refresh your browser

---

## Verify It's Working

After running the SQL, test with this query:
```sql
-- Should return TRUE
SELECT EXISTS (
  SELECT 1 FROM prisma_admins
  WHERE auth_user_id = 'e23845aa-e678-42b5-96f7-86bc3b3e80a7'
  AND is_active = TRUE
) as is_admin;
```

If it returns `is_admin: true`, you're all set! 🎉

---

## Troubleshooting

### Still getting "Access Denied" after SQL?

**Option 1**: Clear browser cache and cookies
- Chrome: Cmd+Shift+Delete → Clear browsing data
- Refresh page

**Option 2**: Log out and log back in
- Clear localStorage: `localStorage.clear()` in browser console
- Go to login page
- Login again with huayaney.exe@gmail.com

**Option 3**: Check if the update actually worked
```sql
SELECT * FROM prisma_admins;
-- Should show your email, not admin@getprisma.io
```

---

**Next**: Once you have access, you can start testing:
- Lead management
- Position pipeline
- Applicant review
- Job description editor
