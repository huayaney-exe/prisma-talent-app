/**
 * Applicant Service - Business logic for applicant management
 */
import { supabase } from '@/lib/supabase'
import { api, getErrorMessage } from '@/lib/api'
import { uploadService } from './uploadService'
import type { ApplicantFormData } from '@/types'

export const applicantService = {
  // ============================================================================
  // PUBLIC METHODS (Direct Supabase)
  // ============================================================================

  /**
   * Submit application (ApplicationForm) - Direct Supabase integration
   */
  async submitApplication(
    positionCode: string,
    data: ApplicantFormData,
    resumeFile?: File,
    portfolioFiles?: File[]
  ): Promise<{ id: string; message: string }> {
    try {
      // Get position by code
      const { data: position } = await supabase
        .from('positions')
        .select('id, company_id')
        .eq('position_code', positionCode)
        .single()

      if (!position) {
        throw new Error('Posición no encontrada')
      }

      // Create applicant record first
      const { data: applicant, error: insertError } = await supabase
        .from('applicants')
        .insert({
          company_id: position.company_id,
          position_id: position.id,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          linkedin_url: data.linkedin_url,
          portfolio_url: data.portfolio_url,
          location: data.location,
          cover_letter: data.cover_letter,
          source_type: 'direct_application',
          application_status: 'applied',
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Upload resume if provided
      if (resumeFile) {
        const resumeUrl = await uploadService.uploadCV(resumeFile, applicant.id)

        await supabase
          .from('applicants')
          .update({ resume_url: resumeUrl })
          .eq('id', applicant.id)
      }

      // Upload portfolio files if provided
      if (portfolioFiles && portfolioFiles.length > 0) {
        const portfolioUrls = await uploadService.uploadPortfolioFiles(
          portfolioFiles,
          applicant.id
        )

        await supabase
          .from('applicants')
          .update({ portfolio_files: portfolioUrls })
          .eq('id', applicant.id)
      }

      return {
        id: applicant.id,
        message: 'Aplicación enviada exitosamente',
      }
    } catch (error) {
      console.error('[ApplicantService] Submit application failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  /**
   * Get all applicants (admin only)
   */
  async getAllApplicants(positionCode?: string, qualificationStatus?: string) {
    try {
      // Build query with nested join for company_name
      let query = supabase
        .from('applicants')
        .select(`
          *,
          positions!inner(
            position_code,
            position_name,
            company_id,
            companies(company_name)
          )
        `)
        .order('created_at', { ascending: false })

      // Filter by position code (resolve to position_id first)
      if (positionCode) {
        // Get position ID from code
        const { data: position, error: posError } = await supabase
          .from('positions')
          .select('id')
          .eq('position_code', positionCode)
          .maybeSingle()

        if (posError) {
          console.error('[ApplicantService] Failed to find position:', posError)
          return []
        }

        if (!position) {
          console.warn(`[ApplicantService] Position with code ${positionCode} not found`)
          return []
        }

        // Filter by position_id
        query = query.eq('position_id', position.id)
      }

      // Filter by qualification status
      if (qualificationStatus && qualificationStatus !== 'all') {
        query = query.eq('qualification_status', qualificationStatus)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[ApplicantService] Get all applicants failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Qualify applicant (admin only)
   */
  async qualifyApplicant(applicantId: string, score: number, notes?: string) {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .update({
          qualification_status: 'qualified',
          score,
          evaluation_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicantId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[ApplicantService] Qualify applicant failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Reject applicant (admin only)
   */
  async rejectApplicant(applicantId: string, notes?: string) {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .update({
          qualification_status: 'rejected',
          evaluation_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicantId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[ApplicantService] Reject applicant failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Get qualified applicants for shortlist (admin only)
   */
  async getQualifiedApplicants(positionCode: string) {
    try {
      // Step 1: Get position ID from code
      const { data: position, error: posError } = await supabase
        .from('positions')
        .select('id')
        .eq('position_code', positionCode)
        .single()

      if (posError) throw posError
      if (!position) throw new Error(`Position with code ${positionCode} not found`)

      // Step 2: Query applicants by position_id with nested join
      const { data, error } = await supabase
        .from('applicants')
        .select(`
          *,
          positions!inner(
            position_code,
            position_name,
            companies(company_name)
          )
        `)
        .eq('position_id', position.id)
        .eq('qualification_status', 'qualified')
        .order('score', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[ApplicantService] Get qualified applicants failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },
}
