-- Migration 024: Client Invitation SQL Function
-- Date: 2025-10-22
-- Purpose: Replace Render backend /clients/invite endpoint with SQL RPC function
-- Architecture: Frontend → supabase.rpc('invite_client') → Supabase Auth Admin API

CREATE OR REPLACE FUNCTION invite_client(
  p_email TEXT,
  p_company_id UUID,
  p_company_name TEXT,
  p_hr_user_id UUID,
  p_full_name TEXT
)
RETURNS jsonb AS $$
DECLARE
  auth_response net.http_response_result;
  redirect_url TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
  auth_user_id TEXT;
BEGIN
  -- Get configuration
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.supabase_service_role_key', true);
  redirect_url := current_setting('app.frontend_url', true) || '/client/dashboard';

  -- Validate required config
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Supabase configuration not set. Configure app.supabase_url and app.supabase_service_role_key.'
    );
  END IF;

  -- Validate required parameters
  IF p_email IS NULL OR p_company_id IS NULL OR p_hr_user_id IS NULL OR p_full_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required parameters: email, company_id, hr_user_id, full_name'
    );
  END IF;

  -- Call Supabase Auth Admin API to invite user
  -- https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
  SELECT * INTO auth_response FROM net.http_post(
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
  );

  -- Check response
  IF auth_response.status = 200 OR auth_response.status = 201 THEN
    -- Extract user ID from response
    auth_user_id := auth_response.content::jsonb->'user'->>'id';

    -- Update company with auth_user_id
    IF auth_user_id IS NOT NULL THEN
      UPDATE companies
      SET primary_contact_auth_id = auth_user_id::uuid
      WHERE id = p_company_id;
    END IF;

    -- Create email_communications record for tracking
    -- Note: Supabase Auth already sent the magic link email
    -- This is just for internal tracking
    INSERT INTO email_communications (
      company_id,
      email_type,
      recipient_email,
      recipient_name,
      subject_line,
      email_content,
      template_data,
      sent_at,  -- Already sent by Supabase Auth
      status
    ) VALUES (
      p_company_id,
      'client_invitation',
      p_email,
      p_full_name,
      'Bienvenido a Prisma Talent - Acceso a tu Portal',
      'Magic link invitation sent by Supabase Auth',
      jsonb_build_object(
        'client_name', p_full_name,
        'company_name', p_company_name,
        'magic_link', redirect_url
      ),
      NOW(),  -- Already sent
      'sent'
    );

    RAISE NOTICE '✅ Client invitation sent to % (company: %)', p_email, p_company_name;

    RETURN jsonb_build_object(
      'success', true,
      'auth_user_id', auth_user_id,
      'message', 'Invitation sent successfully to ' || p_email
    );
  ELSE
    -- Invitation failed
    RAISE WARNING '❌ Client invitation failed for %: HTTP % - %', p_email, auth_response.status, auth_response.content;

    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invitation failed: HTTP %s - %s', auth_response.status, auth_response.content)
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Catch any errors
  RAISE WARNING '❌ Exception in invite_client for %: %', p_email, SQLERRM;

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admin only in practice)
GRANT EXECUTE ON FUNCTION invite_client(TEXT, UUID, TEXT, UUID, TEXT) TO authenticated;

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ Client invitation function created successfully';
  RAISE NOTICE '🔐 Function uses Supabase Auth Admin API with service_role_key';
  RAISE NOTICE '📧 Magic link emails sent automatically by Supabase Auth';
  RAISE NOTICE '🎯 Frontend can call via: supabase.rpc(''invite_client'', {...})';
END $$;
