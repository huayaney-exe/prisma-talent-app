/**
 * Position Service - Business logic for position management
 */
import { supabase } from '@/lib/supabase'
import { api, getErrorMessage } from '@/lib/api'
import type { HRFormData, BusinessFormData, Position, PositionPublic } from '@/types'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build job description from template using HR form data
 * Template-based approach (no AI needed for MVP)
 */
function buildJobDescriptionTemplate(data: {
  company_name: string
  position_name: string
  area: string
  seniority: string
  contract_type: string
  salary_range: string
  equity_included: boolean
  equity_details?: string
  position_type: string
  timeline: string
  critical_notes?: string
}): string {
  const equitySection = data.equity_included
    ? `\n- **Equity:** ${data.equity_details || 'Incluido'}`
    : ''

  const criticalNotesSection = data.critical_notes
    ? `\n## Notas Importantes\n${data.critical_notes}\n`
    : ''

  const positionTypeLabel = data.position_type === 'Nueva posición'
    ? 'Nueva posición (expansión del equipo)'
    : 'Reemplazo de salida'

  return `# ${data.position_name}

## Acerca de la Posición
${data.company_name} está buscando un ${data.seniority} ${data.position_name} para unirse a nuestro equipo de ${data.area}.

## Información Básica
- **Nivel:** ${data.seniority}
- **Área:** ${data.area}
- **Tipo de Contrato:** ${data.contract_type}
- **Compensación:** ${data.salary_range}${equitySection}
- **Tipo de Apertura:** ${positionTypeLabel}
- **Inicio Esperado:** ${data.timeline}
${criticalNotesSection}
## Próximos Pasos
El Business Leader completará las especificaciones técnicas, contexto del equipo, y responsabilidades clave para finalizar esta descripción.

---
*Esta es una versión preliminar generada automáticamente. Será enriquecida cuando el Business Leader complete sus especificaciones.*
`
}

/**
 * Generate initial job description from HR form data
 * Uses template-based approach (no AI needed)
 */
async function generateInitialJobDescription(position: Position): Promise<void> {
  try {
    console.log('[PositionService] 📝 Starting job description generation for position:', position.id)

    // Get company name
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('company_name')
      .eq('id', position.company_id)
      .single()

    if (companyError) {
      console.error('[PositionService] ❌ Failed to fetch company:', companyError)
      throw new Error(`Failed to fetch company: ${companyError.message}`)
    }

    if (!company) {
      console.error('[PositionService] ❌ Company not found for id:', position.company_id)
      throw new Error('Company not found')
    }

    console.log('[PositionService] ✅ Company found:', company.company_name)

    // Build job description from template
    const jobDescriptionContent = buildJobDescriptionTemplate({
      company_name: company.company_name,
      position_name: position.position_name,
      area: position.area,
      seniority: position.seniority,
      contract_type: position.contract_type,
      salary_range: position.salary_range,
      equity_included: position.equity_included,
      equity_details: position.equity_details || undefined,
      position_type: position.position_type,
      timeline: position.timeline,
      critical_notes: position.critical_notes || undefined,
    })

    console.log('[PositionService] ✅ Job description template built, length:', jobDescriptionContent.length)

    // Insert into job_descriptions table
    const insertPayload = {
      company_id: position.company_id,
      position_id: position.id,
      generated_content: jobDescriptionContent,
      generation_prompt: 'Template-based from HR form data',
      generation_model: 'template-v1',
      version_number: 1,
      is_current_version: true,
      created_by: position.created_by,
    }

    console.log('[PositionService] 🔄 Attempting to insert job description with payload:', {
      company_id: insertPayload.company_id,
      position_id: insertPayload.position_id,
      created_by: insertPayload.created_by,
      content_length: insertPayload.generated_content.length,
    })

    const { data: insertedJD, error } = await supabase
      .from('job_descriptions')
      .insert(insertPayload)
      .select()

    if (error) {
      console.error('[PositionService] ❌ ❌ ❌ FAILED to create job description ❌ ❌ ❌')
      console.error('[PositionService] Error code:', error.code)
      console.error('[PositionService] Error message:', error.message)
      console.error('[PositionService] Error details:', error.details)
      console.error('[PositionService] Error hint:', error.hint)
      console.error('[PositionService] Full error object:', JSON.stringify(error, null, 2))

      // Log RLS-specific debugging info
      console.error('[PositionService] 🔍 RLS Debugging Info:')
      console.error('  - Position ID:', position.id)
      console.error('  - Company ID:', position.company_id)
      console.error('  - Created by:', position.created_by)

      // Get current user auth info
      const { data: { session } } = await supabase.auth.getSession()
      console.error('  - Current auth.uid():', session?.user?.id)
      console.error('  - Current user email:', session?.user?.email)

      // Don't throw - job description generation is secondary to position creation
      // But make the error VERY visible
      alert(`⚠️ Position created but job description failed!\n\nError: ${error.message}\n\nCode: ${error.code}\n\nCheck browser console for full details.`)
    } else {
      console.log('[PositionService] ✅ ✅ ✅ Job description created successfully! ✅ ✅ ✅')
      console.log('[PositionService] Inserted JD ID:', insertedJD?.[0]?.id || 'N/A')
    }
  } catch (error) {
    console.error('[PositionService] ❌ ❌ ❌ EXCEPTION during job description generation ❌ ❌ ❌')
    console.error('[PositionService] Exception type:', error instanceof Error ? 'Error' : typeof error)
    console.error('[PositionService] Exception:', error)

    // Make exception visible
    const errorMessage = error instanceof Error ? error.message : String(error)
    alert(`⚠️ Position created but job description threw exception!\n\nError: ${errorMessage}\n\nCheck browser console for full details.`)
  }
}

