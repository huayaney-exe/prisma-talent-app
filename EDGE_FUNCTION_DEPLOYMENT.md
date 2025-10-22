# Edge Function Deployment Guide

**Function**: `invite-client`
**Purpose**: Send magic link invitations to new clients using Supabase Auth
**Status**: ⚠️ Needs deployment to Supabase

---

## 🚨 Current Issue

The `invite-client` Edge Function exists locally but returns **404 in production**, indicating it has not been deployed to Supabase.

**Error Evidence**:
```
POST https://vhjjibfblrkyfzcukqwa.supabase.co/functions/v1/invite-client
→ 404 (Not Found)
```

---

## 📋 Prerequisites

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### 3. Link to Your Project

```bash
cd supabase
supabase link --project-ref vhjjibfblrkyfzcukqwa
```

**Project Details**:
- Project ID: `vhjjibfblrkyfzcukqwa`
- Project URL: `https://vhjjibfblrkyfzcukqwa.supabase.co`

---

## 🚀 Deploy Edge Function

### Step 1: Navigate to Functions Directory

```bash
cd /Users/luishuayaney/Projects/prisma-ecosystem/03-personal-professional-tools/talent-platform/supabase
```

### Step 2: Deploy the Function

```bash
supabase functions deploy invite-client
```

**Expected Output**:
```
Deploying Function invite-client...
✓ Function invite-client deployed successfully
Function URL: https://vhjjibfblrkyfzcukqwa.supabase.co/functions/v1/invite-client
```

### Step 3: Set Environment Variables

The Edge Function requires these environment variables (automatically available):
- `SUPABASE_URL` - Auto-set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-set by Supabase

**Optional**: Set custom `FRONTEND_URL` for redirect:

```bash
supabase secrets set FRONTEND_URL=https://prismatalent.vercel.app
```

---

## ✅ Verify Deployment

### Check Function Status

```bash
# List all deployed functions
supabase functions list

# Should show:
# NAME            VERSION  STATUS   CREATED AT
# invite-client   1        ACTIVE   2025-10-22...
```

### Test Function Manually

```bash
curl -X POST https://vhjjibfblrkyfzcukqwa.supabase.co/functions/v1/invite-client \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "company_id": "test-uuid",
    "company_name": "Test Company",
    "hr_user_id": "test-hr-uuid",
    "full_name": "Test User"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "auth_user_id": "some-uuid",
  "message": "Invitation sent successfully to test@example.com"
}
```

---

## 🔍 Troubleshooting

### Issue: Function not found after deployment

**Solution**: Wait 30-60 seconds for deployment to propagate, then test again.

### Issue: CORS errors still occurring

**Solution**: Verify CORS headers in Edge Function match frontend requests:
- Edge Function allows: `authorization, x-client-info, apikey, content-type`
- Frontend sends: Only allowed headers (no custom headers after fix)

### Issue: Service role key missing

**Solution**: Supabase automatically provides this in Edge Function environment. If missing:
1. Go to: Supabase Dashboard → Settings → API
2. Copy Service Role Key
3. Set secret: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key`

### Issue: Email not sending

**Solution**:
1. Check Supabase Dashboard → Auth → Email Templates
2. Verify email provider is configured
3. Check email_communications table for tracking records

---

## 📊 Function Details

### Location
```
supabase/functions/invite-client/index.ts
```

### Functionality
1. Receives client invitation request from frontend
2. Uses service_role_key for admin auth operations
3. Calls `supabaseAdmin.auth.admin.inviteUserByEmail()`
4. Sends magic link to client email
5. Updates company with auth_user_id
6. Tracks email in email_communications table

### CORS Configuration
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Required Request Body
```typescript
{
  email: string          // Client email
  company_id: string     // UUID of company
  company_name: string   // Company name
  hr_user_id: string     // UUID of HR user
  full_name: string      // Client full name
}
```

---

## 🎯 After Successful Deployment

### Test Client Creation Flow

1. Login as admin: https://prismatalent.vercel.app/admin/login
2. Navigate to: /admin/clients/new
3. Fill out client creation form:
   - Full Name: "Test Client"
   - Email: "your-test-email@gmail.com"
   - Company Name: "Test Company"
4. Submit form
5. Check email for magic link

**Expected Results**:
- ✅ No CORS errors in browser console
- ✅ Success message appears
- ✅ Magic link email received
- ✅ Client can authenticate via magic link
- ✅ Client redirected to /client/dashboard

### Monitor Edge Function Logs

```bash
# View function logs in real-time
supabase functions logs invite-client --follow
```

Or via Dashboard:
1. Go to: Supabase Dashboard → Edge Functions
2. Click on `invite-client`
3. View logs and invocations

---

## 🔐 Security Notes

### Service Role Key
- ✅ **Safe**: Used only in Edge Function (server-side)
- ❌ **Never**: Include in frontend code
- ✅ **Automatic**: Supabase provides this in Edge Function environment

### Frontend Usage
- Frontend uses `anon_key` (public key)
- Frontend calls Edge Function via: `supabase.functions.invoke('invite-client')`
- Edge Function uses `service_role_key` for admin operations
- RLS policies protect direct database access

---

## 📝 Deployment Checklist

Before deploying:
- [x] Edge Function code exists: `supabase/functions/invite-client/index.ts`
- [x] CORS headers configured correctly
- [x] Frontend custom header removed (CORS fix)
- [ ] Supabase CLI installed
- [ ] Logged into Supabase
- [ ] Project linked
- [ ] Function deployed
- [ ] Function tested manually
- [ ] Client creation tested end-to-end

After deploying:
- [ ] No 404 errors on function URL
- [ ] No CORS errors in browser console
- [ ] Magic link emails sending successfully
- [ ] Clients can authenticate
- [ ] email_communications table tracking emails

---

## 🚀 Quick Deployment Commands

```bash
# 1. Install CLI (if needed)
brew install supabase/tap/supabase

# 2. Login
supabase login

# 3. Link project
cd supabase
supabase link --project-ref vhjjibfblrkyfzcukqwa

# 4. Deploy function
supabase functions deploy invite-client

# 5. Verify deployment
supabase functions list

# 6. Test in production
# Try creating client from: https://prismatalent.vercel.app/admin/clients/new
```

---

**Last Updated**: 2025-10-22
**Next Steps**: Deploy Edge Function to resolve 404 error
**Status**: ⏳ Awaiting deployment
