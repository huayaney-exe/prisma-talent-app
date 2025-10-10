# Client Authentication System - Testing Guide

## ✅ What Was Built (YC MVP - 60 minutes)

**Goal**: Admin creates client → Client gets magic link → Client logs in → Client can create positions

**Architecture**: Lean, production-ready, zero custom infrastructure

---

## 🧪 How to Test End-to-End

### Step 1: Create a Test Lead (Admin)

1. **Go to Landing Page**: http://localhost:3000/
2. **Fill contact form** with test data:
   - Name: Test Client
   - Email: YOUR_REAL_EMAIL@gmail.com ⚠️ (use real email to receive magic link!)
   - Company: Test Company Inc
   - Intent: Hiring
3. **Submit** → Lead created in database

### Step 2: Approve Lead (Admin)

1. **Login as admin**: http://localhost:3000/admin/login
   - Email: huayaney.exe@gmail.com
   - Password: Your admin password
2. **Go to Lead Management**: http://localhost:3000/admin/leads
3. **Find your test lead** → Click "Aprobar"
4. **Lead status changes** to "approved"

### Step 3: Create Client Account (Admin)

1. **On the approved lead**, click **"🎯 Crear Cliente"** button
2. **Confirm** the popup
3. **Supabase sends magic link** to client email automatically
4. **Success message**: "Cuenta de cliente creada. Email de invitación enviado."

### Step 4: Check Your Email (Client)

1. **Open your email inbox** (the one you used in the form)
2. **Look for email from Supabase** (subject: "Confirm your signup")
   - Check spam folder if not in inbox
3. **Click the magic link** in the email
4. **You'll be redirected** to http://localhost:3000/client/dashboard

### Step 5: Client Dashboard (Client)

1. **You're now logged in** as a client
2. **See your company info** and dashboard
3. **Try clicking**: "Ir al Formulario HR"
4. **HR Form opens with company banner** ✅

### Step 6: HR Form Auto-Fill (Client)

1. **Company banner visible** at top: "🏢 Creando posición para: [Company Name]"
2. **Fill out the position form** normally
3. **Submit the form**
4. **Position created** - automatically linked to your company
5. **Verify in database** (see SQL below)

---

## 🔍 What to Verify

### Database Changes

**After Step 3** (Create Client), verify in Supabase SQL Editor:

```sql
-- Check company was created
SELECT * FROM companies
WHERE primary_contact_email = 'YOUR_EMAIL@gmail.com';

-- Check auth user was created
SELECT id, email, created_at FROM auth.users
WHERE email = 'YOUR_EMAIL@gmail.com';

-- Check link between company and auth user
SELECT
  c.company_name,
  c.primary_contact_email,
  c.primary_contact_auth_id,
  u.email as auth_email
FROM companies c
LEFT JOIN auth.users u ON c.primary_contact_auth_id = u.id
WHERE c.primary_contact_email = 'YOUR_EMAIL@gmail.com';
```

**Expected**: All 3 queries return data, company has `primary_contact_auth_id` matching auth.users.id

### Position Creation Verification

**After Step 6** (Client creates position), verify position is linked to client company:

```sql
-- Check position was created with correct company_id
SELECT
  p.position_code,
  p.position_name,
  p.company_id,
  c.company_name,
  c.primary_contact_email
FROM positions p
JOIN companies c ON p.company_id = c.id
WHERE c.primary_contact_email = 'YOUR_EMAIL@gmail.com'
ORDER BY p.created_at DESC
LIMIT 1;
```

**Expected**: Position shows with matching company_id and company_name

### Authentication Flow

