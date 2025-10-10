/**
 * Business Leader Form - Complete area-specific specifications
 * Second step in position workflow (Business Specs)
 */
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { businessFormSchema } from '@/lib/validation'
import { positionService } from '@/services/positionService'
import { areaQuestions } from '@/config/areaQuestions'
import { Input, Select, Button, Card, Textarea } from '@/components/ui'
import type { BusinessFormData, Position, Area } from '@/types'

// ============================================================================
// INTERFACES
// ============================================================================

interface BusinessLeaderFormProps {
  positionCode: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BusinessLeaderForm({ positionCode }: BusinessLeaderFormProps) {
  const [position, setPosition] = useState<Position | null>(null)
  const [isLoadingPosition, setIsLoadingPosition] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessFormSchema),
  })

  // ============================================================================
  // LOAD POSITION
  // ============================================================================

  useEffect(() => {
    const loadPosition = async () => {
      setIsLoadingPosition(true)
      setApiError(null)

      try {
        const positionData = await positionService.getPositionByCode(positionCode)
        setPosition(positionData)
      } catch (error) {
        setApiError(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar la información de la posición'
        )
      } finally {
        setIsLoadingPosition(false)
      }
    }

    loadPosition()
  }, [positionCode])

  // ============================================================================
  // GET AREA QUESTIONS
  // ============================================================================

  const questionSet = position ? areaQuestions[position.area] : null
  const questions = questionSet?.questions || []
  const totalSteps = questions.length
  const progressPercentage = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const onSubmit = async (data: BusinessFormData) => {
    setIsSubmitting(true)
    setApiError(null)

    try {
      await positionService.updateBusinessSpecs(positionCode, data)
      setShowSuccess(true)
      reset()
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Error al guardar las especificaciones'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoadingPosition) {
    return (
      <Card className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de la posición...</p>
        </div>
      </Card>
    )
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (!position && apiError) {
    return (
      <Card className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-2xl font-bold text-black mb-2">Error</h3>
          <p className="text-pink mb-6">{apiError}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Reintentar
          </Button>
        </div>
      </Card>
    )
  }

  if (!position || !questionSet) {
    return null
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const currentQuestion = questions[currentStep]

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Position Context Card */}
        <Card>
          <div className="flex items-start space-x-4">
            <div className="text-4xl">{questionSet.icon}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black mb-1">
                {position.position_name}
              </h2>
              <p className="text-gray-600 mb-3">{questionSet.title}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple/10 text-purple text-sm rounded-full">
                  {position.area}
                </span>
                <span className="px-3 py-1 bg-cyan/10 text-cyan text-sm rounded-full">
                  {position.seniority}
                </span>
                <span className="px-3 py-1 bg-pink/10 text-pink text-sm rounded-full">
                  Código: {position.position_code}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Pregunta {currentStep + 1} de {totalSteps}
            </span>
            <span className="text-sm font-medium text-purple">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-black">
                  {currentQuestion.label}
                </h3>
                {currentQuestion.required && (
                  <span className="text-pink text-sm">* Requerido</span>
                )}
              </div>

              {currentQuestion.helpText && (
                <p className="text-sm text-gray-600">{currentQuestion.helpText}</p>
              )}

              {/* Render Input Based on Type */}
              {currentQuestion.type === 'text' && (
                <Input
                  {...register(currentQuestion.id as keyof BusinessFormData)}
                  error={errors[currentQuestion.id as keyof BusinessFormData]?.message}
                  required={currentQuestion.required}
                  placeholder={currentQuestion.placeholder}
                />
              )}

              {currentQuestion.type === 'textarea' && (
                <Textarea
                  {...register(currentQuestion.id as keyof BusinessFormData)}
                  error={errors[currentQuestion.id as keyof BusinessFormData]?.message}
                  required={currentQuestion.required}
                  placeholder={currentQuestion.placeholder}
                  rows={4}
                />
              )}

              {currentQuestion.type === 'select' && currentQuestion.options && (
                <Select
                  {...register(currentQuestion.id as keyof BusinessFormData)}
                  error={errors[currentQuestion.id as keyof BusinessFormData]?.message}
                  required={currentQuestion.required}
                  options={[
                    { value: '', label: 'Selecciona una opción', disabled: true },
                    ...currentQuestion.options.map((opt) => ({
                      value: opt.value,
                      label: opt.text,
                    })),
                  ]}
                />
              )}

              {currentQuestion.type === 'number' && (
                <Input
                  type="number"
                  {...register(currentQuestion.id as keyof BusinessFormData)}
                  error={errors[currentQuestion.id as keyof BusinessFormData]?.message}
                  required={currentQuestion.required}
                  placeholder={currentQuestion.placeholder}
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={handlePrevious}
                variant="secondary"
                disabled={currentStep === 0}
              >
                ← Anterior
              </Button>

              {currentStep < totalSteps - 1 ? (
                <Button type="button" onClick={handleNext} variant="primary">
                  Siguiente →
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Completar Especificaciones'}
                </Button>
              )}
            </div>

            {/* Error Message */}
            {apiError && (
              <div className="p-4 bg-pink/10 border border-pink rounded-lg">
                <p className="text-pink text-sm">{apiError}</p>
              </div>
            )}
          </form>
        </Card>

        {/* Helper Text */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Tus respuestas nos ayudarán a identificar el candidato perfecto para esta
            posición
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="text-center">
              <div className="mb-4 text-6xl">✅</div>
              <h3 className="text-2xl font-bold text-black mb-2">
                ¡Especificaciones Completadas!
              </h3>
              <p className="text-gray-600 mb-6">
                Ahora nuestro equipo comenzará a buscar candidatos que cumplan con estos
                criterios. Te notificaremos cuando tengamos una shortlist lista.
              </p>
              <Button onClick={handleCloseSuccess} variant="primary" className="w-full">
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
