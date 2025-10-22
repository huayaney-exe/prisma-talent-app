-- ============================================================================
-- Check what HTTP extensions are available in Supabase
-- ============================================================================

-- 1. List all available extensions
SELECT
  name,
  default_version,
  installed_version,
  comment
FROM pg_available_extensions
WHERE name LIKE '%http%' OR name LIKE '%net%' OR name LIKE '%curl%'
ORDER BY name;

-- 2. Check if http extension exists (synchronous HTTP)
SELECT EXISTS (
  SELECT 1 FROM pg_available_extensions WHERE name = 'http'
) as http_extension_available;

-- 3. Check what's currently installed
SELECT
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname IN ('pg_net', 'http', 'pgsql-http')
ORDER BY extname;
