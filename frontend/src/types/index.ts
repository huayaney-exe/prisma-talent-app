/**
 * TypeScript Type Definitions for Prisma Talent Platform
 * Production-grade type safety across the application
 */

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

export type Intent = 'hiring' | 'conversation'
export type WorkMode = 'remote' | 'hybrid' | 'onsite'
export type Urgency = 'immediate' | '1-2-weeks' | '1-month+' | 'not-urgent'
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-1000' | '1000+'

export type Area = 'Product Management' | 'Engineering-Tech' | 'Growth' | 'Design'
export type Seniority = 'Mid-level 3-5 años' | 'Senior 5-8 años' | 'Lead-Staff 8+ años' | 'Director+ 10+ años'
export type ContractType = 'Tiempo completo' | 'Part-time'
export type PositionType = 'Nueva posición' | 'Reemplazo'

export type WorkflowStage =
  | 'hr_draft'
  | 'hr_completed'
  | 'business_notified'
  | 'business_in_progress'
  | 'business_completed'
  | 'jd_writing'
  | 'jd_draft'
  | 'active'
  | 'shortlisting'
  | 'shortlist_sent'
  | 'interviewing'
  | 'filled'
  | 'cancelled'

// ============================================================================
// LEAD MANAGEMENT
// ============================================================================

export interface Lead {
  contact_name: string
  contact_email: string
  contact_phone: string
  contact_position: string
  company_name: string
  industry?: string
  company_size?: CompanySize
  intent: Intent
  role_title?: string
  role_type?: string
  seniority?: string
  work_mode?: WorkMode
  urgency?: Urgency
}

export interface LeadResponse {
  id: string
  company_id: string
  subscription_status: string
  lead_submitted_at: string
  message: string
}

// ============================================================================
// POSITION MANAGEMENT
// ============================================================================

export interface Position {
  id: string
  company_id: string
  position_code: string
  workflow_stage: WorkflowStage
  position_name: string
  area: Area
  seniority: Seniority
  business_user_name: string
  business_user_position: string
  business_user_email: string
  salary_range: string
  equity_included: boolean
  equity_details?: string
  contract_type: ContractType
  target_fill_date: string
  timeline: string // Database column name (same as target_fill_date)
  position_type: PositionType
  critical_notes?: string
  work_arrangement?: string
  core_hours?: string
  meeting_culture?: string
  team_size?: number
  autonomy_level?: string
  mentoring_required?: boolean
  execution_level?: string
  success_kpi?: string
  area_specific_data?: Record<string, any>
  job_description_content?: string
  created_by?: string | null // hr_user.id who created this position (nullable for public forms)
  created_at: string
  updated_at: string
}

export interface PositionPublic {
  position_code: string
  position_name: string
  area: Area
  seniority: Seniority
  salary_range: string
  work_arrangement?: string
  contract_type: ContractType
  company: {
    company_name: string
    industry?: string
  }
  job_description?: {
    content: string
  }
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface HRFormData {
  position_name: string
  area: Area
  seniority: Seniority
  business_user_name: string
  business_user_position: string
  business_user_email: string
  salary_range: string
  equity_included: boolean
  equity_details?: string
  contract_type: ContractType
  target_fill_date: string
  position_type: PositionType
  critical_notes?: string
}

export interface BusinessFormData {
  work_arrangement: string
  core_hours: string
  meeting_culture: string
  team_size: string
  autonomy_level: string
  mentoring_required: string
  execution_level: string
  success_kpi: string
  leader_full_name: string
  leader_current_position: string
  leader_corp_email: string
  [key: string]: string | number | boolean
}

export interface ApplicantFormData {
  full_name: string
  email: string
  phone: string
  linkedin_url?: string
  portfolio_url?: string
  location?: string
  cover_letter?: string
  // Files handled separately
  resume?: File
  portfolio_files?: File[]
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiError {
  detail: string
  errors?: Array<{
    loc: string[]
    msg: string
    type: string
  }>
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  message?: string
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FieldError {
  message: string
  type: string
}

export interface FormState {
  isSubmitting: boolean
  isSubmitted: boolean
  isValid: boolean
  errors: Record<string, FieldError>
}
