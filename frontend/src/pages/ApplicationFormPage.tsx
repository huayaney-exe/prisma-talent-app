/**
 * Application Form Page - Candidate application with resume upload
 * Route: /apply/:code
 *
 * Allows candidates to apply to published positions
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { positionService } from '@/services/positionService'
import { applicantService } from '@/services/applicantService'
import { Input, Textarea, Button, Card } from '@/components/ui'
import type { Position } from '@/types'

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const applicationSchema = z.object({
  full_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Teléfono inválido'),
  linkedin_url: z.string().url('URL de LinkedIn inválida').optional().or(z.literal('')),
  portfolio_url: z.string().url('URL de portafolio inválida').optional().or(z.literal('')),
  years_of_experience: z.string().min(1, 'Años de experiencia requeridos'),
  current_company: z.string().optional(),
  current_role: z.string().optional(),
  why_interested: z.string().min(50, 'Por favor explica tu interés (mínimo 50 caracteres)'),
  resume: z.instanceof(File, { message: 'CV es requerido' }),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

// ============================================================================
// COMPONENT
// ============================================================================

export function ApplicationFormPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [position, setPosition] = useState<Position | null>(null)
  const [isLoadingPosition, setIsLoadingPosition] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  })

  // ============================================================================
  // LOAD POSITION
  // ============================================================================

  useEffect(() => {
    const loadPosition = async () => {
      if (!code) {
        setApiError('Código de posición no válido')
        setIsLoadingPosition(false)
        return
      }

      setIsLoadingPosition(true)
      setApiError(null)

      try {
        const positionData = await positionService.getPositionByCode(code)

        if (positionData.workflow_stage !== 'active') {
          setApiError('Esta posición aún no está abierta para aplicaciones')
          setIsLoadingPosition(false)
          return
        }

        setPosition(positionData)
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'No se pudo cargar la posición')
      } finally {
        setIsLoadingPosition(false)
      }
    }

    loadPosition()
  }, [code])

  // ============================================================================
  // FILE UPLOAD HANDLER
  // ============================================================================

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = applicantService.validateResume(file)
    if (!validation.valid) {
      setApiError(validation.error || 'Archivo inválido')
      return
    }

    setResumeFile(file)
    setValue('resume', file)
    setApiError(null)
  }

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const onSubmit = async (data: ApplicationFormData) => {
    if (!position) return

    setIsSubmitting(true)
    setApiError(null)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      await applicantService.submitApplication(position.id, data)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setShowSuccess(true)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Error al enviar la aplicación')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoadingPosition) {
    return (
      <div className="min-h-screen bg-prisma-form flex items-center justify-center">
        <Card className="max-w-md w-full p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando formulario...</p>
          </div>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (!position && apiError) {
    return (
      <div className="min-h-screen bg-prisma-form flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-black mb-2">No Disponible</h2>
            <p className="text-gray-600 mb-6">{apiError}</p>
            <Button onClick={() => navigate('/')} variant="primary">
              Volver al Inicio
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!position) return null

  // ============================================================================
  // RENDER APPLICATION FORM
  // ============================================================================

  return (
    <div className="min-h-screen bg-prisma-form">
      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-50 glassmorphism-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <a href="/" className="hover:opacity-80 transition-opacity">
                <img src="/assets/logo-4wtbg.svg" alt="Prisma" className="h-10 w-auto" />
              </a>
              <span className="text-2xl text-gray-400">|</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                Prisma Talent
              </span>
            </div>
            <div className="font-mono text-sm" style={{ color: 'var(--color-gray-400)' }}>
              {position.position_code}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Position Context */}
        <Card className="mb-8 p-6 bg-purple/5 border-purple/20">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">📋</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-black mb-2">{position.position_name}</h1>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple/10 text-purple text-sm rounded-full">
                  {position.area}
                </span>
                <span className="px-3 py-1 bg-cyan/10 text-cyan text-sm rounded-full">
                  {position.seniority}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Application Form */}
        <Card className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Aplicar a Esta Posición</h2>
            <p className="text-gray-600">
              Completa el formulario y adjunta tu CV. Nos pondremos en contacto contigo lo antes
              posible.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-black">Información Personal</h3>

              <Input
                label="Nombre completo"
                {...register('full_name')}
                error={errors.full_name?.message}
                required
                placeholder="Ej: María González"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  required
                  placeholder="maria@example.com"
                />

                <Input
                  label="Teléfono"
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                  required
                  placeholder="+51 999 999 999"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="LinkedIn (opcional)"
                  {...register('linkedin_url')}
                  error={errors.linkedin_url?.message}
                  placeholder="https://linkedin.com/in/tu-perfil"
                />

                <Input
                  label="Portafolio (opcional)"
                  {...register('portfolio_url')}
                  error={errors.portfolio_url?.message}
                  placeholder="https://tu-portafolio.com"
                />
              </div>
            </div>

            {/* Professional Background */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-black">Experiencia Profesional</h3>

              <Input
                label="Años de experiencia en el área"
                type="number"
                {...register('years_of_experience')}
                error={errors.years_of_experience?.message}
                required
                placeholder="5"
                min="0"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Empresa actual (opcional)"
                  {...register('current_company')}
                  error={errors.current_company?.message}
                  placeholder="Ej: Tech Solutions SAC"
                />

                <Input
                  label="Rol actual (opcional)"
                  {...register('current_role')}
                  error={errors.current_role?.message}
                  placeholder="Ej: Senior Product Manager"
                />
              </div>

              <Textarea
                label="¿Por qué te interesa esta posición?"
                {...register('why_interested')}
                error={errors.why_interested?.message}
                required
                rows={6}
                placeholder="Cuéntanos qué te motiva a aplicar a esta posición y qué puedes aportar al equipo..."
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-black">Curriculum Vitae</h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Adjunta tu CV <span className="text-pink">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple file:text-white
                    hover:file:bg-purple/90
                    file:cursor-pointer cursor-pointer"
                />
                <p className="text-xs text-gray-500">Solo archivos PDF, máximo 5MB</p>
                {errors.resume && (
                  <p className="text-sm text-pink mt-1">{errors.resume.message}</p>
                )}
                {resumeFile && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 flex items-center">
                      <span className="mr-2">✓</span>
                      {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subiendo CV...</span>
                    <span className="text-purple font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
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
              disabled={!resumeFile}
            >
              {isSubmitting ? 'Enviando Aplicación...' : 'Enviar Aplicación'}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Al enviar esta aplicación, aceptas que nos comuniquemos contigo sobre esta posición.
            </p>
          </form>
        </Card>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="text-center p-8">
              <div className="mb-4 text-6xl">✅</div>
              <h3 className="text-2xl font-bold text-black mb-2">
                ¡Aplicación Recibida!
              </h3>
              <p className="text-gray-600 mb-6">
                Hemos recibido tu aplicación para <strong>{position.position_name}</strong>.
                Revisaremos tu perfil y te contactaremos pronto.
              </p>
              <Button onClick={() => navigate('/')} variant="primary" className="w-full">
                Volver al Inicio
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer
        className="py-12 px-4 mt-12"
        style={{
          background: 'var(--color-gray-900)',
          borderTop: '2px solid var(--color-purple)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <img src="/assets/logo-4dkbg.svg" alt="Prisma" className="h-8 w-auto" />
              <span className="text-2xl text-gray-600">|</span>
              <div className="flex items-center space-x-2">
                <span
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-purple)' }}
                >
                  Prisma Talent
                </span>
                <img src="/assets/trebol-lilac.svg" alt="Trébol" className="h-5 w-auto" />
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">Community-driven talent acquisition</p>
              <p className="text-sm text-gray-500 mt-1">
                Lima, Perú •{' '}
                <a
                  href="mailto:hello@getprisma.io"
                  className="hover:text-purple-400 transition-colors"
                >
                  hello@getprisma.io
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
