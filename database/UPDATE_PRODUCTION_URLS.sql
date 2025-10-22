-- ============================================================================
-- Update Production URLs in Database
-- Date: 2025-10-22
-- Purpose: Configure correct production URLs for email links and redirects
-- ============================================================================

-- IMPORTANT: Replace 'https://talent-platform.vercel.app' with your actual production domain
-- Examples:
--   - Vercel default: https://talent-platform.vercel.app
--   - Custom domain: https://talent.prisma.pe
--   - Staging: https://staging-talent.vercel.app

-- ============================================================================
-- UPDATE APP_CONFIG TABLE
-- ============================================================================

-- Update frontend URL (used in email templates for magic links)
UPDATE app_config
SET value = 'https://talent-platform.vercel.app',
    updated_at = NOW()
WHERE key = 'frontend_url';

-- If app_config row doesn't exist, insert it
INSERT INTO app_config (key, value, description, created_at, updated_at)
VALUES (
  'frontend_url',
  'https://talent-platform.vercel.app',
  'Production frontend URL for email links and redirects',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

-- ============================================================================
-- VERIFY CONFIGURATION
-- ============================================================================

-- Check current app_config settings
SELECT
  key,
  value,
  description,
  updated_at
FROM app_config
WHERE key LIKE '%url%'
ORDER BY key;

-- Expected output:
-- key           | value                              | description
-- --------------|------------------------------------|---------------------------------
-- frontend_url  | https://talent-platform.vercel.app | Production frontend URL for...

-- ============================================================================
-- TEST EMAIL LINKS
-- ============================================================================

-- After updating, verify email_communications contain correct URLs
SELECT
  email_type,
  recipient_email,
  content->>'redirect_url' as redirect_url,
  created_at
FROM email_communications
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- Email links should contain the production URL, not localhost:3000

-- ============================================================================
-- ADDITIONAL CONFIGURATION (Optional)
-- ============================================================================

-- Add API URL if using separate backend (currently not needed - Pure Supabase)
-- INSERT INTO app_config (key, value, description, created_at, updated_at)
-- VALUES (
--   'api_url',
--   'https://api.prisma.pe',
--   'Production API URL',
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (key) DO UPDATE
-- SET value = EXCLUDED.value,
--     updated_at = NOW();

-- Add support email
INSERT INTO app_config (key, value, description, created_at, updated_at)
VALUES (
  'support_email',
  'support@getprisma.io',
  'Support contact email',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Production URLs updated';
  RAISE NOTICE '🔗 Frontend URL: https://talent-platform.vercel.app';
  RAISE NOTICE '📧 Email links will now use production domain';
  RAISE NOTICE '⚠️  Remember to update VITE_APP_URL in Vercel environment variables';
END $$;
