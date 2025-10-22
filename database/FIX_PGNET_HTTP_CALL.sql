-- ============================================================================
-- FIX: Update invite_client to handle pg_net HTTP response correctly
-- ============================================================================
-- Issue: pg_net 0.19.5 has different response structure
-- Fix: Use async HTTP request instead of sync, or handle response differently

CREATE OR REPLACE FUNCTION invite_client(
  p_email TEXT,
  p_company_id UUID,
  p_company_name TEXT,
  p_hr_user_id UUID,
  p_full_name TEXT
)
RETURNS jsonb AS $$
DECLARE
  request_id BIGINT;
  redirect_url TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
  frontend_url TEXT;
  response_data jsonb;
  max_wait INTEGER := 30; -- Max wait time in seconds
  wait_count INTEGER := 0;
BEGIN
  -- Get configuration from app_config table
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

  -- Make async HTTP request to Supabase Auth API
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
  ) INTO request_id;

  -- Wait for response (poll net._http_response table)
  WHILE wait_count < max_wait LOOP
    SELECT
      status_code,
      content::jsonb
    INTO
      response_data
    FROM net._http_response
    WHERE id = request_id;

    -- Check if response is ready
    IF FOUND THEN
      -- Extract status code and content from response
      DECLARE
        status_code INTEGER;
        response_content jsonb;
        auth_user_id TEXT;
      BEGIN
        status_code := (response_data->>'status_code')::INTEGER;
        response_content := response_data->'content';

        IF status_code = 200 OR status_code = 201 THEN
          -- Success! Extract user ID
          auth_user_id := response_content->'user'->>'id';

          -- Update company with auth_user_id
          IF auth_user_id IS NOT NULL THEN
            UPDATE public.companies
            SET primary_contact_auth_id = auth_user_id::uuid
            WHERE id = p_company_id;
          END IF;

          -- Create email tracking record
          INSERT INTO public.email_communications (
            company_id, email_type, recipient_email, recipient_name,
            subject_line, email_content, template_data, sent_at, status
          ) VALUES (
            p_company_id, 'client_invitation', p_email, p_full_name,
            'Bienvenido a Prisma Talent - Acceso a tu Portal',
            'Magic link invitation sent by Supabase Auth',
            jsonb_build_object(
              'client_name', p_full_name,
              'company_name', p_company_name,
              'magic_link', redirect_url
            ),
            NOW(), 'sent'
          );

          RETURN jsonb_build_object(
            'success', true,
            'auth_user_id', auth_user_id,
            'message', 'Invitation sent successfully to ' || p_email
          );
        ELSE
          -- HTTP error
          RETURN jsonb_build_object(
            'success', false,
            'error', format('Invitation failed: HTTP %s - %s', status_code, response_content)
          );
        END IF;
      END;
    END IF;

    -- Wait 1 second and try again
    PERFORM pg_sleep(1);
    wait_count := wait_count + 1;
  END LOOP;

  -- Timeout
  RETURN jsonb_build_object(
    'success', false,
    'error', 'HTTP request timeout after ' || max_wait || ' seconds'
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

-- Test the fixed function
SELECT invite_client(
  p_email := 'test@example.com',
  p_company_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_company_name := 'Test Company',
  p_hr_user_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_full_name := 'Test User'
) as pgnet_fixed_result;
