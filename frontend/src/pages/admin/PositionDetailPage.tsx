/**
 * Position Detail Page - Admin view of complete position data
 * Shows HR form + Business leader specs + JD management
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { positionService } from '@/services/positionService'
import { jdService } from '@/services/jdService'
import { Button, Card, Textarea } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export function PositionDetailPage() {
  const { positionId } = useParams<{ positionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [position, setPosition] = useState<any>(null)
  const [jd, setJD] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // JD editing state
  const [isEditingJD, setIsEditingJD] = useState(false)
  const [jdContent, setJDContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

      setPosition(positionData)
      setJD(jdData)
      if (jdData) {
        setJDContent(jdData.generated_content)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveJD = async () => {
    if (!positionId || !user?.id) return

    setIsSaving(true)
    try {
      await jdService.createJobDescription(positionId, jdContent, user.id)
      await loadData()
      setIsEditingJD(false)
      alert('✅ Job Description guardado')
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Failed to save'))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!jd) return

    const confirmed = confirm(
      '¿Publicar esta posición? Será visible públicamente y los candidatos podrán aplicar.'
    )
    if (!confirmed) return

    try {
      await jdService.publishJD(jd.id)
      await loadData()
      alert('✅ Posición publicada')
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Failed to publish'))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando posición...</p>
        </div>
      </div>
    )
  }

  if (error || !position) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Position not found'}</p>
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
                {position.position_name}
              </h1>
              <p className="text-gray-600">
                {position.position_code} • {company?.company_name}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-purple/10 text-purple">
                {position.workflow_stage}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* HR Form Data */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">📋 Información de HR</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Detalles de Posición</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-600">Área</dt>
                  <dd className="font-medium">{position.area}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Seniority</dt>
                  <dd className="font-medium">{position.seniority}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Tipo de Contrato</dt>
                  <dd className="font-medium">{position.contract_type}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Tipo de Posición</dt>
                  <dd className="font-medium">{position.position_type}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Compensación</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-600">Rango Salarial</dt>
                  <dd className="font-medium">{position.salary_range}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Equity</dt>
                  <dd className="font-medium">
                    {position.equity_included ? '✅ Incluido' : '❌ No incluido'}
                  </dd>
                </div>
                {position.equity_details && (
                  <div>
                    <dt className="text-sm text-gray-600">Detalles Equity</dt>
                    <dd className="font-medium">{position.equity_details}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Líder del Área</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-600">Nombre</dt>
                  <dd className="font-medium">{position.leader_name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Cargo</dt>
                  <dd className="font-medium">{position.leader_position}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Email</dt>
                  <dd className="font-medium">{position.leader_email}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Timeline</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-600">Fecha Objetivo</dt>
                  <dd className="font-medium">{position.timeline}</dd>
                </div>
              </dl>
            </div>
          </div>

          {position.critical_notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Notas Críticas</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{position.critical_notes}</p>
            </div>
          )}
        </Card>

        {/* Business Leader Data */}
        {position.workflow_stage !== 'hr_completed' && position.workflow_stage !== 'leader_notified' && (
          <Card>
            <h2 className="text-2xl font-bold mb-4">🎯 Especificaciones del Líder</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Contexto del Equipo</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-600">Modalidad de Trabajo</dt>
                    <dd className="font-medium">{position.work_arrangement || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Tamaño del Equipo</dt>
                    <dd className="font-medium">{position.team_size || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Cultura de Meetings</dt>
                    <dd className="font-medium">{position.meeting_culture || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Estilo de Trabajo</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-600">Nivel de Autonomía</dt>
                    <dd className="font-medium">{position.autonomy_level || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Requiere Mentoring</dt>
                    <dd className="font-medium">
                      {position.mentoring_required ? '✅ Sí' : '❌ No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Hands-on vs Strategic</dt>
                    <dd className="font-medium">{position.hands_on_vs_strategic || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {position.success_kpi && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">KPIs de Éxito</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{position.success_kpi}</p>
              </div>
            )}

            {position.area_specific_data && Object.keys(position.area_specific_data).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Especificaciones de {position.area}</h3>
                <dl className="space-y-3">
                  {Object.entries(position.area_specific_data).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm text-gray-600 mb-1">{key}</dt>
                      <dd className="font-medium text-gray-700">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </Card>
        )}

        {/* Job Description Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">📝 Job Description</h2>
            <div className="space-x-2">
              {!jd && position.workflow_stage === 'leader_completed' && (
                <Button onClick={() => setIsEditingJD(true)} variant="primary">
                  ✏️ Crear JD
                </Button>
              )}
              {jd && !isEditingJD && (
                <Button onClick={() => setIsEditingJD(true)} variant="secondary">
                  ✏️ Editar JD
                </Button>
              )}
              {jd && jd.hr_approved && !jd.published_at && (
                <Button onClick={handlePublish} variant="primary">
                  🚀 Publicar
                </Button>
              )}
            </div>
          </div>

          {!jd && !isEditingJD && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📄</div>
              <p>No hay Job Description aún</p>
              {position.workflow_stage !== 'leader_completed' && (
                <p className="text-sm mt-2">
                  Esperando que el líder complete las especificaciones
                </p>
              )}
            </div>
          )}

          {isEditingJD && (
            <div className="space-y-4">
              <Textarea
                value={jdContent}
                onChange={(e) => setJDContent(e.target.value)}
                rows={20}
                placeholder="Escribe el Job Description aquí..."
                className="font-mono text-sm"
              />
              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveJD}
                  isLoading={isSaving}
                  variant="primary"
                >
                  💾 Guardar JD
                </Button>
                <Button onClick={() => setIsEditingJD(false)} variant="secondary">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {jd && !isEditingJD && (
            <div>
              <div className="prose max-w-none bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="whitespace-pre-wrap">{jd.generated_content}</div>
              </div>

              {jd.hr_approved && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-semibold">
                    ✅ Aprobado por HR
                    {jd.hr_approved_at && ` el ${new Date(jd.hr_approved_at).toLocaleDateString()}`}
                  </p>
                  {jd.hr_feedback && (
                    <p className="text-green-700 text-sm mt-1">{jd.hr_feedback}</p>
                  )}
                </div>
              )}

              {jd.published_at && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-purple-800 font-semibold">
                    🚀 Publicado el {new Date(jd.published_at).toLocaleDateString()}
                  </p>
                  <a
                    href={`/job/${position.position_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 underline text-sm mt-1 inline-block"
                  >
                    Ver página pública →
                  </a>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Workflow Timeline */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">⏱️ Timeline del Proceso</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {position.hr_completed_at ? '✅' : '⏳'}
              </div>
              <div className="flex-1">
                <p className="font-semibold">HR Form Completado</p>
                {position.hr_completed_at && (
                  <p className="text-sm text-gray-600">
                    {new Date(position.hr_completed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {position.leader_notified_at ? '✅' : '⏳'}
              </div>
              <div className="flex-1">
                <p className="font-semibold">Líder Notificado</p>
                {position.leader_notified_at && (
                  <p className="text-sm text-gray-600">
                    {new Date(position.leader_notified_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {position.leader_completed_at ? '✅' : '⏳'}
              </div>
              <div className="flex-1">
                <p className="font-semibold">Especificaciones del Líder Completadas</p>
                {position.leader_completed_at && (
                  <p className="text-sm text-gray-600">
                    {new Date(position.leader_completed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {jd ? '✅' : '⏳'}
              </div>
              <div className="flex-1">
                <p className="font-semibold">Job Description Creado</p>
                {jd && (
                  <p className="text-sm text-gray-600">
                    {new Date(jd.created_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {jd?.hr_approved ? '✅' : '⏳'}
              </div>
              <div className="flex-1">
                <p className="font-semibold">Validación HR</p>
                {jd?.hr_approved_at && (
                  <p className="text-sm text-gray-600">
                    {new Date(jd.hr_approved_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {jd?.published_at ? '✅' : '⏳'}
              </div>
              <div className="flex-1">
                <p className="font-semibold">Posición Publicada</p>
                {jd?.published_at && (
                  <p className="text-sm text-gray-600">
                    {new Date(jd.published_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
