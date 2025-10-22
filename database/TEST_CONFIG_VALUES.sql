-- ============================================================================
-- TEST: Can we read config values directly?
-- ============================================================================

-- Test 1: Read all config values
SELECT
  key,
  CASE
    WHEN key LIKE '%key%' THEN '[REDACTED ' || length(value) || ' chars]'
    ELSE value
  END as display_value,
  length(value) as actual_length
FROM app_config
ORDER BY key;

-- Test 2: Read specific values the function needs
SELECT
  key,
  value IS NOT NULL as has_value,
  length(value) as value_length
FROM app_config
WHERE key IN ('supabase_url', 'supabase_service_role_key', 'frontend_url');

-- Test 3: Simulate exactly what invite_client does
DO $$
DECLARE
  test_url TEXT;
  test_key TEXT;
  test_frontend TEXT;
BEGIN
  -- This is EXACTLY what invite_client function does
  SELECT value INTO test_url
  FROM app_config
  WHERE key = 'supabase_url';

  SELECT value INTO test_key
  FROM app_config
  WHERE key = 'supabase_service_role_key';

  SELECT value INTO test_frontend
  FROM app_config
  WHERE key = 'frontend_url';

  -- Show what we got
  RAISE NOTICE 'supabase_url: %', COALESCE(test_url, 'NULL');
  RAISE NOTICE 'service_role_key length: %', COALESCE(length(test_key)::text, 'NULL');
  RAISE NOTICE 'frontend_url: %', COALESCE(test_frontend, 'NULL');

  -- Check if any are NULL
  IF test_url IS NULL THEN
    RAISE NOTICE '❌ supabase_url IS NULL';
  END IF;

  IF test_key IS NULL THEN
    RAISE NOTICE '❌ supabase_service_role_key IS NULL';
  END IF;

  IF test_frontend IS NULL THEN
    RAISE NOTICE '❌ frontend_url IS NULL';
  END IF;

  IF test_url IS NOT NULL AND test_key IS NOT NULL THEN
    RAISE NOTICE '✅ Both required config values found!';
  END IF;
END $$;
