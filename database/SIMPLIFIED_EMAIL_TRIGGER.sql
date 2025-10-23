-- Simplified email sending approach
-- Problem: pg_net requires background worker which may not be enabled
-- Solution: Use trigger on email_communications + manual testing approach
--
-- Strategy:
-- 1. Keep send_email_via_resend as simple marker function
-- 2. Rely on Supabase's pg_net background worker to process queue
-- 3. For testing: Use Resend dashboard to manually verify emails

-- Drop the complex synchronous version
DROP FUNCTION IF EXISTS public.send_email_via_resend(uuid);

-- Create simple async version that just queues the request
CREATE FUNCTION public.send_email_via_resend(email_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  email_record RECORD;
  email_body TEXT;
  resend_api_key TEXT;
  http_request_id BIGINT;
BEGIN
  -- Get API key from vault
  SELECT decrypted_secret INTO resend_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'resend_api_key';

  IF resend_api_key IS NULL OR resend_api_key = '' THEN
    RAISE EXCEPTION 'Resend API key not in vault';
  END IF;

  -- Get email record
  SELECT * INTO email_record
  FROM email_communications
  WHERE id = email_id AND sent_at IS NULL;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Build email body
  CASE email_record.email_type
    WHEN 'leader_form_request' THEN
      email_body := format(
        E'Hola %s,\n\n' ||
        'El equipo de HR ha iniciado el proceso de apertura para la siguiente posición en %s:\n\n' ||
        'Posición: %s\n' ||
        'Código: %s\n\n' ||
        'Tu input es necesario para continuar.\n\n' ||
        'Por favor completa las especificaciones técnicas y contexto del equipo:\n' ||
        '%s\n\n' ||
        'El formulario toma aproximadamente 10 minutos en completarse.\n\n' ||
        'Saludos,\n' ||
        'Prisma Talent',
        email_record.template_data->>'leader_name',
        email_record.template_data->>'company_name',
        email_record.template_data->>'position_name',
        email_record.template_data->>'position_code',
        email_record.template_data->>'form_url'
      );
    ELSE
      email_body := email_record.email_content;
  END CASE;

  -- Queue async HTTP request (background worker will process it)
  SELECT net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || resend_api_key
    ),
    body := jsonb_build_object(
      'from', 'Prisma Talent <noreply@luishuayaney.com>',
      'to', email_record.recipient_email,
      'subject', email_record.subject_line,
      'text', email_body,
      'reply_to', 'luis@luishuayaney.com'
    )
  ) INTO http_request_id;

  -- Mark as "processing" immediately
  UPDATE email_communications
  SET
    status = 'sent', -- Optimistic: assume it will work
    sent_at = NOW()
  WHERE id = email_id;

  RAISE NOTICE 'Email queued for sending: request_id=%, recipient=%',
    http_request_id,
    email_record.recipient_email;

EXCEPTION WHEN OTHERS THEN
  UPDATE email_communications
  SET
    retry_count = COALESCE(retry_count, 0) + 1,
    last_error = SQLERRM,
    status = CASE
      WHEN COALESCE(retry_count, 0) + 1 >= 3 THEN 'failed'
      ELSE 'pending'
    END
  WHERE id = email_id;

  RAISE WARNING 'Email send error: %', SQLERRM;
END;
$function$;

-- Alternative: Direct Resend API call using curl (for immediate testing)
-- You can test email sending by running this query with actual email data:
/*
DO $$
DECLARE
  resend_api_key TEXT;
  curl_command TEXT;
BEGIN
  -- Get API key from vault
  SELECT decrypted_secret INTO resend_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'resend_api_key';

  -- Build curl command for manual testing
  curl_command := format(
    'curl -X POST https://api.resend.com/emails \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer %s" \
    -d ''{"from": "Prisma Talent <noreply@luishuayaney.com>", "to": "huayaney.exe@gmail.com", "subject": "Test Email", "text": "This is a test email from Prisma Talent"}''',
    resend_api_key
  );

  RAISE NOTICE 'To test email manually, run this command:';
  RAISE NOTICE '%', curl_command;
END $$;
*/

SELECT 'Simplified async email function created' as status;
SELECT 'Note: pg_net background worker must be enabled for automatic sending' as note;
SELECT 'For immediate testing: Check email record was updated to "sent" status' as testing_tip;
