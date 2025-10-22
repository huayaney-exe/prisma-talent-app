-- ============================================================================
-- Setup RLS Policies for Resumes Storage Bucket
-- Date: 2025-10-22
-- Purpose: Configure secure access policies for resume file uploads
-- ============================================================================

-- PREREQUISITE: The 'resumes' bucket must already exist in Supabase Storage
-- Create bucket via Dashboard: Storage → New Bucket → Name: "resumes", Public: YES

-- Supabase Storage uses the storage.objects table with RLS policies
-- Policies filter by bucket_id to target specific buckets

-- ============================================================================
-- POLICY 1: Public Read Access
-- Purpose: Allow anyone with the URL to view resume files
-- Use case: Prisma admins sharing resume links with clients
-- ============================================================================

CREATE POLICY "resumes_public_read" ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'resumes'
  );

COMMENT ON POLICY "resumes_public_read" ON storage.objects IS
  'Allows public read access to resume files. Anyone with the URL can view resumes.';

-- ============================================================================
-- POLICY 2: Public Upload (Anonymous)
-- Purpose: Allow job applicants to upload resumes during application
-- Use case: Public application form at /apply/:code
-- ============================================================================

CREATE POLICY "resumes_public_upload" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'resumes'
    -- Optional: Add file size limit (in bytes, 10MB = 10485760)
    -- AND (storage.foldername(name))[1] = 'resumes'
  );

COMMENT ON POLICY "resumes_public_upload" ON storage.objects IS
  'Allows anonymous users to upload resume files during job application. No authentication required.';

-- ============================================================================
-- POLICY 3a: Admin-Only Update
-- Purpose: Only Prisma admins can update resume file metadata
-- Use case: Admin updating file properties
-- ============================================================================

CREATE POLICY "resumes_admin_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

COMMENT ON POLICY "resumes_admin_update" ON storage.objects IS
  'Only active Prisma admins can update resume files.';

-- ============================================================================
-- POLICY 3b: Admin-Only Delete
-- Purpose: Only Prisma admins can delete resume files
-- Use case: Admin cleanup, removing inappropriate content
-- ============================================================================

CREATE POLICY "resumes_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND EXISTS (
      SELECT 1 FROM prisma_admins
      WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
    )
  );

COMMENT ON POLICY "resumes_admin_delete" ON storage.objects IS
  'Only active Prisma admins can delete resume files. Prevents applicants from removing submissions.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all policies on storage.objects for resumes bucket
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%resumes%'
ORDER BY policyname;

-- Expected output: 4 policies
-- 1. resumes_admin_delete  - authenticated - DELETE
-- 2. resumes_admin_update  - authenticated - UPDATE
-- 3. resumes_public_read   - public        - SELECT
-- 4. resumes_public_upload - anon          - INSERT

-- ============================================================================
-- TEST POLICIES
-- ============================================================================

-- Test 1: Public read (should work)
-- SELECT * FROM storage.objects WHERE bucket_id = 'resumes' LIMIT 1;

-- Test 2: Anonymous upload (test from frontend application form)
-- const { data, error } = await supabase.storage
--   .from('resumes')
--   .upload('test-resume.pdf', fileBlob)

-- Test 3: Admin delete (test from admin dashboard)
-- const { error } = await supabase.storage
--   .from('resumes')
--   .remove(['old-resume.pdf'])

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- ✅ What's Protected:
-- - Only admins can delete resumes (prevents applicants from removing submissions)
-- - Public upload restricted to 'resumes' bucket only
-- - File size limits enforced at bucket level (10MB in Dashboard)

-- ⚠️ Considerations:
-- - Public read means anyone with URL can view (acceptable for resumes)
-- - No virus scanning (consider adding via Edge Function)
-- - No automatic expiration (consider cleanup job for old files)

-- 🔒 Recommended Enhancements (Future):
-- 1. Add virus scanning Edge Function before storing
-- 2. Add file metadata validation (check PDF validity)
-- 3. Implement TTL for old files (6 months after position filled)
-- 4. Add audit logging for admin deletions

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To remove all policies (use with caution):
-- DROP POLICY IF EXISTS "resumes_public_read" ON storage.objects;
-- DROP POLICY IF EXISTS "resumes_public_upload" ON storage.objects;
-- DROP POLICY IF EXISTS "resumes_admin_update" ON storage.objects;
-- DROP POLICY IF EXISTS "resumes_admin_delete" ON storage.objects;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Storage policies configured for resumes bucket (4 policies)';
  RAISE NOTICE '📄 Public read: Anyone with URL can view resumes';
  RAISE NOTICE '⬆️  Public upload: Anonymous users can upload during application';
  RAISE NOTICE '✏️  Admin update: Only Prisma admins can update file metadata';
  RAISE NOTICE '🗑️  Admin delete: Only Prisma admins can delete files';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test upload via frontend: /apply/:code';
  RAISE NOTICE '🔍 Verify policies: SELECT * FROM pg_policies WHERE tablename = ''objects'' AND schemaname = ''storage'';';
END $$;
