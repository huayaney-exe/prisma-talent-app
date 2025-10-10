/**
 * Job Description Service - Business logic for JD management
 */
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/api'

export const jdService = {
  /**
   * Create or update job description (manual entry for now, AI later)
   */
  async createJobDescription(positionId: string, content: string, createdBy: string) {
    try {
      // Check if JD already exists for this position
      const { data: existing } = await supabase
        .from('job_descriptions')
        .select('id')
        .eq('position_id', positionId)
        .eq('is_current_version', true)
        .single()

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('job_descriptions')
          .update({
            generated_content: content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Get company_id from position
        const { data: position } = await supabase
          .from('positions')
          .select('company_id')
          .eq('id', positionId)
          .single()

        if (!position) throw new Error('Position not found')

        // Create new
        const { data, error } = await supabase
          .from('job_descriptions')
          .insert({
            company_id: position.company_id,
            position_id: positionId,
            generated_content: content,
            generation_prompt: 'Manual entry',
            generation_model: 'manual',
            version_number: 1,
            is_current_version: true,
            created_by: createdBy,
          })
          .select()
          .single()

        if (error) throw error

        // Update position workflow stage
        await supabase
          .from('positions')
          .update({ workflow_stage: 'job_desc_generated' })
          .eq('id', positionId)

        return data
      }
    } catch (error) {
      console.error('[JDService] Create JD failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Get job description for position
   */
  async getJobDescription(positionId: string) {
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('position_id', positionId)
        .eq('is_current_version', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      return data
    } catch (error) {
      console.error('[JDService] Get JD failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * HR approves job description
   */
  async approveJD(jdId: string, feedback?: string) {
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .update({
          hr_approved: true,
          hr_approved_at: new Date().toISOString(),
          hr_feedback: feedback || 'Approved',
        })
        .eq('id', jdId)
        .select()
        .single()

      if (error) throw error

      // Update position workflow stage
      await supabase
        .from('positions')
        .update({ workflow_stage: 'validation_pending' })
        .eq('id', data.position_id)

      return data
    } catch (error) {
      console.error('[JDService] Approve JD failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Publish job description (make position active)
   */
  async publishJD(jdId: string) {
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          final_approved_at: new Date().toISOString(),
        })
        .eq('id', jdId)
        .select()
        .single()

      if (error) throw error

      // Trigger will automatically update position to 'active'
      return data
    } catch (error) {
      console.error('[JDService] Publish JD failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },
}
