/**
 * Position Service - Business logic for position management
 */
import { supabase } from '@/lib/supabase'
import { api, getErrorMessage } from '@/lib/api'
import type { HRFormData, BusinessFormData, Position, PositionPublic } from '@/types'

export const positionService = {
  // ============================================================================
  // PUBLIC METHODS (Direct Supabase)
  // ============================================================================

  /**
   * Create position (HR Form submission) - Direct Supabase integration
   */
  async createPosition(data: HRFormData): Promise<Position> {
    try {
      // Get company_id from first company (will be replaced with auth context)
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()

      if (!company) {
        throw new Error('No company found. Please ensure company exists in database.')
      }

      const { data: position, error } = await supabase
        .from('positions')
        .insert({
          company_id: company.id,
          position_name: data.position_name,
          area: data.area,
          seniority: data.seniority,
          leader_name: data.business_user_name,
          leader_position: data.business_user_position,
          leader_email: data.business_user_email,
          salary_range: data.salary_range,
          equity_included: data.equity_included,
          equity_details: data.equity_details,
          contract_type: data.contract_type,
          timeline: data.target_fill_date,
          position_type: data.position_type,
          critical_notes: data.critical_notes,
          workflow_stage: 'hr_completed',
          hr_completed_at: new Date().toISOString(),
          // Will be replaced with auth.uid()
          created_by: '00000000-0000-0000-0000-000000000000',
        })
        .select()
        .single()

      if (error) throw error

      return position as Position
    } catch (error) {
      console.error('[PositionService] Create position failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Update position with business specifications - Direct Supabase integration
   */
  async updateBusinessSpecs(
    positionCode: string,
    data: BusinessFormData
  ): Promise<Position> {
    try {
      const { data: position, error } = await supabase
        .from('positions')
        .update({
          work_arrangement: data.work_arrangement,
          core_hours: data.core_hours,
          meeting_culture: data.meeting_culture,
          team_size: data.team_size,
          autonomy_level: data.autonomy_level,
          mentoring_required: data.mentoring_required,
          hands_on_vs_strategic: data.execution_level,
          success_kpi: data.success_kpi,
          area_specific_data: data.area_specific_data,
          workflow_stage: 'leader_completed',
          leader_completed_at: new Date().toISOString(),
        })
        .eq('position_code', positionCode)
        .select()
        .single()

      if (error) throw error

      return position as Position
    } catch (error) {
      console.error('[PositionService] Update business specs failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Get position by code (for business user form)
   */
  async getPositionByCode(positionCode: string): Promise<Position> {
    try {
      const response = await api.get<Position>(`/positions/code/${positionCode}`)
      return response.data
    } catch (error) {
      console.error('[PositionService] Get position by code failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Get public position (for job page)
   */
  async getPublicPosition(positionCode: string): Promise<PositionPublic> {
    try {
      const response = await api.get<PositionPublic>(
        `/positions/public/${positionCode}`
      )
      return response.data
    } catch (error) {
      console.error('[PositionService] Get public position failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * List positions for HR user
   */
  async listPositions(filters?: {
    workflow_stage?: string
    area?: string
  }): Promise<Position[]> {
    try {
      const response = await api.get<Position[]>('/positions', {
        params: filters,
      })
      return response.data
    } catch (error) {
      console.error('[PositionService] List positions failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  /**
   * Get all positions (admin only)
   */
  async getAllPositions(workflowStage?: string) {
    try {
      let query = supabase
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false })

      if (workflowStage && workflowStage !== 'all') {
        query = query.eq('workflow_stage', workflowStage)
      }

      const { data, error} = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error('[PositionService] Get all positions failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Update job description (admin only)
   */
  async updateJobDescription(positionCode: string, jobDescription: string) {
    try {
      const { data, error } = await supabase
        .from('positions')
        .update({
          job_description: jobDescription,
          updated_at: new Date().toISOString()
        })
        .eq('position_code', positionCode)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[PositionService] Update job description failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Update position workflow stage (admin only)
   */
  async updateWorkflowStage(positionId: string, workflowStage: string) {
    try {
      const { data, error } = await supabase
        .from('positions')
        .update({
          workflow_stage: workflowStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', positionId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[PositionService] Update workflow stage failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },
}
