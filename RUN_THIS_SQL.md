# Run This SQL in Supabase Dashboard

## Steps:

1. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/sql/new

2. **Copy and paste this SQL**:

```sql
-- Configure Luis Huayaney as Admin User
UPDATE prisma_admins
SET
  email = 'huayaney.exe@gmail.com',
  full_name = 'Luis Eduardo Huayaney',
  auth_user_id = 'e23845aa-e678-42b5-96f7-86bc3b3e80a7',
  role = 'super_admin',
  is_active = true,
  updated_at = NOW()
WHERE email = 'admin@getprisma.io';

-- Verify the update
SELECT
  email,
  full_name,
  auth_user_id,
  role,
  is_active,
  permissions
FROM prisma_admins
WHERE email = 'huayaney.exe@gmail.com';
```

3. **Click "Run"**

4. **Expected Result**:
```
email: huayaney.exe@gmail.com
full_name: Luis Eduardo Huayaney
auth_user_id: e23845aa-e678-42b5-96f7-86bc3b3e80a7
role: super_admin
is_active: true
permissions: {
  "can_enroll_clients": true,
  "can_publish_positions": true,
  "can_qualify_candidates": true,
  "can_manage_admins": true
}
```

## After Running SQL:

✅ You are now configured as the admin user!

**Test your admin access**:
- Visit: http://localhost:3000/admin/login
- Login with your existing credentials for huayaney.exe@gmail.com
- You should be able to access the admin dashboard

---

**Your Admin Credentials**:
- Email: huayaney.exe@gmail.com
- Password: (your existing Supabase password)
- Role: super_admin
- Auth User ID: e23845aa-e678-42b5-96f7-86bc3b3e80a7
