/**
 * Lead Form - First interaction form for prospective clients
 * Supports two intents: hiring (with position details) or conversation
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leadSchema } from '@/lib/validation'
import { leadService } from '@/services/leadService'
import { Input, Select, Button, Card } from '@/components/ui'
import type { Lead, Intent, CompanySize, WorkMode, Urgency } from '@/types'

// ============================================================================
// CONSTANTS
// ============================================================================

const INTENT_OPTIONS = [
  { value: '', label: 'Selecciona tu interés', disabled: true },
  { value: 'hiring', label: 'Quiero contratar talento' },
  { value: 'conversation', label: 'Quiero conversar sobre mi industria' },
]

const COMPANY_SIZE_OPTIONS = [
  { value: '', label: 'Selecciona tamaño', disabled: true },
  { value: '1-10', label: '1-10 personas' },
  { value: '11-50', label: '11-50 personas' },
  { value: '51-200', label: '51-200 personas' },
  { value: '201-1000', label: '201-1,000 personas' },
  { value: '1000+', label: '1,000+ personas' },
]

const WORK_MODE_OPTIONS = [
  { value: '', label: 'Selecciona modalidad', disabled: true },
  { value: 'remote', label: 'Remoto' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'onsite', label: 'Presencial' },
]

const URGENCY_OPTIONS = [
  { value: '', label: 'Selecciona urgencia', disabled: true },
  { value: 'immediate', label: 'Inmediato (días)' },
  { value: '1-2-weeks', label: '1-2 semanas' },
  { value: '1-month+', label: '1 mes o más' },
  { value: 'not-urgent', label: 'Sin urgencia' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function LeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<Lead>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      intent: '' as Intent,
      company_size: '' as CompanySize,
      work_mode: '' as WorkMode,
      urgency: '' as Urgency,
    },
  })

  const intent = watch('intent')
  const showPositionFields = intent === 'hiring'

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const onSubmit = async (data: Lead) => {
    setIsSubmitting(true)
    setApiError(null)

    try {
      await leadService.submitLead(data)
      setShowSuccess(true)
      reset()
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Error al enviar el formulario')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black mb-2">
            Conecta con Talento Curado
          </h2>
          <p className="text-gray-600">
            Completa este formulario y te contactaremos en menos de 24 horas
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-black">Tu Información</h3>

            <Input
              label="Nombre completo"
              {...register('contact_name')}
              error={errors.contact_name?.message}
              required
              placeholder="Ej: María González"
            />

            <Input
              label="Email corporativo"
              type="email"
              {...register('contact_email')}
              error={errors.contact_email?.message}
              required
              placeholder="maria@empresa.com"
            />

            <Input
              label="Teléfono"
              type="tel"
              {...register('contact_phone')}
              error={errors.contact_phone?.message}
              required
              placeholder="+51 999 999 999"
            />

            <Input
              label="Tu cargo actual"
              {...register('contact_position')}
              error={errors.contact_position?.message}
              required
              placeholder="Ej: CEO, VP de Producto"
            />
          </div>

          {/* Company Information */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-black">Tu Empresa</h3>

            <Input
              label="Nombre de la empresa"
              {...register('company_name')}
              error={errors.company_name?.message}
              required
              placeholder="Ej: Tech Solutions SAC"
            />

            <Input
              label="Industria"
              {...register('industry')}
              error={errors.industry?.message}
              placeholder="Ej: Fintech, E-commerce, SaaS"
            />

            <Select
              label="Tamaño de la empresa"
              options={COMPANY_SIZE_OPTIONS}
              {...register('company_size')}
              error={errors.company_size?.message}
            />
          </div>

          {/* Intent Selection */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-black">¿Qué Necesitas?</h3>

            <Select
              label="Tipo de conversación"
              options={INTENT_OPTIONS}
              {...register('intent')}
              error={errors.intent?.message}
              required
            />
          </div>

          {/* Position Details (Progressive Disclosure) */}
          {showPositionFields && (
            <div className="space-y-4 pt-6 border-t border-gray-200 bg-purple/5 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-black">
                Detalles de la Posición
              </h3>

              <Input
                label="Título del rol"
                {...register('role_title')}
                error={errors.role_title?.message}
                required
                placeholder="Ej: Senior Product Manager"
              />

              <Input
                label="Tipo de rol"
                {...register('role_type')}
                error={errors.role_type?.message}
                required
                placeholder="Ej: Product Management, Engineering"
              />

              <Input
                label="Seniority"
                {...register('seniority')}
                error={errors.seniority?.message}
                required
                placeholder="Ej: Senior, Staff, Director"
              />

              <Select
                label="Modalidad de trabajo"
                options={WORK_MODE_OPTIONS}
                {...register('work_mode')}
                error={errors.work_mode?.message}
              />

              <Select
                label="Urgencia"
                options={URGENCY_OPTIONS}
                {...register('urgency')}
                error={errors.urgency?.message}
              />
            </div>
          )}

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
            {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Al enviar este formulario, aceptas que nos comuniquemos contigo sobre nuestros
            servicios de headhunting.
          </p>
        </form>
      </Card>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="text-center">
              <div className="mb-4 text-6xl">✅</div>
              <h3 className="text-2xl font-bold text-black mb-2">
                ¡Solicitud Recibida!
              </h3>
              <p className="text-gray-600 mb-6">
                Revisaremos tu información y te contactaremos en menos de 24 horas.
              </p>
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
