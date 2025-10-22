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
   * Workflow:
   * 1. Call backend API to validate and create company + HR user
   * 2. Backend sends magic link invitation via service_role_key
   * 3. Return success response
   *
   * @param data - Client creation data
   * @returns Created company and user records
   */
  async createClient(data: CreateClientData): Promise<ClientResponse> {
    try {
      console.log('[ClientService] Starting client creation for:', data.company_name)

      // 1. Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      // 2. Call backend API to create company and send invitation
      // Backend handles all validation, company creation, HR user creation, and auth invitation
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/clients/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: data.primary_contact_email,
          company_name: data.company_name,
          company_domain: data.company_domain,
          full_name: data.primary_contact_name,
          contact_phone: data.primary_contact_phone,
          contact_position: data.primary_contact_position,
          industry: data.industry,
          company_size: data.company_size,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || 'Failed to create client account')
      }

      const result = await response.json()

      console.log('[ClientService] Client created successfully:', result)

      return {
        company: { id: result.auth_user_id }, // Backend doesn't return full company object yet
        message: result.message || `✅ Cliente creado exitosamente! Email de invitación enviado a ${data.primary_contact_email}`,
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
