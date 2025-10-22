/**
 * Client Positions Page - View all positions for client company
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ============================================================================
// TYPES
// ============================================================================

interface Position {
  id: string
  position_code: string
  position_name: string
  area: string
  seniority: string
  workflow_stage: string
  created_at: string
  hr_completed_at?: string
  leader_completed_at?: string
}

// ============================================================================
// WORKFLOW STAGE CONFIG
// ============================================================================

const WORKFLOW_STAGES = {
  hr_draft: { label: 'Borrador HR', color: 'bg-gray-200 text-gray-700', icon: '📝' },
  hr_completed: { label: 'Esperando Líder', color: 'bg-cyan text-black', icon: '⏳' },
  leader_notified: { label: 'Líder Notificado', color: 'bg-blue-200 text-blue-800', icon: '📧' },
  leader_in_progress: { label: 'En Proceso', color: 'bg-yellow-200 text-yellow-800', icon: '⚙️' },
  leader_completed: { label: 'Revisión Admin', color: 'bg-purple text-white', icon: '👀' },
  job_desc_generated: { label: 'JD Generado', color: 'bg-indigo-200 text-indigo-800', icon: '📄' },
  validation_pending: { label: 'Validación Pendiente', color: 'bg-orange-200 text-orange-800', icon: '🔍' },
  validated: { label: 'Validado', color: 'bg-green-200 text-green-800', icon: '✓' },
  active: { label: 'Activo', color: 'bg-green-500 text-white', icon: '🚀' },
  filled: { label: 'Cubierto', color: 'bg-gray-400 text-white', icon: '✅' },
  cancelled: { label: 'Cancelado', color: 'bg-pink text-white', icon: '❌' },
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientPositionsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    loadPositions()
  }, [user?.id])

  const loadPositions = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      // Get company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, company_name')
        .eq('primary_contact_auth_id', user.id)
        .single()

      if (companyError) throw companyError
      setCompany(companyData)

      // Get all positions for this company
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPositions(data || [])
    } catch (error) {
      console.error('Failed to load positions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/client/login')
  }

  const getStageConfig = (stage: string) => {
    return WORKFLOW_STAGES[stage as keyof typeof WORKFLOW_STAGES] || WORKFLOW_STAGES.hr_draft
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-prisma-section">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/client/dashboard')}
                className="hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-purple)' }}
              >
                ← Dashboard
              </button>
              <span className="text-2xl text-gray-400">|</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                Mis Posiciones
              </span>
            </div>
            <Button onClick={handleSignOut} variant="secondary" size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Company Header */}
        {company && (
          <Card className="p-6 mb-6" style={{ borderLeft: '4px solid var(--color-purple)' }}>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black mb-1">
                  {company.company_name}
                </h1>
                <p className="text-gray-600">
                  {positions.length} posición{positions.length !== 1 ? 'es' : ''} en el pipeline
                </p>
              </div>
              <Button
                onClick={() => navigate('/hr-form')}
                variant="primary"
              >
                + Nueva Posición
              </Button>
            </div>
          </Card>
        )}

        {/* Positions List */}
        {isLoading ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-bold text-black mb-2">Cargando posiciones...</h3>
            </div>
          </Card>
        ) : positions.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-black mb-2">No hay posiciones aún</h3>
              <p className="text-gray-600 mb-6">
                Crea tu primera posición para comenzar a buscar talento
              </p>
              <Button
                onClick={() => navigate('/hr-form')}
                variant="primary"
              >
                Crear Primera Posición
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {positions.map((position) => {
              const stageConfig = getStageConfig(position.workflow_stage)

              return (
                <Card key={position.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Position Header */}
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-black">
                          {position.position_name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${stageConfig.color}`}
                        >
                          {stageConfig.icon} {stageConfig.label}
                        </span>
                      </div>

                      {/* Position Details */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center space-x-1">
                          <span className="font-semibold">Código:</span>
                          <span className="font-mono">{position.position_code}</span>
                        </span>
                        <span>•</span>
                        <span>{position.area}</span>
                        <span>•</span>
                        <span>{position.seniority}</span>
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center space-x-6 text-xs text-gray-500">
                        <div>
                          <span className="font-semibold">Creado:</span>{' '}
                          {formatDate(position.created_at)}
                        </div>
                        {position.hr_completed_at && (
                          <div>
                            <span className="font-semibold">HR Completado:</span>{' '}
                            {formatDate(position.hr_completed_at)}
                          </div>
                        )}
                        {position.leader_completed_at && (
                          <div>
                            <span className="font-semibold">Líder Completado:</span>{' '}
                            {formatDate(position.leader_completed_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      {position.workflow_stage === 'active' && (
                        <Button
                          onClick={() => navigate(`/job/${position.position_code}`)}
                          variant="secondary"
                          size="sm"
                        >
                          Ver Job Posting
                        </Button>
                      )}
                      {['hr_completed', 'leader_notified'].includes(position.workflow_stage) && (
                        <Button
                          onClick={() => navigate(`/business-form?code=${position.position_code}`)}
                          variant="primary"
                          size="sm"
                        >
                          Completar Form
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
