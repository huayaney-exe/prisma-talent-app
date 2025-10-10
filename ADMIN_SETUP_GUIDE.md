# Admin Setup Guide
**Date**: 2025-10-09
**Admin Email**: admin@getprisma.io
**Password**: producto.2025

---

## Quick Setup Steps

### Method 1: Supabase Dashboard (Recommended - 2 minutes)

**Step 1: Create Auth User**
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa
2. Navigate to: **Authentication** → **Users**
3. Click **Add User** button
4. Fill in:
   ```
   Email: admin@getprisma.io
   Password: producto.2025
   Auto Confirm User: ✅ (Check this!)
   ```
5. Click **Create User**
6. **Copy the User ID** (UUID) that appears

**Step 2: Link to prisma_admins Table**
1. Navigate to: **SQL Editor** in Supabase Dashboard
2. Paste and run this SQL (replace the UUID):
   ```sql
   UPDATE prisma_admins
   SET auth_user_id = 'PASTE_USER_ID_HERE'
   WHERE email = 'admin@getprisma.io';
   ```

**Step 3: Verify Setup**
Run this to verify:
```sql
SELECT
  email,
  auth_user_id,
  role,
  is_active
FROM prisma_admins
WHERE email = 'admin@getprisma.io';
```

You should see:
- ✅ email: admin@getprisma.io
- ✅ auth_user_id: (UUID value present)
- ✅ role: super_admin
- ✅ is_active: true

---

### Method 2: Frontend Application (Alternative)

**Step 1: Start Frontend**
```bash
cd frontend
npm run dev
# Visit http://localhost:3000
```

**Step 2: Sign Up**
1. Go to Admin Login page: http://localhost:3000/admin/login
2. Click "Sign Up" (if available) or create account
3. Email: `admin@getprisma.io`
4. Password: `producto.2025`
5. Complete sign up flow

**Step 3: Link Account**
After signing up, get your auth user ID:
```sql
-- Find your auth user ID
SELECT id, email
FROM auth.users
WHERE email = 'admin@getprisma.io';

-- Copy the id value, then link it:
UPDATE prisma_admins
SET auth_user_id = 'YOUR_AUTH_USER_ID_HERE'
WHERE email = 'admin@getprisma.io';
```

---

### Method 3: Supabase CLI (Advanced)

⚠️ This method requires Supabase Management API access

```bash
# Create user via API (requires project service_role key)
curl -X POST 'https://vhjjibfblrkyfzcukqwa.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@getprisma.io",
    "password": "producto.2025",
    "email_confirm": true
  }'
```

---

## Testing Admin Login

### Test 1: Frontend Login
```bash
# Start frontend
cd frontend
npm run dev

# Visit login page
open http://localhost:3000/admin/login

# Login with:
# Email: admin@getprisma.io
# Password: producto.2025
```

**Expected Result**: ✅ Successfully logged in, redirected to admin dashboard

### Test 2: API Authentication
```bash
# Get auth token by logging in
# Token will be in response headers or localStorage

# Test authenticated endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/leads
```

**Expected Result**: ✅ Returns list of leads (or empty array if no leads)

### Test 3: Database Verification
```sql
-- Verify admin can access data
SELECT * FROM prisma_admins WHERE email = 'admin@getprisma.io';
SELECT * FROM leads LIMIT 5;
SELECT * FROM positions LIMIT 5;
```

**Expected Result**: ✅ All queries return data successfully

---

## Troubleshooting

### Issue: "Email not confirmed"
**Solution**:
1. Go to Supabase Dashboard → Authentication → Users
2. Find admin@getprisma.io
3. Click on user
4. Manually confirm email if needed

### Issue: "auth_user_id is null"
**Solution**: Run the link SQL:
```sql
UPDATE prisma_admins
SET auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@getprisma.io'
)
WHERE email = 'admin@getprisma.io';
```

### Issue: "Invalid login credentials"
**Solution**:
1. Verify password is exactly: `producto.2025`
2. Check email is: `admin@getprisma.io`
3. Reset password in Supabase Dashboard if needed

### Issue: "Access denied" after login
**Solution**: Verify RLS policies allow authenticated access:
```sql
-- Check admin record
SELECT * FROM prisma_admins WHERE email = 'admin@getprisma.io';

-- Should show:
-- is_active = true
-- role = 'super_admin'
-- auth_user_id = (some UUID)
```

---

## Security Notes

### Password Security
⚠️ **Current Password**: `producto.2025`
- This is a development password
- **Change in production** to something stronger
- Recommend: Use password manager for production

### Recommended Production Password
```
Example strong password:
- Min 16 characters
- Mix of upper/lower case
- Numbers and special characters
- Example: Pr1sm@T@l3nt2025!Secur3
```

### Change Password Later
```bash
# Via Supabase Dashboard:
# Authentication → Users → admin@getprisma.io → Reset Password

# Or via frontend (if forgot password implemented):
# Login page → Forgot Password → Reset via email
```

---

## Next Steps After Setup

1. ✅ **Login to Admin Dashboard**
   - Verify you can access all admin pages
   - Check leads, positions, applicants sections

2. ✅ **Test Lead Submission**
   - Go to landing page
   - Submit test lead
   - Verify appears in admin dashboard

3. ✅ **Create Test Position**
   - Use HR form to create position
   - Verify appears in position pipeline

4. ✅ **Test Complete Workflow**
   - Submit lead → Enroll client → Create position → Publish JD → Receive application

---

## Quick Reference

**Supabase Project**: vhjjibfblrkyfzcukqwa
**Region**: us-east-2
**Dashboard**: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa

**Admin Credentials**:
- Email: `admin@getprisma.io`
- Password: `producto.2025`
- Role: `super_admin`

**Database Table**: `prisma_admins`
**Auth Provider**: Supabase Auth
**Frontend Login**: `/admin/login`

---

**Setup Time**: ~5 minutes
**Status After Setup**: ✅ Ready for integration testing
