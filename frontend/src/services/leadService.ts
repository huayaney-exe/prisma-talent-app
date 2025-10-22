/**
 * Lead Service - Business logic for lead management
 */
import { supabase } from '@/lib/supabase'
import { api, getErrorMessage } from '@/lib/api'
import type { Lead, LeadResponse } from '@/types'

export const leadService = {
  // ============================================================================
  // PUBLIC METHODS (Direct Supabase)
  // ============================================================================

  /**
   * Submit lead form - Direct Supabase integration
   */
  async submitLead(data: Lead): Promise<{ id: string; message: string }> {
    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          contact_name: data.contact_name,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          contact_position: data.contact_position,
          company_name: data.company_name,
          industry: data.industry,
          company_size: data.company_size,
          intent: data.intent,
          role_title: data.role_title,
          role_type: data.role_type,
          seniority: data.seniority,
          work_mode: data.work_mode,
          urgency: data.urgency,
          status: 'pending', // Default status
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: lead.id,
        message: 'Lead submitted successfully'
      }
    } catch (error) {
      console.error('[LeadService] Submit lead failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Validate lead email (check if already exists)
   */
  async validateEmail(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id')
        .eq('contact_email', email)
        .maybeSingle()

      if (error) throw error

      // Return true if email does NOT exist (is valid/available)
      return !data
    } catch (error) {
      console.error('[LeadService] Email validation failed:', error)
      return true // Assume valid on error
    }
  },

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  /**
   * Get all leads (admin only)
   */
  async getAllLeads(status?: 'pending' | 'approved' | 'rejected') {
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error('[LeadService] Get all leads failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Get lead by ID (admin only)
   */
  async getLeadById(leadId: string) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[LeadService] Get lead by ID failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Approve lead (admin only)
   */
  async approveLead(leadId: string) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[LeadService] Approve lead failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Reject lead (admin only)
   */
  async rejectLead(leadId: string) {
    try {
      const { data, error} = await supabase
        .from('leads')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[LeadService] Reject lead failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Convert lead to client (admin only)
   * Creates company via backend API, sends magic link invitation to client
   */
  async convertLeadToClient(leadId: string) {
    try {
      // 1. Get lead data
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (leadError) throw leadError
      if (!lead) throw new Error('Lead not found')

      // 2. Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      // 3. Extract domain from email
      const domain = lead.contact_email.split('@')[1] || ''

      // 4. Call backend API to create company and send invitation
      // Backend handles company creation, HR user creation, and auth invitation
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/clients/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: lead.contact_email,
          company_name: lead.company_name,
          company_domain: domain,
          full_name: lead.contact_name,
          contact_phone: lead.contact_phone,
          contact_position: lead.contact_position,
          industry: lead.industry,
          company_size: lead.company_size,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || 'Failed to create client account')
      }

      const result = await response.json()

      // 5. Update lead status to approved
      await this.approveLead(leadId)

      return {
        message: result.message || 'Client account created and invitation email sent',
      }
    } catch (error) {
      console.error('[LeadService] Convert lead to client failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },
}
