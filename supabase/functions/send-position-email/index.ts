/**
 * Supabase Edge Function: Send Position Email
 *
 * Sends email notification to business leader when position is ready for their input.
 * Uses Resend API to send emails.
 * Follows same pattern as invite-client Edge Function.
 *
 * Usage: POST /functions/v1/send-position-email
 * Body: { position_id: "uuid", company_id: "uuid" }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendEmailRequest {
  position_id: string
  company_id: string
}

interface Position {
  id: string
  position_name: string
  position_code: string
  company_id: string
}

interface Company {
  id: string
  company_name: string
  business_leader_email: string
  business_leader_name: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { position_id, company_id }: SendEmailRequest = await req.json()

    // Validate required fields
    if (!position_id || !company_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: position_id and company_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client (has service_role_key from environment)
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

    // Fetch position details
    const { data: position, error: positionError } = await supabaseAdmin
      .from('positions')
      .select('id, position_name, position_code, company_id')
      .eq('id', position_id)
      .single<Position>()

    if (positionError || !position) {
      console.error('Position not found:', positionError)
      return new Response(
        JSON.stringify({ error: 'Position not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch company details
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, company_name, business_leader_email, business_leader_name')
      .eq('id', company_id)
      .single<Company>()

    if (companyError || !company) {
      console.error('Company not found:', companyError)
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Frontend URL from environment or default
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://talent-platform.vercel.app'
    const formUrl = `${frontendUrl}/business-leader/positions/${position.id}`

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

    // Build email body
    const emailBody = `Hola ${company.business_leader_name},

El equipo de HR ha iniciado el proceso de apertura para la siguiente posición en ${company.company_name}:

Posición: ${position.position_name}
Código: ${position.position_code}

Tu input es necesario para continuar.

Por favor completa las especificaciones técnicas y contexto del equipo:
${formUrl}

El formulario toma aproximadamente 10 minutos en completarse.

Saludos,
Prisma Talent
Community-driven talent acquisition`

    const subjectLine = `Acción Requerida: Nueva Posición ${position.position_name} en ${company.company_name}`

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Prisma Talent <noreply@luishuayaney.com>',
        to: company.business_leader_email,
        subject: subjectLine,
        text: emailBody,
        reply_to: 'luis@luishuayaney.com',
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)

      // Track failed email in database
      await supabaseAdmin
        .from('email_communications')
        .insert({
          company_id: company.id,
          position_id: position.id,
          email_type: 'leader_form_request',
          recipient_email: company.business_leader_email,
          recipient_name: company.business_leader_name,
          subject_line: subjectLine,
          email_content: emailBody,
          template_data: {
            leader_name: company.business_leader_name,
            company_name: company.company_name,
            position_name: position.position_name,
            position_code: position.position_code,
            form_url: formUrl,
          },
          status: 'failed',
          last_error: `HTTP ${resendResponse.status}: ${JSON.stringify(resendData)}`,
        })

      return new Response(
        JSON.stringify({ error: `Resend API error: ${resendData.message || 'Unknown error'}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Track successful email in database
    await supabaseAdmin
      .from('email_communications')
      .insert({
        company_id: company.id,
        position_id: position.id,
        email_type: 'leader_form_request',
        recipient_email: company.business_leader_email,
        recipient_name: company.business_leader_name,
        subject_line: subjectLine,
        email_content: emailBody,
        template_data: {
          leader_name: company.business_leader_name,
          company_name: company.company_name,
          position_name: position.position_name,
          position_code: position.position_code,
          form_url: formUrl,
        },
        sent_at: new Date().toISOString(),
        status: 'sent',
        resend_email_id: resendData.id,
      })

    console.log(`✅ Email sent successfully to ${company.business_leader_email}`)

    return new Response(
      JSON.stringify({
        success: true,
        resend_email_id: resendData.id,
        recipient: company.business_leader_email,
        message: `Email sent successfully to ${company.business_leader_name}`,
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
