-- ============================================================================
-- SOLUTION: Use plpgsql_check or try synchronous HTTP approach
-- ============================================================================
-- First Principle: PostgreSQL functions are synchronous by nature
-- pg_net is async, which conflicts with our synchronous function execution
--
-- Let's try the ORIGINAL approach that uses net.http_post directly
-- and see what the ACTUAL response structure is

CREATE OR REPLACE FUNCTION invite_client(
  p_email TEXT,
  p_company_id UUID,
  p_company_name TEXT,
  p_hr_user_id UUID,
  p_full_name TEXT
)
RETURNS jsonb AS $$
DECLARE
  http_request_id BIGINT;
  redirect_url TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
  frontend_url TEXT;
  auth_user_id TEXT;
BEGIN
  -- Get configuration from app_config table (with explicit schema)
  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'supabase_service_role_key';
  SELECT value INTO frontend_url FROM public.app_config WHERE key = 'frontend_url';

  redirect_url := frontend_url || '/client/dashboard';

  -- Validate required config
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Supabase configuration not set. Add to app_config table.'
    );
  END IF;

  -- Validate required parameters
  IF p_email IS NULL OR p_company_id IS NULL OR p_hr_user_id IS NULL OR p_full_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required parameters: email, company_id, hr_user_id, full_name'
    );
  END IF;

  -- Make HTTP request - pg_net just returns the request ID, it doesn't wait
  -- This is the fundamental issue!
  SELECT net.http_post(
    url := supabase_url || '/auth/v1/invite',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key,
      'apikey', service_role_key
    ),
    body := jsonb_build_object(
      'email', p_email,
      'data', jsonb_build_object(
        'company_id', p_company_id,
        'company_name', p_company_name,
        'hr_user_id', p_hr_user_id,
        'full_name', p_full_name,
        'role', 'client'
      ),
      'redirect_to', redirect_url
    )
  ) INTO http_request_id;

  -- At this point, the request is QUEUED, not completed
  -- We can't wait for it in the same transaction

  -- ALTERNATIVE: Return success immediately and handle via webhook/polling
  -- The email will be sent asynchronously by Supabase Auth

  RETURN jsonb_build_object(
    'success', true,
    'request_id', http_request_id,
    'message', 'Invitation queued for ' || p_email || '. Check email in a few moments.',
    'note', 'HTTP request is async - email will arrive shortly'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION invite_client(TEXT, UUID, TEXT, UUID, TEXT) TO authenticated;

-- Test it
SELECT invite_client(
  p_email := 'test@example.com',
  p_company_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_company_name := 'Test Company',
  p_hr_user_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_full_name := 'Test User'
) as result;
