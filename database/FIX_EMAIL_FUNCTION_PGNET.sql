-- Fix send_email_via_resend to handle pg_net response correctly
-- Error: invalid input value for enum net.request_status: "4"
-- Cause: pg_net.http_post returns status as integer, not enum
-- Solution: Handle response more carefully and add better error handling

DROP FUNCTION IF EXISTS public.send_email_via_resend(uuid);

CREATE FUNCTION public.send_email_via_resend(email_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  email_record RECORD;
  resend_response RECORD;
  email_body TEXT;
  resend_api_key TEXT;
  http_status INTEGER;
  response_body TEXT;
BEGIN
  -- Get API key from vault
  SELECT decrypted_secret INTO resend_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'resend_api_key';

  -- Validate API key exists
  IF resend_api_key IS NULL OR resend_api_key = '' THEN
    RAISE EXCEPTION 'Resend API key not in vault. Run: SELECT vault.create_secret(''your-key'', ''resend_api_key'')';
  END IF;

  -- Get email record
  SELECT * INTO email_record
  FROM email_communications
  WHERE id = email_id AND sent_at IS NULL;

  IF NOT FOUND THEN
    RETURN; -- Already sent or doesn't exist
  END IF;

  -- Build plain text email body based on email_type
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
        'Prisma Talent\n' ||
        'Community-driven talent acquisition',
        email_record.template_data->>'leader_name',
        email_record.template_data->>'company_name',
        email_record.template_data->>'position_name',
        email_record.template_data->>'position_code',
        email_record.template_data->>'form_url'
      );

    WHEN 'job_description_validation' THEN
      email_body := format(
        E'Hola %s,\n\n' ||
        '%s ha completado las especificaciones para la posición: %s\n\n' ||
        'Código: %s\n' ||
        'Empresa: %s\n\n' ||
        'El siguiente paso es que un administrador de Prisma valide el job description generado.\n\n' ||
        'Revisa los detalles en el dashboard de administrador:\n' ||
        '%s\n\n' ||
        'Saludos,\n' ||
        'Prisma Talent',
        email_record.template_data->>'hr_name',
        email_record.template_data->>'leader_name',
        email_record.template_data->>'position_name',
        email_record.template_data->>'position_code',
        email_record.template_data->>'company_name',
        email_record.template_data->>'admin_url'
      );

    WHEN 'applicant_status_update' THEN
      email_body := format(
        E'Hola %s,\n\n' ||
        'Hemos recibido tu aplicación para la posición de %s en %s.\n\n' ||
        'Tu perfil será revisado por nuestro equipo en los próximos 3-5 días hábiles.\n\n' ||
        'Te contactaremos si tu perfil avanza en el proceso.\n\n' ||
        'Consejos mientras esperas:\n' ||
        '- Mantén tu perfil de LinkedIn actualizado\n' ||
        '- Prepara ejemplos concretos de tu experiencia\n' ||
        '- Investiga más sobre %s\n\n' ||
        'Saludos,\n' ||
        'Prisma Talent',
        email_record.template_data->>'applicant_name',
        email_record.template_data->>'position_name',
        email_record.template_data->>'company_name',
        email_record.template_data->>'company_name'
      );

    ELSE
      -- Fallback: use email_content field
      email_body := email_record.email_content;
  END CASE;

  -- Send via Resend API using pg_net (with safer response handling)
  BEGIN
    -- Make HTTP request
    SELECT
      status::INTEGER,
      content::TEXT
    INTO
      http_status,
      response_body
    FROM net.http_post(
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
    );

    RAISE NOTICE 'HTTP Response: status=%, body=%', http_status, response_body;

  EXCEPTION WHEN OTHERS THEN
    -- pg_net error - log and mark as failed
    UPDATE email_communications
    SET
      retry_count = COALESCE(retry_count, 0) + 1,
      last_error = format('pg_net error: %s', SQLERRM),
      next_retry_at = NOW() + INTERVAL '5 minutes',
      status = CASE
        WHEN COALESCE(retry_count, 0) + 1 >= 3 THEN 'failed'
        ELSE 'pending'
      END
    WHERE id = email_id;

    RAISE WARNING 'pg_net exception for %: %', email_id, SQLERRM;
    RETURN;
  END;

  -- Check response status
  IF http_status = 200 THEN
    -- Success: Mark as sent
    UPDATE email_communications
    SET
      sent_at = NOW(),
      status = 'sent',
      resend_email_id = (response_body::jsonb->>'id')
    WHERE id = email_id;

    RAISE NOTICE '✅ Email sent successfully to % (ID: %)', email_record.recipient_email, email_id;
  ELSE
    -- Failure: Log error and schedule retry
    UPDATE email_communications
    SET
      retry_count = COALESCE(retry_count, 0) + 1,
      last_error = format('HTTP %s: %s', http_status, response_body),
      next_retry_at = NOW() + INTERVAL '5 minutes',
      status = CASE
        WHEN COALESCE(retry_count, 0) + 1 >= 3 THEN 'failed'
        ELSE 'pending'
      END
    WHERE id = email_id;

    RAISE WARNING '⚠️ Email send failed (retry %/3) to %: HTTP % - %',
      COALESCE(email_record.retry_count, 0) + 1,
      email_record.recipient_email,
      http_status,
      response_body;
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Catch any other errors
  UPDATE email_communications
  SET
    retry_count = COALESCE(retry_count, 0) + 1,
    last_error = SQLERRM,
    next_retry_at = NOW() + INTERVAL '5 minutes',
    status = CASE
      WHEN COALESCE(retry_count, 0) + 1 >= 3 THEN 'failed'
      ELSE 'pending'
    END
  WHERE id = email_id;

  RAISE WARNING '❌ Email send exception for %: %', email_id, SQLERRM;
END;
$function$;

-- Test it
SELECT 'Function updated with safer pg_net handling' as status;
