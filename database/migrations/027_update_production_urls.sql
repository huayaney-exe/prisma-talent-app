-- Migration 027: Update Production URLs in app_config
-- Date: 2025-10-22
-- Purpose: Fix frontend_url and admin_dashboard_url to use production values
--
-- Issue: Migration 019 created app_config with localhost defaults using ON CONFLICT DO NOTHING
--        Migration 025 tried to insert production URLs but was blocked by existing values
--        Result: URLs still point to localhost instead of prismatalent.vercel.app
--
-- Impact: Email links in workflow notifications were broken (pointing to localhost)

-- ============================================================================
-- UPDATE PRODUCTION URLs
-- ============================================================================

-- Update frontend_url to production
UPDATE app_config
SET
  value = 'https://prismatalent.vercel.app',
  updated_at = NOW()
WHERE key = 'frontend_url';

-- Update admin_dashboard_url to production
UPDATE app_config
SET
  value = 'https://prismatalent.vercel.app/admin',
  updated_at = NOW()
WHERE key = 'admin_dashboard_url';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Display current configuration (verify URLs updated)
DO $$
DECLARE
  config_record RECORD;
BEGIN
  RAISE NOTICE '✅ Migration 027 completed: Production URLs updated';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Current app_config values:';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  FOR config_record IN
    SELECT
      key,
      CASE
        WHEN key LIKE '%key%' THEN '[REDACTED ' || length(value) || ' chars]'
        ELSE value
      END as display_value,
      description
    FROM app_config
    ORDER BY key
  LOOP
    RAISE NOTICE '🔑 %: %', config_record.key, config_record.display_value;
    RAISE NOTICE '   📝 %', COALESCE(config_record.description, '(no description)');
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🧪 Test email workflows to verify links work correctly';
END $$;

-- Verification query (run manually after migration)
-- SELECT key, value, length(value) as value_length, description
-- FROM app_config
-- WHERE key IN ('frontend_url', 'admin_dashboard_url')
-- ORDER BY key;

-- Expected output:
-- frontend_url: 'https://prismatalent.vercel.app' (35 chars)
-- admin_dashboard_url: 'https://prismatalent.vercel.app/admin' (41 chars)
