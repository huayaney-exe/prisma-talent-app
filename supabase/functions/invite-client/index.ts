/**
 * Supabase Edge Function: Invite Client
 *
 * Sends magic link invitation to new client using service_role_key.
 * Deployed on Supabase infrastructure - no separate backend needed!
 *
 * Usage: POST /functions/v1/invite-client
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  email: string
  company_id: string
  company_name: string
  hr_user_id: string
  full_name: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { email, company_id, company_name, hr_user_id, full_name }: InviteRequest = await req.json()

    // Validate required fields
    if (!email || !company_id || !hr_user_id || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Frontend URL from environment or default
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'
    const redirectUrl = `${frontendUrl}/client/dashboard`

    // Send magic link invitation via Supabase Admin Auth
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          company_id,
          company_name,
          hr_user_id,
          full_name,
          role: 'client',
        },
        redirectTo: redirectUrl,
      }
    )

    if (inviteError) {
      console.error('Invitation failed:', inviteError)
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update company with auth_user_id
    if (authData?.user?.id) {
      await supabaseAdmin
        .from('companies')
        .update({ primary_contact_auth_id: authData.user.id })
        .eq('id', company_id)
    }

    // Track email in database
    await supabaseAdmin
      .from('email_communications')
      .insert({
        company_id,
        email_type: 'client_invitation',
        recipient_email: email,
        recipient_name: full_name,
        subject_line: 'Bienvenido a Prisma Talent - Acceso a tu Portal',
        email_content: 'Magic link invitation sent by Supabase Auth',
        template_data: {
          client_name: full_name,
          company_name: company_name,
          magic_link: redirectUrl
        },
        sent_at: new Date().toISOString(),
        status: 'sent'
      })

    return new Response(
      JSON.stringify({
        success: true,
        auth_user_id: authData?.user?.id,
        message: `Invitation sent successfully to ${email}`,
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
