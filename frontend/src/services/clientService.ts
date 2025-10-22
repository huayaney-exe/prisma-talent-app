/**
 * Client Service - Business logic for client (company) management
 *
 * Handles direct client creation and management operations for admins
 */
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/api'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateClientData {
  // Company Information
  company_name: string
  company_domain: string
  industry?: string
  company_size?: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+'
  website_url?: string
  linkedin_url?: string
  company_description?: string

  // Primary Contact (becomes first HR user)
  primary_contact_name: string
  primary_contact_email: string
  primary_contact_phone?: string
  primary_contact_position?: string

  // Subscription
  subscription_plan?: 'basic' | 'professional' | 'enterprise'
  trial_days?: number
}

export interface ClientResponse {
  company: any
  hr_user?: any
  auth_user?: any
  message: string
}

// ============================================================================
// SERVICE
// ============================================================================

export const clientService = {
  /**
   * Create new business client directly (admin only)
   *
   * Workflow (Pure Supabase - No Backend!):
   * 1. Validate domain uniqueness
   * 2. Create company record (Supabase direct)
   * 3. Create HR user record (Supabase direct)
   * 4. Send magic link via Supabase RPC function (calls Auth Admin API)
   * 5. Return success response
   *
   * @param data - Client creation data
   * @returns Created company and user records
   */
  async createClient(data: CreateClientData): Promise<ClientResponse> {
    try {
      console.log('[ClientService] Starting client creation for:', data.company_name)

      // 1. Validate domain is unique
      const isDomainValid = await this.validateDomain(data.company_domain)
      if (!isDomainValid) {
        throw new Error(`El dominio ${data.company_domain} ya está registrado`)
      }

      // 2. Create company record
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          company_name: data.company_name,
          company_domain: data.company_domain.toLowerCase(),
          industry: data.industry,
          company_size: data.company_size,
          website_url: data.website_url,
          linkedin_url: data.linkedin_url,
          company_description: data.company_description,
          primary_contact_name: data.primary_contact_name,
          primary_contact_email: data.primary_contact_email.toLowerCase(),
          primary_contact_phone: data.primary_contact_phone,
          subscription_status: 'trial',
          subscription_plan: data.subscription_plan || 'basic',
          trial_end_date: new Date(Date.now() + (data.trial_days || 30) * 24 * 60 * 60 * 1000).toISOString(),
          onboarding_completed: false,
        })
        .select()
        .single()

      if (companyError) throw companyError

      console.log('[ClientService] Company created:', company.id)

      // 3. Create HR user (company admin)
      const { data: hrUser, error: hrUserError } = await supabase
        .from('hr_users')
        .insert({
          company_id: company.id,
          email: data.primary_contact_email.toLowerCase(),
          full_name: data.primary_contact_name,
          position_title: data.primary_contact_position,
          phone: data.primary_contact_phone,
          role: 'company_admin',
          is_active: true,
          can_create_positions: true,
          can_manage_team: true,
          can_view_analytics: true,
          created_by: null, // First user, self-created
        })
        .select()
        .single()

      if (hrUserError) {
        // Rollback: Delete company if HR user creation fails
        await supabase.from('companies').delete().eq('id', company.id)
        throw hrUserError
      }

      console.log('[ClientService] HR user created:', hrUser.id)

      // 4. Send magic link invitation via Supabase Edge Function
      // This calls the Edge Function deployed at supabase/functions/invite-client
      const { data: inviteResult, error: inviteError } = await supabase.functions.invoke('invite-client', {
        body: {
          email: data.primary_contact_email.toLowerCase(),
          company_id: company.id,
          company_name: data.company_name,
          hr_user_id: hrUser.id,
          full_name: data.primary_contact_name,
        }
      })

      if (inviteError) {
        console.error('[ClientService] Invitation Edge Function error:', inviteError)
        throw new Error(`Failed to send invitation: ${inviteError.message}`)
      }

      if (!inviteResult?.success) {
        console.error('[ClientService] Invitation failed:', inviteResult)
        throw new Error(inviteResult?.error || 'Failed to send magic link invitation')
      }

      console.log('[ClientService] Client created successfully:', inviteResult)

      return {
        company: company,
        hr_user: hrUser,
        auth_user: { id: inviteResult.auth_user_id },
        message: `✅ Cliente creado exitosamente! Email de invitación enviado a ${data.primary_contact_email}`,
      }
    } catch (error) {
      console.error('[ClientService] Create client failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Get all companies (admin only)
   */
  async getAllCompanies() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          hr_users(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('[ClientService] Get all companies failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Get company by ID (admin only)
   */
  async getCompanyById(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          hr_users(*)
        `)
        .eq('id', companyId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[ClientService] Get company by ID failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Resend magic link invitation to client
   */
  async resendInvitation(companyId: string) {
    try {
      // Get company primary contact
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('primary_contact_email, company_name, id')
        .eq('id', companyId)
        .single()

      if (companyError) throw companyError

      // Get HR user for metadata
      const { data: hrUser, error: hrUserError } = await supabase
        .from('hr_users')
        .select('id, full_name')
        .eq('company_id', companyId)
        .eq('email', company.primary_contact_email)
        .single()

      if (hrUserError) throw hrUserError

      // Resend invitation
      const redirectUrl = `${import.meta.env.VITE_APP_URL}/client/dashboard`

      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        company.primary_contact_email,
        {
          data: {
            company_id: company.id,
            company_name: company.company_name,
            hr_user_id: hrUser.id,
            full_name: hrUser.full_name,
            role: 'client',
          },
          redirectTo: redirectUrl,
        }
      )

      if (inviteError) throw inviteError

      return {
        message: `✅ Invitación reenviada a ${company.primary_contact_email}`,
      }
    } catch (error) {
      console.error('[ClientService] Resend invitation failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Validate company domain is unique
   */
  async validateDomain(domain: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('company_domain', domain)
        .maybeSingle()

      if (error) throw error

      // Return true if domain does NOT exist (is valid/available)
      return !data
    } catch (error) {
      console.error('[ClientService] Domain validation failed:', error)
      return false // Assume invalid on error (conservative)
    }
  },
}