// ============================================================================
// SERVICE OBJECT
// ============================================================================

export const positionService = {
  // ============================================================================
  // PUBLIC METHODS (Direct Supabase)
  // ============================================================================

  /**
   * Create position (HR Form submission) - Direct Supabase integration
   *
   * Handles both authenticated clients and public form submissions:
   * - Authenticated: created_by = hr_user.id
   * - Public: created_by = NULL
   *
   * Two-step workflow:
   * 1. INSERT as 'hr_draft'
   * 2. UPDATE to 'hr_completed' (triggers email notification)
   * 3. Auto-generate initial job description from HR data
   */
  async createPosition(data: HRFormData, companyId?: string): Promise<Position> {
    try {
      // 1. Get current auth session (may be null for public forms)
      const { data: { session } } = await supabase.auth.getSession()

      // 2. Determine company_id
      let finalCompanyId = companyId

      if (!finalCompanyId && session?.user) {
        // Authenticated user - get their company
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('primary_contact_auth_id', session.user.id)
          .maybeSingle()

        if (company) {
          finalCompanyId = company.id
        }
      }

      if (!finalCompanyId) {
        throw new Error('Company ID is required. Please log in or contact support.')
      }

      // 3. Get hr_user_id for created_by
      let createdBy: string | null = null

      if (session?.user) {
        // Authenticated: Find hr_user record
        const { data: hrUser } = await supabase
          .from('hr_users')
          .select('id')
          .eq('company_id', finalCompanyId)
          .eq('email', session.user.email)
          .maybeSingle()

        createdBy = hrUser?.id || null
      }

      // 4. Generate position code
      const positionCode = `${data.area.substring(0, 3).toUpperCase()}-${Date.now()}`

      // 5. INSERT position as 'hr_completed' (single-step, no draft needed)
      const { data: position, error: insertError } = await supabase
        .from('positions')
        .insert({
          company_id: finalCompanyId,
          position_name: data.position_name,
          position_code: positionCode,
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
          workflow_stage: 'hr_completed', // Start as completed (HR part done)
          hr_completed_at: new Date().toISOString(),
          created_by: createdBy,
        })
        .select()
        .single()

      if (insertError) throw insertError

      console.log('[PositionService] ✅ Position created:', position.id)

      // 6. Generate initial job description from HR data (template-based, no AI)
      await generateInitialJobDescription(position as Position)

      // 7. Send email notification to business leader via Edge Function
      console.log('[PositionService] 📧 Sending email notification via Edge Function')
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-position-email', {
        body: {
          position_id: position.id,
          company_id: finalCompanyId,
        }
      })

      if (emailError) {
        console.error('[PositionService] ⚠️ Email notification failed:', emailError)
        // Don't throw - position was created successfully, email failure is non-critical
        // User will see warning in console but position creation succeeds
      } else if (emailResult?.success) {
        console.log('[PositionService] ✅ Email notification sent:', emailResult.message)
        // Update position to 'leader_notified' status
        await supabase
          .from('positions')
          .update({ workflow_stage: 'leader_notified' })
          .eq('id', position.id)
      } else {
        console.error('[PositionService] ⚠️ Email notification failed:', emailResult?.error)
      }

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
   * Get position by code (for business user form) - Direct Supabase integration
   */
  async getPositionByCode(positionCode: string): Promise<Position> {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select(`
          *,
          companies:company_id (
            company_name,
            primary_contact_name,
            primary_contact_email
          )
        `)
        .eq('position_code', positionCode)
        .single()

      if (error) throw error
      if (!data) throw new Error('Position not found')

      return data as Position
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

  /**
   * Get position by ID with full details (admin only)
   */
  async getPositionById(positionId: string) {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select(`
          *,
          companies:company_id (
            company_name,
            primary_contact_name,
            primary_contact_email
          )
        `)
        .eq('id', positionId)
        .single()

      if (error) throw error
      if (!data) throw new Error('Position not found')

      return data
    } catch (error) {
      console.error('[PositionService] Get position by ID failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },
}
