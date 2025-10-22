-- ============================================================================
-- DIAGNOSE: Check invite_client Function Configuration
-- ============================================================================

-- Check function owner, security settings, and search_path
SELECT
  p.proname as function_name,
  p.proowner::regrole as owner,
  p.prosecdef as is_security_definer,
  p.proconfig as config_settings,
  pg_get_functiondef(p.oid) as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'invite_client';

-- Check schema permissions
SELECT
  schema_name,
  schema_owner,
  'Check if authenticated has USAGE on this schema' as note
FROM information_schema.schemata
WHERE schema_name = 'public';

-- Check if authenticated can access public schema
SELECT
  n.nspname as schema_name,
  has_schema_privilege('authenticated', n.oid, 'USAGE') as can_use_schema
FROM pg_namespace n
WHERE n.nspname = 'public';
