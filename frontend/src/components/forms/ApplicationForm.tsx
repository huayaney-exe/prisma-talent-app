/**
 * Application Form - Job application submission for candidates
 * Public form for candidates to apply to open positions
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { applicantFormSchema } from '@/lib/validation'
import { applicantService } from '@/services/applicantService'
import { uploadService } from '@/services/uploadService'
import { Input, Button, Card, Textarea } from '@/components/ui'
import type { ApplicantFormData } from '@/types'

// ============================================================================
// INTERFACES
// ============================================================================

interface ApplicationFormProps {
  positionCode: string
  positionName?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ApplicationForm({ positionCode, positionName }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplicantFormData>({
    resolver: zodResolver(applicantFormSchema),
  })

  // ============================================================================
  // FILE HANDLERS
  // ============================================================================

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = uploadService.validateFile(file, 'cv')
    if (!validation.valid) {
      setApiError(validation.error || 'Archivo inválido')
      return
    }

    setResumeFile(file)
    setApiError(null)
  }

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate all files
    for (const file of files) {
      const validation = uploadService.validateFile(file, 'portfolio')
      if (!validation.valid) {
        setApiError(validation.error || 'Archivo de portafolio inválido')
        return
      }
    }

    setPortfolioFiles(files)
    setApiError(null)
  }

  // ============================================================================
  // SUBMIT HANDLER
  // ============================================================================

  const onSubmit = async (data: ApplicantFormData) => {
    if (!resumeFile) {
      setApiError('Por favor adjunta tu CV en formato PDF')
      return
    }

    setIsSubmitting(true)
    setApiError(null)

    try {
      await applicantService.submitApplication(
        positionCode,
        data,
        resumeFile,
        portfolioFiles.length > 0 ? portfolioFiles : undefined
      )

      setShowSuccess(true)
      reset()
      setResumeFile(null)
      setPortfolioFiles([])
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Error al enviar la aplicación'
      )
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
            Aplicar a Posición
          </h2>
          {positionName && (
            <p className="text-lg text-gray-700 font-semibold">{positionName}</p>
          )}
          <p className="text-gray-600 mt-2">
            Completa el formulario para enviar tu aplicación
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
              placeholder="Ej: María González Pérez"
            />

            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              required
              placeholder="maria@email.com"
            />

            <Input
              label="Teléfono"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              required
              placeholder="+51 999 999 999"
            />

            <Input
              label="LinkedIn (opcional)"
              {...register('linkedin_url')}
              error={errors.linkedin_url?.message}
              placeholder="https://linkedin.com/in/tu-perfil"
            />

            <Input
              label="Ubicación (opcional)"
              {...register('location')}
              error={errors.location?.message}
              placeholder="Lima, Perú"
            />

            <Input
              label="Portafolio URL (opcional)"
              {...register('portfolio_url')}
              error={errors.portfolio_url?.message}
              placeholder="https://tu-portafolio.com"
            />
          </div>

          {/* Cover Letter */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-black">Carta de Presentación</h3>

            <Textarea
              label="¿Por qué te interesa esta posición? (opcional)"
              {...register('cover_letter')}
              error={errors.cover_letter?.message}
              rows={6}
              placeholder="Comparte tu motivación y por qué encajas para este rol..."
            />
          </div>

          {/* File Uploads */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-black">Documentos</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CV (PDF) <span className="text-pink">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple/10 file:text-purple
                  hover:file:bg-purple/20
                  cursor-pointer"
              />
              {resumeFile && (
                <p className="mt-2 text-sm text-gray-600">
                  ✓ {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Formatos: PDF, DOC, DOCX (máximo 5MB)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivos de Portafolio (opcional)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.zip"
                multiple
                onChange={handlePortfolioChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-cyan/10 file:text-cyan
                  hover:file:bg-cyan/20
                  cursor-pointer"
              />
              {portfolioFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {portfolioFiles.map((file, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Formatos: PDF, JPG, PNG, GIF, ZIP (máximo 5MB por archivo)
              </p>
            </div>
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
            {isSubmitting ? 'Enviando aplicación...' : 'Enviar Aplicación'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Al enviar esta aplicación, aceptas que procesemos tu información para
            este proceso de selección.
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
                ¡Aplicación Enviada!
              </h3>
              <p className="text-gray-600 mb-6">
                Tu aplicación ha sido recibida exitosamente. Te contactaremos pronto.
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
