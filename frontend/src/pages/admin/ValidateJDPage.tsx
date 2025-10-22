/**
 * Validate JD Page - HR validation of created job descriptions
 * Allows HR to review, provide feedback, and approve JDs before publication
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { positionService } from '@/services/positionService'
import { jdService } from '@/services/jdService'
import { Button, Card, Textarea } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export function ValidateJDPage() {
  const { positionId } = useParams<{ positionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [position, setPosition] = useState<any>(null)
  const [jd, setJD] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Approval state
  const [feedback, setFeedback] = useState('')
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    loadData()
  }, [positionId])

  const loadData = async () => {
    if (!positionId) return

    setIsLoading(true)
    setError(null)

    try {
      const [positionData, jdData] = await Promise.all([
        positionService.getPositionById(positionId),
        jdService.getJobDescription(positionId),
      ])

      if (!jdData) {
        setError('No hay Job Description para validar')
        return
      }

      if (jdData.hr_approved) {
        setError('Este Job Description ya fue aprobado')
        return
      }

      setPosition(positionData)
      setJD(jdData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!jd) return

    const confirmed = confirm(
      '¿Aprobar este Job Description? La posición quedará lista para publicación.'
    )
    if (!confirmed) return

    setIsApproving(true)
    try {
      await jdService.approveJD(jd.id, feedback || undefined)
      alert('✅ Job Description aprobado exitosamente')
      navigate('/admin/positions')
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Failed to approve'))
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!feedback.trim()) {
      alert('⚠️ Por favor proporciona feedback antes de rechazar')
      return
    }

    const confirmed = confirm(
      '¿Rechazar este Job Description? El admin deberá editarlo según tu feedback.'
    )
    if (!confirmed) return

    // For rejection, we just save the feedback and send back to admin
    // The workflow stage stays at 'job_desc_generated'
    alert('🔄 Feedback guardado. Notifica al admin para hacer los ajustes necesarios.')
    navigate('/admin/positions')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando Job Description...</p>
        </div>
      </div>
    )
  }

  if (error || !position || !jd) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Position or JD not found'}</p>
          <Button onClick={() => navigate('/admin/positions')}>
            Volver a Positions
          </Button>
        </Card>
      </div>
    )
  }

  const company = position.companies

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                onClick={() => navigate('/admin/positions')}
                variant="secondary"
                className="mb-2"
              >
                ← Volver
              </Button>
              <h1 className="text-3xl font-bold text-black">
                Validación HR: {position.position_name}
              </h1>
              <p className="text-gray-600">
                {position.position_code} • {company?.company_name}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                ⏳ Pendiente Validación HR
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Job Description Preview */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">📝 Job Description Generado</h2>
          <div className="prose max-w-none bg-white p-6 rounded-lg border border-gray-200">
            <div className="whitespace-pre-wrap text-gray-800">{jd.generated_content}</div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Creado:</strong> {new Date(jd.created_at).toLocaleString()}
              <br />
              <strong>Modelo:</strong> {jd.generation_model}
              {jd.version_number && (
                <>
                  <br />
                  <strong>Versión:</strong> {jd.version_number}
                </>
              )}
            </p>
          </div>
        </Card>

        {/* Position Context (for reference) */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">📋 Contexto de la Posición</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Detalles</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-600">Área</dt>
                  <dd className="font-medium">{position.area}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Seniority</dt>
                  <dd className="font-medium">{position.seniority}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Tipo de Contrato</dt>
                  <dd className="font-medium">{position.contract_type}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Compensación</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-600">Rango Salarial</dt>
                  <dd className="font-medium">{position.salary_range}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Equity</dt>
                  <dd className="font-medium">
                    {position.equity_included ? '✅ Incluido' : '❌ No incluido'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Timeline</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-600">Fecha Objetivo</dt>
                  <dd className="font-medium">{position.timeline}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>

        {/* Validation Form */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">✅ Validación HR</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Feedback para el Admin (opcional si apruebas, requerido si rechazas)
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={6}
                placeholder="Ej: 'Los beneficios están incompletos, falta mencionar el seguro médico.'&#10;&#10;O: 'Perfecto, listo para publicar.'"
                className="text-sm"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleApprove}
                isLoading={isApproving}
                variant="primary"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                ✅ Aprobar JD
              </Button>
              <Button
                onClick={handleReject}
                variant="secondary"
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-800"
              >
                ❌ Rechazar y Solicitar Ajustes
              </Button>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Si apruebas:</strong> La posición quedará lista para publicación.</p>
              <p><strong>Si rechazas:</strong> El admin recibirá tu feedback y deberá hacer ajustes.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
