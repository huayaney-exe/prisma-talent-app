-- Migration 022: Email Sender SQL Function
-- Date: 2025-10-22
-- Purpose: Replace Python email worker with SQL function that sends emails via Resend API
-- Architecture: Database trigger → This function → Resend API

CREATE OR REPLACE FUNCTION send_email_via_resend(
  email_id UUID
)
RETURNS VOID AS $$
DECLARE
  email_record RECORD;
  resend_response net.http_response_result;
  email_body TEXT;
  resend_api_key TEXT;
BEGIN
  -- Get configuration
  resend_api_key := current_setting('app.resend_api_key', true);

  -- Validate API key exists
  IF resend_api_key IS NULL OR resend_api_key = '' THEN
    RAISE EXCEPTION 'Resend API key not configured. Set app.resend_api_key in database.';
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

  -- Send via Resend API using pg_net
  SELECT * INTO resend_response FROM net.http_post(
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

  -- Check response and update database
  IF resend_response.status = 200 THEN
    -- Success: Mark as sent
    UPDATE email_communications
    SET
      sent_at = NOW(),
      status = 'sent',
      resend_email_id = (resend_response.content::jsonb->>'id')
    WHERE id = email_id;

    RAISE NOTICE '✅ Email sent successfully to % (ID: %)', email_record.recipient_email, email_id;
  ELSE
    -- Failure: Log error and schedule retry
    UPDATE email_communications
    SET
      retry_count = COALESCE(retry_count, 0) + 1,
      last_error = format('HTTP %s: %s', resend_response.status, resend_response.content),
      next_retry_at = NOW() + INTERVAL '5 minutes',
      status = CASE
        WHEN COALESCE(retry_count, 0) + 1 >= 3 THEN 'failed'
        ELSE 'pending'
      END
    WHERE id = email_id;

    RAISE WARNING '⚠️ Email send failed (retry %/3) to %: HTTP % - %',
      COALESCE(email_record.retry_count, 0) + 1,
      email_record.recipient_email,
      resend_response.status,
      resend_response.content;
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Catch any errors and update database
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_email_via_resend(UUID) TO postgres, service_role;

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ Email sender function created successfully';
  RAISE NOTICE '📧 Emails will be sent via Resend API with plain text format (MVP)';
  RAISE NOTICE '🔄 Retry logic: 5 minutes delay, max 3 attempts';
END $$;
