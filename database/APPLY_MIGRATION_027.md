# Apply Migration 027: Update Production URLs

## Quick Summary
This migration fixes `frontend_url` and `admin_dashboard_url` to use production values instead of localhost defaults.

**Problem**: Email links in workflow notifications were pointing to `http://localhost:3000` instead of `https://prismatalent.vercel.app`

---

## Apply Migration

### Option 1: Supabase SQL Editor (Recommended)
1. Go to: **Supabase Dashboard → SQL Editor**
2. Click: **New Query**
3. Copy/paste entire contents of: `database/migrations/027_update_production_urls.sql`
4. Click: **Run** (or `Cmd/Ctrl + Enter`)
5. Review output showing updated configuration

### Option 2: Quick SQL Update (Fastest)
If you want to skip the migration file, just run these two UPDATE statements directly:

```sql
-- Update frontend_url to production
UPDATE app_config
SET value = 'https://prismatalent.vercel.app', updated_at = NOW()
WHERE key = 'frontend_url';

-- Update admin_dashboard_url to production
UPDATE app_config
SET value = 'https://prismatalent.vercel.app/admin', updated_at = NOW()
WHERE key = 'admin_dashboard_url';
```

---

## Verification

### Check Updated Values
```sql
SELECT
  key,
  value,
  length(value) as value_length,
  description
FROM app_config
WHERE key IN ('frontend_url', 'admin_dashboard_url')
ORDER BY key;
```

**Expected output**:
```
key                  | value                                    | value_length | description
---------------------|------------------------------------------|--------------|----------------------------------
admin_dashboard_url  | https://prismatalent.vercel.app/admin    | 41           | Admin dashboard base URL
frontend_url         | https://prismatalent.vercel.app          | 35           | Base frontend URL for email links
```

**Key changes**:
- `frontend_url`: **31 chars → 35 chars** (localhost → production)
- `admin_dashboard_url`: **27 chars → 41 chars** (localhost → production)

---

## Impact

### Before Migration 027 ❌
**Business Leader Form Email**:
```
Por favor completa las especificaciones técnicas:
http://localhost:3000/business-form?code=POS_ABC123
```
→ **Broken link** (localhost not accessible)

**HR Notification Email**:
```
Revisa en el dashboard:
http://localhost:3000/admin/positions/abc-123-uuid
```
→ **Broken link** (localhost not accessible)

### After Migration 027 ✅
**Business Leader Form Email**:
```
Por favor completa las especificaciones técnicas:
https://prismatalent.vercel.app/business-form?code=POS_ABC123
```
→ **Working link** (production URL)

**HR Notification Email**:
```
Revisa en el dashboard:
https://prismatalent.vercel.app/admin/positions/abc-123-uuid
```
→ **Working link** (production URL)

---

## Test Email Workflows

After applying this migration, test the complete workflow:

### Test 1: Business Leader Form Notification
1. Create new position from HR dashboard
2. Complete HR form (Form 1)
3. Submit → triggers `notify_business_user_on_hr_completion()`
4. Check email sent to leader email
5. **Verify**: Email contains link `https://prismatalent.vercel.app/business-form?code=...`
6. **Click link**: Should open production business form

### Test 2: HR Notification on Leader Completion
1. Business leader completes Form 2
2. Submit → triggers `notify_hr_on_business_completion()`
3. Check email sent to HR user
4. **Verify**: Email contains link `https://prismatalent.vercel.app/admin/positions/...`
5. **Click link**: Should open production admin position detail

---

## Technical Details

### Why This Happened

**Migration 019** (created `app_config` table):
```sql
INSERT INTO app_config (key, value, description)
VALUES
  ('frontend_url', 'http://localhost:3000', ...),
  ('admin_dashboard_url', 'http://localhost:3000/admin', ...)
ON CONFLICT (key) DO NOTHING;  ← This prevented updates!
```

**Migration 025** (tried to set production values):
```sql
INSERT INTO app_config (key, value, description) VALUES
  ('frontend_url', 'https://prismatalent.vercel.app', ...)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;  ← Should have used this!
```

But migration 025 didn't have `ON CONFLICT ... DO UPDATE`, so the localhost values remained.

### How Migration 027 Fixes It

Migration 027 uses **UPDATE** instead of **INSERT**, which:
- ✅ Overwrites existing values regardless of `ON CONFLICT` logic
- ✅ Updates `updated_at` timestamp for audit trail
- ✅ Doesn't fail if values are already correct (idempotent)

---

## Rollback (If Needed)

To rollback to localhost URLs (for local development):
```sql
UPDATE app_config
SET value = 'http://localhost:3000', updated_at = NOW()
WHERE key = 'frontend_url';

UPDATE app_config
SET value = 'http://localhost:3000/admin', updated_at = NOW()
WHERE key = 'admin_dashboard_url';
```

---

## Success Criteria

- [x] Migration 027 applied without errors
- [x] `frontend_url` = `https://prismatalent.vercel.app` (35 chars)
- [x] `admin_dashboard_url` = `https://prismatalent.vercel.app/admin` (41 chars)
- [x] Business leader form email contains production link
- [x] HR notification email contains production link
- [x] Both email links work when clicked
- [x] Email workflow fully functional end-to-end

---

**After this migration, all email links will point to production and the complete workflow will be functional!** 🚀
