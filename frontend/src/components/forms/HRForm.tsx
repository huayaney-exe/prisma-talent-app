/**
 * HR Form - Create new position requisition
 * First step in the position workflow (HR Draft)
 */
import { useState, useEffect } from 'react'
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
// COMPONENT
// ============================================================================

export function HRForm() {
  const { user, isClient } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [positionCode, setPositionCode] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [clientCompany, setClientCompany] = useState<any>(null)
  const [isLoadingCompany, setIsLoadingCompany] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  // Load client company data if logged in as client
  useEffect(() => {
    const loadClientCompany = async () => {
      if (!user?.id || !isClient) {
        setIsLoadingCompany(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('primary_contact_auth_id', user.id)
          .single()

        if (error) throw error
        setClientCompany(data)
      } catch (error) {
        console.error('Failed to load client company:', error)
      } finally {
        setIsLoadingCompany(false)
      }
    }

    loadClientCompany()
  }, [user?.id, isClient])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const onSubmit = async (data: HRFormData) => {
    setIsSubmitting(true)
    setApiError(null)

    try {
      // Pass client company_id if logged in as client
      const position = await positionService.createPosition(
        data,
        clientCompany?.id
      )
      setPositionCode(position.position_code)
      setShowSuccess(true)
      reset()
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Error al crear la posición')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    setPositionCode(null)
  }

  const copyPositionCode = () => {
    if (positionCode) {
      navigator.clipboard.writeText(positionCode)
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // Show loading state while checking client status
  if (isLoadingCompany) {
    return (
      <Card className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="max-w-3xl mx-auto">
        {/* Client Company Banner */}
        {clientCompany && (
          <div className="mb-6 p-4 bg-purple/10 border border-purple/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🏢</span>
              <div>
                <h3 className="font-semibold text-black mb-1">
                  Creando posición para: {clientCompany.company_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Esta posición se asociará automáticamente a tu empresa.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black mb-2">
            Crear Nueva Posición
          </h2>
          <p className="text-gray-600">
            Completa la información base. El líder del área completará las especificaciones
            técnicas en el siguiente paso.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Position Details */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-black">Detalles de la Posición</h3>

            <Input
              label="Nombre de la posición"
              {...register('position_name')}
              error={errors.position_name?.message}
              required
              placeholder="Ej: Senior Product Manager - Payments"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Área"
                options={AREA_OPTIONS}
                {...register('area')}
                error={errors.area?.message}
                required
              />

              <Select
                label="Seniority"
                options={SENIORITY_OPTIONS}
                {...register('seniority')}
                error={errors.seniority?.message}
                required
              />
            </div>
          </div>

          {/* Business Leader Information */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-black">
              Líder del Área (quien completará specs técnicas)
            </h3>

            <Input
              label="Nombre completo del líder"
              {...register('business_user_name')}
              error={errors.business_user_name?.message}
              required
              placeholder="Ej: Carlos Rodríguez"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Cargo del líder"
                {...register('business_user_position')}
                error={errors.business_user_position?.message}
                required
                placeholder="Ej: VP of Product"
              />

              <Input
                label="Email corporativo del líder"
                type="email"
                {...register('business_user_email')}
                error={errors.business_user_email?.message}
                required
                placeholder="carlos@empresa.com"
              />
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-black">Compensación</h3>

            <Input
              label="Rango salarial (USD/año)"
              {...register('salary_range')}
              error={errors.salary_range?.message}
              required
              placeholder="Ej: $80,000 - $120,000"
            />

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="equity_included"
                {...register('equity_included')}
                className="w-4 h-4 text-purple border-gray-300 rounded focus:ring-2 focus:ring-purple"
              />
              <label htmlFor="equity_included" className="text-sm font-medium text-gray-700">
                Incluye equity/opciones
              </label>
            </div>

            {equityIncluded && (
              <Textarea
                label="Detalles del equity"
                {...register('equity_details')}
                error={errors.equity_details?.message}
                placeholder="Ej: 0.5% - 1.5% equity con vesting de 4 años"
                rows={3}
              />
            )}
          </div>

          {/* Contract Details */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-black">Detalles del Contrato</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de contrato"
                options={CONTRACT_TYPE_OPTIONS}
                {...register('contract_type')}
                error={errors.contract_type?.message}
                required
              />

              <Input
                label="Fecha objetivo de incorporación"
                type="date"
                {...register('target_fill_date')}
                error={errors.target_fill_date?.message}
                required
              />
            </div>

            <Select
              label="Tipo de posición"
              options={POSITION_TYPE_OPTIONS}
              {...register('position_type')}
              error={errors.position_type?.message}
              required
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-black">Notas Adicionales</h3>

            <Textarea
              label="Notas críticas (opcional)"
              {...register('critical_notes')}
              error={errors.critical_notes?.message}
              placeholder="Contexto importante, urgencias, consideraciones especiales..."
              rows={4}
            />
          </div>

          {/* Error Message */}
          {apiError && (
            <div className="p-4 bg-pink/10 border border-pink rounded-lg">
              <p className="text-pink text-sm">{apiError}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Creando Posición...' : 'Crear Posición y Notificar Líder'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Al crear la posición, se enviará un email al líder del área con un link para
            completar las especificaciones técnicas.
          </p>
        </form>
      </Card>

      {/* Success Modal */}
      {showSuccess && positionCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="text-center">
              <div className="mb-4 text-6xl">✅</div>
              <h3 className="text-2xl font-bold text-black mb-2">
                ¡Posición Creada!
              </h3>
              <p className="text-gray-600 mb-4">
                Se ha notificado al líder del área para que complete las especificaciones
                técnicas.
              </p>
              <div className="bg-purple/10 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-2">Código de Posición:</p>
                <div className="flex items-center justify-center space-x-2">
                  <code className="text-lg font-mono font-bold text-purple">
                    {positionCode}
                  </code>
                  <button
                    onClick={copyPositionCode}
                    className="text-purple hover:text-purple/80 text-sm underline"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <Button
                onClick={handleCloseSuccess}
                variant="primary"
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
