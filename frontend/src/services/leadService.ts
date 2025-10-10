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
      const { data, error } = await supabase
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
}
