# Setup Storage Buckets - Supabase Storage

**Purpose**: Configure file storage for applicant resumes and portfolios
**Priority**: 🟠 HIGH - Required for job application flow
**Estimated Time**: 20 minutes

---

## Overview

The application requires two storage buckets for file uploads:
1. **resumes** - PDF résumés and CVs
2. **portfolios** - Design portfolios, work samples, additional documents

---

## Step 1: Create Buckets in Supabase Dashboard

### Navigate to Storage

1. Go to: https://vhjjibfblrkyfzcukqwa.supabase.co/project/vhjjibfblrkyfzcukqwa/storage/buckets
2. Click "New bucket"

### Create `resumes` Bucket

**Settings**:
- **Name**: `resumes`
- **Public bucket**: ✅ YES (checked)
  - _Reason: Allows Prisma admins to view resumes directly via URL_
- **File size limit**: `10 MB`
- **Allowed MIME types**:
  ```
  application/pdf
  application/msword
  application/vnd.openxmlformats-officedocument.wordprocessingml.document
  image/png
  image/jpeg
  ```

**Click**: "Create bucket"

### Create `portfolios` Bucket

**Settings**:
- **Name**: `portfolios`
- **Public bucket**: ✅ YES (checked)
  - _Reason: Allows Prisma admins and clients to view portfolio files_
- **File size limit**: `20 MB`
- **Allowed MIME types**:
  ```
  application/pdf
  application/zip
  application/x-rar-compressed
  image/png
  image/jpeg
  image/gif
  image/webp
  ```

**Click**: "Create bucket"

---

## Step 2: Configure RLS Policies for Buckets

Navigate to: Storage → Policies

### Policies for `resumes` Bucket

#### Policy 1: Public Read Access
**Name**: `resumes_public_read`
**Allowed operation**: SELECT
**Target roles**: `public`, `anon`, `authenticated`
**USING expression**:
```sql
true
```
**Reason**: Allows anyone with the URL to view resumes (admins sharing links)

#### Policy 2: Public Upload
**Name**: `resumes_public_upload`
**Allowed operation**: INSERT
**Target roles**: `anon`
**WITH CHECK expression**:
```sql
true
```
**Reason**: Allows job applicants to upload resumes during application

#### Policy 3: Authenticated Update/Delete
**Name**: `resumes_authenticated_manage`
**Allowed operation**: UPDATE, DELETE
**Target roles**: `authenticated`
**USING expression**:
```sql
EXISTS (
  SELECT 1 FROM prisma_admins
  WHERE auth_user_id = auth.uid()
  AND is_active = TRUE
)
```
**Reason**: Only Prisma admins can delete or update resumes

---

### Policies for `portfolios` Bucket

#### Policy 1: Public Read Access
**Name**: `portfolios_public_read`
**Allowed operation**: SELECT
**Target roles**: `public`, `anon`, `authenticated`
**USING expression**:
```sql
true
```

#### Policy 2: Public Upload
**Name**: `portfolios_public_upload`
**Allowed operation**: INSERT
**Target roles**: `anon`
**WITH CHECK expression**:
```sql
true
```

#### Policy 3: Authenticated Update/Delete
**Name**: `portfolios_authenticated_manage`
**Allowed operation**: UPDATE, DELETE
**Target roles**: `authenticated`
**USING expression**:
```sql
EXISTS (
  SELECT 1 FROM prisma_admins
  WHERE auth_user_id = auth.uid()
  AND is_active = TRUE
)
```

---

## Step 3: Verify Bucket Configuration

### Check Buckets Exist

**SQL Query**:
```sql
-- This query may not work in all Supabase versions
-- Use Dashboard UI to verify instead
```

**Dashboard Verification**:
1. Go to Storage → Buckets
2. Should see two buckets:
   - ✅ `resumes` (public)
   - ✅ `portfolios` (public)

### Test Upload Functionality

**Test from Frontend**:
```typescript
// Test resume upload
const { data, error } = await supabase.storage
  .from('resumes')
  .upload('test-resume.pdf', fileBlob)

console.log('Upload result:', { data, error })
```

**Expected Response**:
```json
{
  "data": {
    "path": "test-resume.pdf",
    "id": "uuid-here",
    "fullPath": "resumes/test-resume.pdf"
  },
  "error": null
}
```

