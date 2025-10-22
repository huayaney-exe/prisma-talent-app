-- ============================================================================
-- DIAGNOSE: Understand pg_net behavior from first principles
-- ============================================================================

-- 1. Check pg_net version and configuration
SELECT
  'pg_net version' as check_type,
  extversion as result
FROM pg_extension
WHERE extname = 'pg_net';

-- 2. Check if net schema exists and what functions are available
SELECT
  'Available net functions' as check_type,
  routine_name as result
FROM information_schema.routines
WHERE routine_schema = 'net'
ORDER BY routine_name;

-- 3. Test a simple HTTP request to see actual behavior
DO $$
DECLARE
  test_request_id BIGINT;
BEGIN
  -- Make a simple HTTP GET to a public API
  SELECT net.http_get(
    url := 'https://httpbin.org/status/200'
  ) INTO test_request_id;

  RAISE NOTICE 'Request ID returned: %', test_request_id;
  RAISE NOTICE 'Request ID type: %', pg_typeof(test_request_id);
END $$;

-- 4. Check what's actually in the _http_response table structure
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'net'
  AND table_name = '_http_response'
ORDER BY ordinal_position;

-- 5. Make a test request and immediately check the response table
DO $$
DECLARE
  test_id BIGINT;
  found_status INTEGER;
  found_content TEXT;
BEGIN
  -- Make request
  SELECT net.http_get(
    url := 'https://httpbin.org/status/200'
  ) INTO test_id;

  RAISE NOTICE 'Made request with ID: %', test_id;

  -- Wait a moment
  PERFORM pg_sleep(2);

  -- Try to fetch response
  SELECT status_code, content
  INTO found_status, found_content
  FROM net._http_response
  WHERE id = test_id;

  IF FOUND THEN
    RAISE NOTICE '✅ Response found: status=%, content=%', found_status, found_content;
  ELSE
    RAISE NOTICE '❌ No response found in _http_response table';
  END IF;
END $$;

-- 6. Check if there's a different way pg_net stores responses
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'net'
ORDER BY table_name;
