# Quick Admin Login Test

## ✅ Frontend Running
**Status**: Server started successfully
**URL**: http://localhost:3000/

---

## 🧪 Test Steps

### 1. Open Browser
```
Navigate to: http://localhost:3000/admin/login
```

### 2. Clear Cache (Important!)
**Option A - Browser Console**:
1. Press F12 (or Cmd+Option+I on Mac)
2. Go to Console tab
3. Run these commands:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

**Option B - Hard Reload**:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### 3. Login
**Credentials**:
- Email: `huayaney.exe@gmail.com`
- Password: Your Supabase password

### 4. Expected Result
✅ **SUCCESS**: Admin dashboard loads
❌ **FAIL**: "Acceso Denegado" message

---

## 🔍 Debug If Fails

### Check Browser Console
Look for errors when page loads:
```
✅ Good: No red error messages
❌ Bad: "Error checking admin status" or "Error querying prisma_admins"
```

### Test Database Query Directly
In browser console after login:
```javascript
const { data, error } = await supabase
  .from('prisma_admins')
  .select('*')
  .eq('auth_user_id', 'e23845aa-e678-42b5-96f7-86bc3b3e80a7')

console.log('Admin record:', data, error)
```

Should return your admin record, NOT an error.

---

## 📊 What to Test After Login

### Dashboard Pages
- [ ] `/admin/dashboard` - Overview page
- [ ] `/admin/leads` - Lead management
- [ ] `/admin/positions` - Position pipeline
- [ ] `/admin/applicants` - Candidate review
- [ ] `/admin/job-descriptions` - JD editor
- [ ] `/admin/shortlist` - Shortlist generator

### Quick Feature Test
1. Go to `/admin/leads`
2. Click "Create Test Lead" (if button exists)
3. Verify you can see and interact with the page

---

## 🐛 Common Issues

### Issue: Still "Acceso Denegado"
**Cause**: Browser cache not cleared
**Fix**: Force reload (Cmd+Shift+R) or clear localStorage

### Issue: RLS Error in Console
**Cause**: Database policy blocking query
**Fix**: Run this SQL in Supabase:
```sql
DROP POLICY IF EXISTS "prisma_admins_select" ON prisma_admins;

CREATE POLICY "prisma_admins_select" ON prisma_admins
  FOR SELECT TO authenticated
  USING (is_active = TRUE);
```

### Issue: "User not found" Error
**Cause**: Admin record not linked to auth_user_id
**Fix**: Run the SQL from `database/configure_your_admin.sql`

---

## ✅ Success Indicators

1. **No Access Denied**: Dashboard loads without error
2. **Navigation Visible**: Menu shows all admin pages
3. **No Console Errors**: DevTools console is clean
4. **Network Request Success**: See 200 OK for prisma_admins query

---

## 📝 Next Steps After Success

1. **Test Lead Creation**: Try the public lead form at `/`
2. **Test Admin Features**: Navigate through all admin pages
3. **Configure Email Service**: Set up Resend API for notifications
4. **Deploy to Production**: Follow DEPLOYMENT_CHECKLIST.md

---

## 🔗 Full Documentation

- [ADMIN_LOGIN_VERIFICATION.md](./ADMIN_LOGIN_VERIFICATION.md) - Complete guide
- [FIXED_ADMIN_ACCESS.md](./FIXED_ADMIN_ACCESS.md) - What was fixed
- [DATABASE_MIGRATION_COMPLETE.md](./DATABASE_MIGRATION_COMPLETE.md) - Migration status
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Production deployment

---

**Your Admin Credentials**:
- Email: `huayaney.exe@gmail.com`
- Role: `super_admin`
- Auth UID: `e23845aa-e678-42b5-96f7-86bc3b3e80a7`

**Login URL**: http://localhost:3000/admin/login

**Server Status**: ✅ Running on http://localhost:3000/
