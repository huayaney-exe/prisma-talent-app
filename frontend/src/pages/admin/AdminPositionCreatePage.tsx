/**
 * Admin Position Create Page - Create positions on behalf of any company
 * Allows Prisma admins to initiate position workflows for clients
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { hrFormSchema } from '@/lib/validation'
import { positionService } from '@/services/positionService'
import { Input, Select, Button, Card, Textarea } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { HRFormData, Area, Seniority, ContractType, PositionType } from '@/types'

// ============================================================================
// CONSTANTS
// ============================================================================

const AREA_OPTIONS = [
  { value: '', label: 'Selecciona área', disabled: true },
  { value: 'Product Management', label: 'Product Management' },
  { value: 'Engineering-Tech', label: 'Engineering & Tech' },
  { value: 'Growth', label: 'Growth' },
  { value: 'Design', label: 'Design' },
]

const SENIORITY_OPTIONS = [
  { value: '', label: 'Selecciona seniority', disabled: true },
  { value: 'Mid-level 3-5 años', label: 'Mid-Level (3-5 años)' },
  { value: 'Senior 5-8 años', label: 'Senior (5-8 años)' },
  { value: 'Lead-Staff 8+ años', label: 'Lead/Staff (8+ años)' },
  { value: 'Director+ 10+ años', label: 'Director+ (10+ años)' },
]

const CONTRACT_TYPE_OPTIONS = [
  { value: '', label: 'Selecciona tipo', disabled: true },
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'contract', label: 'Contrato' },
]

const POSITION_TYPE_OPTIONS = [
  { value: '', label: 'Selecciona tipo', disabled: true },
  { value: 'new', label: 'Nueva posición (expansión)' },
  { value: 'replacement', label: 'Reemplazo de salida' },
]

// ============================================================================
// TYPES
// ============================================================================

interface Company {
  id: string
  company_name: string
  company_domain: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminPositionCreatePage() {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [company, setCompany] = useState<Company | null>(null)
  const [isLoadingCompany, setIsLoadingCompany] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [positionCode, setPositionCode] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<HRFormData>({
    resolver: zodResolver(hrFormSchema),
    defaultValues: {
      area: '' as Area,
      seniority: '' as Seniority,
      contract_type: '' as ContractType,
      position_type: '' as PositionType,
      equity_included: false,
    },
  })

  const equityIncluded = watch('equity_included')

  // Load company data
  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) {
        setIsLoadingCompany(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, company_name, company_domain')
          .eq('id', companyId)
          .single()

        if (error) throw error
        setCompany(data)
      } catch (error) {
        console.error('Failed to load company:', error)
        setApiError('No se pudo cargar la información de la empresa')
      } finally {
        setIsLoadingCompany(false)
      }
    }

    loadCompany()
  }, [companyId])

  const onSubmit = async (data: HRFormData) => {
    if (!companyId) {
      setApiError('Company ID is required')
      return
    }

    setIsSubmitting(true)
    setApiError(null)

    try {
      console.log('[AdminPositionCreate] Creating position for company:', companyId)
      const position = await positionService.createPosition(data, companyId)
      console.log('[AdminPositionCreate] Position created:', position)

      setPositionCode(position.position_code)
      setShowSuccess(true)
      reset()

      // Redirect to position detail after 2 seconds
      setTimeout(() => {
        navigate(`/admin/positions/${position.id}`)
      }, 2000)
    } catch (error: any) {
      console.error('[AdminPositionCreate] Submit error:', error)
      setApiError(error.message || 'Error al crear la posición')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin/clients')
  }

  if (isLoadingCompany) {
    return (
      <div className="min-h-screen bg-prisma-section flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando información de la empresa...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-prisma-section flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-black mb-2">Empresa no encontrada</h2>
          <p className="text-gray-600 mb-6">No se pudo cargar la información de la empresa.</p>
          <Button onClick={() => navigate('/admin/clients')}>
            Volver a Clientes
          </Button>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // SUCCESS STATE
  // ============================================================================

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-prisma-section flex items-center justify-center">
        <Card className="p-12 max-w-md text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-black mb-2">¡Posición Creada!</h2>
          <p className="text-gray-600 mb-4">
            La posición ha sido creada exitosamente para {company.company_name}
          </p>
          <div className="bg-purple/10 border-2 border-purple rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Código de Posición:</p>
            <p className="text-xl font-mono font-bold text-purple">{positionCode}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Redirigiendo al detalle de la posición...
          </p>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // FORM STATE
  // ============================================================================

  return (
    <div className="min-h-screen bg-prisma-section">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <a href="/" className="hover:opacity-80 transition-opacity">
                <img src="/assets/logo-4wtbg.svg" alt="Prisma" className="h-10 w-auto" />
              </a>
              <span className="text-2xl text-gray-400">|</span>
              <span className="text-lg font-semibold text-purple">
                Crear Posición - Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Admin</p>
                <p className="font-medium text-gray-700">{user?.email}</p>
              </div>
              <Button onClick={handleCancel} variant="secondary" size="sm">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Company Info Banner */}
        <Card className="p-6 mb-8 bg-purple/5 border-2 border-purple">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">🏢</div>
            <div>
              <h2 className="text-xl font-bold text-black">
                Creando posición para: {company.company_name}
              </h2>
              <p className="text-sm text-gray-600">{company.company_domain}</p>
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {apiError && (
          <Card className="p-4 mb-6 bg-red-50 border-2 border-red-500">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            </div>
          </Card>
        )}

        {/* HR Form */}
        <Card className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">
              Formulario HR Partner
            </h1>
            <p className="text-gray-600">
              Completa la información básica de la posición
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Position Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Posición *
              </label>
              <Input
                {...register('position_name')}
                placeholder="ej: Senior Product Manager"
                error={errors.position_name?.message}
              />
            </div>

            {/* Area & Seniority */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área *
                </label>
                <Select
                  {...register('area')}
                  options={AREA_OPTIONS}
                  error={errors.area?.message}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seniority *
                </label>
                <Select
                  {...register('seniority')}
                  options={SENIORITY_OPTIONS}
                  error={errors.seniority?.message}
                />
              </div>
            </div>

            {/* Business Leader Info */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-900">
                Información del Business Leader
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Business Leader *
                </label>
                <Input
                  {...register('business_user_name')}
                  placeholder="ej: Juan Pérez"
                  error={errors.business_user_name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo del Business Leader *
                </label>
                <Input
                  {...register('business_user_position')}
                  placeholder="ej: VP of Product"
                  error={errors.business_user_position?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email del Business Leader *
                </label>
                <Input
                  {...register('business_user_email')}
                  type="email"
                  placeholder="email@empresa.com"
                  error={errors.business_user_email?.message}
                />
              </div>
            </div>

            {/* Salary & Equity */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rango Salarial *
                </label>
                <Input
                  {...register('salary_range')}
                  placeholder="ej: $80k - $120k USD"
                  error={errors.salary_range?.message}
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  {...register('equity_included')}
                  type="checkbox"
                  className="w-5 h-5 text-purple border-gray-300 rounded focus:ring-purple"
                />
                <label className="text-sm font-medium text-gray-700">
                  ¿Incluye equity?
                </label>
              </div>

              {equityIncluded && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalles de Equity
                  </label>
                  <Textarea
                    {...register('equity_details')}
                    placeholder="ej: 0.5% - 1.0% con 4 años vesting"
                    rows={3}
                    error={errors.equity_details?.message}
                  />
                </div>
              )}
            </div>

            {/* Contract & Timeline */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contrato *
                </label>
                <Select
                  {...register('contract_type')}
                  options={CONTRACT_TYPE_OPTIONS}
                  error={errors.contract_type?.message}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Objetivo de Contratación *
                </label>
                <Input
                  {...register('target_fill_date')}
                  type="date"
                  error={errors.target_fill_date?.message}
                />
              </div>
            </div>

            {/* Position Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Posición *
              </label>
              <Select
                {...register('position_type')}
                options={POSITION_TYPE_OPTIONS}
                error={errors.position_type?.message}
              />
            </div>

            {/* Critical Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Críticas (opcional)
              </label>
              <Textarea
                {...register('critical_notes')}
                placeholder="Información adicional importante sobre la posición..."
                rows={4}
                error={errors.critical_notes?.message}
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                fullWidth
              >
                {isSubmitting ? 'Creando Posición...' : 'Crear Posición'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                fullWidth
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