**Client Login** (http://localhost:3000/client/login):
1. Enter email
2. Click "Enviar Magic Link"
3. Check email for link
4. Click link → Logged in
5. No password needed ✅

**Client Dashboard** (http://localhost:3000/client/dashboard):
1. Shows company name in header
2. Shows welcome message
3. Shows 4 cards: Create Position, My Positions, Company Info, Support
4. Can click "Ir al Formulario HR"

**HR Form Auto-Fill** (http://localhost:3000/hr-form):
1. Shows company banner: "🏢 Creando posición para: [Company Name]"
2. Banner explains position will be linked to company
3. Form submits with company_id automatically
4. Position created is visible only to that client ✅

**Protected Routes**:
- Try accessing `/client/dashboard` without login → Redirects to `/client/login` ✅
- Try accessing `/admin` as client → Shows "Acceso Denegado" ✅

---

## 🐛 Troubleshooting

### Issue: Magic Link Email Not Received

**Possible Causes**:
1. Email in spam folder
2. Supabase email not configured properly
3. Wrong email entered

**Fix**:
```sql
-- Check if auth user was created
SELECT * FROM auth.users WHERE email = 'YOUR_EMAIL@gmail.com';

-- If user exists but no email received, manually get magic link:
-- Go to Supabase Dashboard → Authentication → Users
-- Find the user → Click "Send Magic Link"
```

### Issue: "Error al crear cuenta de cliente"

**Check Browser Console** for error message:
- "User already exists" → Use different email or delete existing user
- "Permission denied" → Check admin is logged in
- "Invalid email" → Check email format

**Debug**:
```javascript
// In browser console after login as admin
const { data, error } = await supabase.auth.admin.inviteUserByEmail(
  'test@example.com',
  { data: { role: 'client' } }
)
console.log({ data, error })
```

### Issue: Client Can't Access Dashboard

**Check** in browser console:
```javascript
// Should return client company
const { data } = await supabase
  .from('companies')
  .select('*')
  .eq('primary_contact_auth_id', (await supabase.auth.getUser()).data.user?.id)
console.log(data)
```

**If empty**: Auth user not linked to company
**Fix**: Run SQL to link them:
```sql
UPDATE companies
SET primary_contact_auth_id = 'AUTH_USER_ID_HERE'
WHERE primary_contact_email = 'CLIENT_EMAIL@example.com';
```

---

## 📊 Success Metrics

**✅ Complete Success**:
1. Lead → Approved → Client Account Created (< 1 minute)
2. Client receives email within 1 minute
3. Client clicks link → Logged in (< 5 seconds)
4. Client sees dashboard with company info
5. Client can navigate to HR form

**Database Integrity**:
- Companies table has `primary_contact_auth_id`
- Auth.users has client email
- RLS policies allow client to see their company
- No errors in browser console

---

## 🎯 Next Steps After Testing

### Immediate (This Week)
1. Test with 1-2 real clients
2. Gather feedback on dashboard UX
3. Monitor email delivery success rate

### Short Term (Next Sprint)
1. ✅ **HR Form Auto-Fill**: Pre-fill company when client is logged in (COMPLETED)
2. **Client Positions Page**: Show list of their positions at `/client/positions`
3. **Email Templates**: Custom branded invitation emails

### Future Enhancements
1. Client can view applicants for their positions
2. Client can provide feedback on candidates
3. Client analytics dashboard
4. Multi-user support (invite team members)

---

## 🔐 Security Notes

**What's Secure** ✅:
- Magic links expire after 1 hour
- Supabase handles token generation/validation
- RLS policies enforce company isolation
- No passwords to steal/leak
- Production-grade authentication

**What's Not Yet Implemented** ⚠️:
- Email verification (Supabase handles this)
- Rate limiting on magic link requests
- Audit logging of client actions
- Two-factor authentication

**For Production**:
- Configure custom email domain (not @supabase.co)
- Set up monitoring for failed auth attempts
- Add rate limiting on invitation creation
- Implement session timeout policies

---

## 📝 Testing Checklist

### Admin Flow
- [ ] Can login to admin portal
- [ ] Can see leads in Lead Management
- [ ] Can approve lead
- [ ] Can click "Crear Cliente" button
- [ ] Sees success message after creation
- [ ] Lead still shows in list (status: approved)

### Client Creation
- [ ] Company created in database
- [ ] Auth user created in Supabase
- [ ] `primary_contact_auth_id` correctly linked
- [ ] Magic link email sent (check inbox/spam)

### Client Login
- [ ] Can access /client/login page
- [ ] Can enter email and request magic link
- [ ] Receives "Check your email" message
- [ ] Email arrives within 1 minute
- [ ] Magic link works (redirects to dashboard)

### Client Dashboard
- [ ] Shows company name in header
- [ ] Shows welcome message with user name
- [ ] Shows 4 action cards
- [ ] "Ir al Formulario HR" button works
- [ ] "Cerrar Sesión" logs out correctly

### HR Form Auto-Fill
- [ ] Company banner visible at top when logged in as client
- [ ] Banner shows correct company name
- [ ] Form submission works normally
- [ ] Created position linked to client company (verify in database)
- [ ] Non-logged-in users see form without banner (fallback behavior)

### Security
- [ ] Cannot access /client/dashboard without login
- [ ] Cannot access /admin as client
- [ ] Cannot see other companies' data
- [ ] Magic link expires after use

---

## 💡 Tips for Demo

1. **Prepare test email** beforehand (use your own email for reliable delivery)
2. **Have two browser windows**: One for admin, one for client
3. **Show the flow end-to-end** in < 2 minutes
4. **Highlight**: "No passwords, no custom email code, production-ready"
5. **Emphasize speed**: "60 minutes to build, uses Supabase magic links"

---

**Status**: ✅ Ready to test
**Estimated test time**: 10 minutes
**Production ready**: Yes (with custom email domain)