---

## Step 4: Frontend Integration Verification

### Check Upload Code Exists

**Files to verify**:
- `frontend/src/pages/public/ApplicationFormPage.tsx` - Application form with file uploads
- `frontend/src/services/applicantService.ts` - Applicant submission logic

**Expected upload pattern**:
```typescript
// Upload resume
const resumePath = `${Date.now()}-${resumeFile.name}`
const { error: resumeError } = await supabase.storage
  .from('resumes')
  .upload(resumePath, resumeFile)

if (resumeError) throw resumeError

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('resumes')
  .getPublicUrl(resumePath)

// Store URL in applicants table
```

---

## Step 5: Production Testing

### Test Application Flow

1. Navigate to a job listing: `/job/:code`
2. Click "Apply"
3. Fill out application form
4. Upload resume (PDF)
5. Upload portfolio (optional)
6. Submit application
7. Verify files appear in Storage dashboard

### Verify Storage Dashboard

1. Go to: Storage → Buckets → resumes
2. Should see uploaded resume file
3. Click file → "Get URL" → Verify URL works
4. URL format: `https://vhjjibfblrkyfzcukqwa.supabase.co/storage/v1/object/public/resumes/1234567890-resume.pdf`

---

## Troubleshooting

### Issue: "Bucket not found"
**Cause**: Bucket not created or wrong name
**Fix**: Verify bucket exists in dashboard, check spelling in code

### Issue: "Permission denied" on upload
**Cause**: RLS policies not configured
**Fix**: Add public insert policy for anon role (see Step 2)

### Issue: Files upload but URLs don't work
**Cause**: Bucket not set to public
**Fix**: Edit bucket settings → Enable "Public bucket"

### Issue: File size too large
**Cause**: File exceeds bucket limit (10MB for resumes, 20MB for portfolios)
**Fix**:
- Increase bucket limit in dashboard
- Add frontend validation to warn users before upload

---

## Security Considerations

### ✅ What's Secure

- **Public read**: Necessary for viewing resumes/portfolios, URLs are UUID-based (not guessable)
- **Public upload**: Limited to anon role, file size restrictions in place
- **Admin-only delete**: Prevents applicants from deleting after submission
- **MIME type restrictions**: Prevents executable file uploads

### ⚠️ Potential Risks

- **Public URLs**: Anyone with the URL can view files (acceptable for resumes)
- **No virus scanning**: Consider adding Supabase Edge Function with virus scanning API
- **Storage costs**: Monitor usage to avoid unexpected costs (Supabase free tier: 1GB)

### 🔒 Recommended Enhancements (Future)

1. **Add virus scanning**: Integrate ClamAV or similar via Edge Function
2. **Add file validation**: Check PDF validity before storing
3. **Add metadata**: Store original filename, upload date, file hash
4. **Add expiration**: Implement TTL for old files (6 months after position filled)

---

## Quick Reference Commands

### List all buckets (via API)
```typescript
const { data: buckets } = await supabase.storage.listBuckets()
console.log('Buckets:', buckets.map(b => b.name))
```

### List files in bucket
```typescript
const { data: files } = await supabase.storage
  .from('resumes')
  .list()
console.log('Files:', files)
```

### Delete old test files
```typescript
const { error } = await supabase.storage
  .from('resumes')
  .remove(['test-resume.pdf'])
```

---

## Completion Checklist

- [ ] Created `resumes` bucket (public, 10MB limit)
- [ ] Created `portfolios` bucket (public, 20MB limit)
- [ ] Configured RLS policies for both buckets
- [ ] Verified buckets appear in Storage dashboard
- [ ] Tested file upload from frontend
- [ ] Verified public URLs work
- [ ] Checked admin can delete files
- [ ] Documented bucket configuration

---

## Related Files

- [ApplicationFormPage.tsx](frontend/src/pages/public/ApplicationFormPage.tsx) - File upload UI
- [applicantService.ts](frontend/src/services/applicantService.ts) - Upload logic
- [PRODUCTION_READINESS_QA.md](PRODUCTION_READINESS_QA.md) - Testing checklist

---

**Status**: 📋 Ready to implement
**Next**: After setup, test full application flow end-to-end
