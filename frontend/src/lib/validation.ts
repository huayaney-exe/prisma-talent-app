/**
 * Validation Schemas - Zod schemas for all forms
 * Production-grade validation with Spanish error messages
 */
import { z } from 'zod'

// ============================================================================
// LEAD FORM VALIDATION
// ============================================================================

export const leadSchema = z
  .object({
    contact_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    contact_email: z.string().email('Email inválido'),
    contact_phone: z.string().min(5, 'Teléfono requerido'),
    contact_position: z.string().min(2, 'Posición requerida'),
    company_name: z.string().min(2, 'Nombre de empresa requerido'),
    industry: z.string().optional(),
    company_size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
    intent: z.enum(['hiring', 'conversation']),
    role_title: z.string().optional(),
    role_type: z.string().optional(),
    seniority: z.string().optional(),
    work_mode: z.enum(['remote', 'hybrid', 'onsite']).optional(),
    urgency: z.enum(['immediate', '1-2-weeks', '1-month+', 'not-urgent']).optional(),
  })
  .refine(
    (data) => {
      if (data.intent === 'hiring') {
        return !!data.role_title && !!data.role_type && !!data.seniority
      }
      return true
    },
    {
      message: 'Título del rol, tipo y seniority son requeridos cuando el intento es contratar',
      path: ['role_title'],
    }
  )

// ============================================================================
// HR FORM VALIDATION
// ============================================================================

export const hrFormSchema = z.object({
  position_name: z.string().min(2, 'Nombre de posición requerido'),
  area: z.enum(['Product Management', 'Engineering-Tech', 'Growth', 'Design']),
  seniority: z.enum(['Mid-level 3-5 años', 'Senior 5-8 años', 'Lead-Staff 8+ años', 'Director+ 10+ años']),
  business_user_name: z.string().min(2, 'Nombre del líder requerido'),
  business_user_position: z.string().min(2, 'Posición del líder requerida'),
  business_user_email: z.string().email('Email del líder inválido'),
  salary_range: z.string().min(2, 'Rango salarial requerido'),
  equity_included: z.boolean(),
  equity_details: z.string().optional(),
  contract_type: z.enum(['full-time', 'part-time', 'contract']),
  target_fill_date: z.string().min(1, 'Fecha objetivo requerida'),
  position_type: z.enum(['new', 'replacement']),
  critical_notes: z.string().optional(),
})

// ============================================================================
// BUSINESS FORM VALIDATION
// ============================================================================

export const businessFormSchema = z.object({
  // Universal work dynamics
  work_arrangement: z.string().min(1, 'Modalidad de trabajo requerida'),
  core_hours: z.string().min(1, 'Horario requerido'),
  meeting_culture: z.string().min(1, 'Cultura de reuniones requerida'),
  team_size: z.string().min(1, 'Tamaño de equipo requerido'),
  autonomy_level: z.string().min(1, 'Nivel de autonomía requerido'),
  mentoring_required: z.string().min(1, 'Requerimiento de mentoría requerido'),
  execution_level: z.string().min(1, 'Nivel de ejecución requerido'),
  success_kpi: z.string().min(1, 'KPIs de éxito requeridos'),

  // Leader contact
  leader_full_name: z.string().min(2, 'Nombre completo requerido'),
  leader_current_position: z.string().min(2, 'Posición actual requerida'),
  leader_corp_email: z.string().email('Email corporativo inválido'),
})

// ============================================================================
// APPLICANT FORM VALIDATION
// ============================================================================

export const applicantFormSchema = z.object({
  full_name: z.string().min(2, 'Nombre completo requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(5, 'Teléfono requerido'),
  linkedin_url: z
    .string()
    .url('URL de LinkedIn inválida')
    .optional()
    .or(z.literal('')),
  portfolio_url: z
    .string()
    .url('URL de portafolio inválida')
    .optional()
    .or(z.literal('')),
  location: z.string().optional(),
  cover_letter: z
    .string()
    .min(50, 'Carta de presentación debe tener al menos 50 caracteres')
    .max(1000, 'Carta de presentación no debe exceder 1000 caracteres')
    .optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LeadFormData = z.infer<typeof leadSchema>
export type HRFormDataValidation = z.infer<typeof hrFormSchema>
export type BusinessFormDataValidation = z.infer<typeof businessFormSchema>
export type ApplicantFormDataValidation = z.infer<typeof applicantFormSchema>
