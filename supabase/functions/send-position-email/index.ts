/**
 * Supabase Edge Function: Send Position Email
 *
 * Sends email notification to business leader when position is ready for their input.
 * Uses Resend API to send emails.
 * Follows same pattern as invite-client Edge Function.
 *
 * Usage: POST /functions/v1/send-position-email
 * Body: { email_id: "uuid" }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendEmailRequest {
  email_id: string
}

interface EmailRecord {
  id: string
  company_id: string
  position_id: string
  email_type: string
  recipient_email: string
  recipient_name: string
  subject_line: string
  email_content: string
  template_data: {
    leader_name?: string
    company_name?: string
    position_name?: string
    position_code?: string
    form_url?: string
    [key: string]: any
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { email_id }: SendEmailRequest = await req.json()

    if (!email_id) {
      return new Response(
        JSON.stringify({ error: 'Missing email_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch email record from database
    const { data: emailRecord, error: fetchError } = await supabaseAdmin
      .from('email_communications')
      .select('*')
      .eq('id', email_id)
      .is('sent_at', null)
      .single<EmailRecord>()

    if (fetchError || !emailRecord) {
      return new Response(
        JSON.stringify({ error: 'Email record not found or already sent' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Resend API key from vault
    const { data: secretData, error: secretError } = await supabaseAdmin
      .rpc('get_secret', { secret_name: 'resend_api_key' })

    if (secretError || !secretData) {
      console.error('Failed to get Resend API key from vault:', secretError)
      return new Response(
        JSON.stringify({ error: 'Resend API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = secretData

    // Build email body based on email_type
    let emailBody: string

    switch (emailRecord.email_type) {
      case 'leader_form_request':
        emailBody = `Hola ${emailRecord.template_data.leader_name},

El equipo de HR ha iniciado el proceso de apertura para la siguiente posición en ${emailRecord.template_data.company_name}:

Posición: ${emailRecord.template_data.position_name}
Código: ${emailRecord.template_data.position_code}

Tu input es necesario para continuar.

Por favor completa las especificaciones técnicas y contexto del equipo:
${emailRecord.template_data.form_url}

El formulario toma aproximadamente 10 minutos en completarse.

Saludos,
Prisma Talent
Community-driven talent acquisition`
        break

      default:
        emailBody = emailRecord.email_content
    }

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Prisma Talent <noreply@luishuayaney.com>',
        to: emailRecord.recipient_email,
        subject: emailRecord.subject_line,
        text: emailBody,
        reply_to: 'luis@luishuayaney.com',
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)

      // Update email record with error
      await supabaseAdmin
        .from('email_communications')
        .update({
          retry_count: (emailRecord as any).retry_count ? (emailRecord as any).retry_count + 1 : 1,
          last_error: `HTTP ${resendResponse.status}: ${JSON.stringify(resendData)}`,
          status: 'failed',
        })
        .eq('id', email_id)

      return new Response(
        JSON.stringify({ error: `Resend API error: ${resendData.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update email record as sent
    await supabaseAdmin
      .from('email_communications')
      .update({
        sent_at: new Date().toISOString(),
        status: 'sent',
        resend_email_id: resendData.id,
      })
      .eq('id', email_id)

    console.log(`✅ Email sent successfully to ${emailRecord.recipient_email}`)

    return new Response(
      JSON.stringify({
        success: true,
        resend_email_id: resendData.id,
        recipient: emailRecord.recipient_email,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
