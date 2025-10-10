/**
 * Position Pipeline Page - View and manage all positions in the recruitment pipeline
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'
import { positionService } from '@/services/positionService'

// ============================================================================
// TYPES
// ============================================================================

type WorkflowStage = 'hr_intake' | 'business_validation' | 'jd_creation' | 'active_recruitment' | 'shortlist_delivery' | 'completed' | 'cancelled'

interface Position {
  id: string
  position_code: string
  position_name: string
  company_name: string
  business_area: string
  seniority_level: string
  workflow_stage: WorkflowStage
  created_at: string
  updated_at: string
  applicant_count: number
}

const STAGE_LABELS: Record<WorkflowStage, string> = {
  hr_intake: 'HR Intake',
  business_validation: 'Business Validation',
  jd_creation: 'JD Creation',
  active_recruitment: 'Active Recruitment',
  shortlist_delivery: 'Shortlist Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STAGE_COLORS: Record<WorkflowStage, string> = {
  hr_intake: 'bg-yellow-100 text-yellow-800',
  business_validation: 'bg-blue-100 text-blue-800',
  jd_creation: 'bg-purple-100 text-purple-800',
  active_recruitment: 'bg-green-100 text-green-800',
  shortlist_delivery: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PositionPipelinePage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<WorkflowStage | 'all'>('all')

  // Load positions from Supabase
  useEffect(() => {
    loadPositions()
  }, [filter])

  const loadPositions = async () => {
    setIsLoading(true)
    try {
      const data = await positionService.getAllPositions(filter === 'all' ? undefined : filter)
      setPositions(data || [])
    } catch (error) {
      console.error('Failed to load positions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const filteredPositions = positions

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-prisma-section">
      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-50 glassmorphism-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin')}
                className="hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-purple)' }}
              >
                ← Dashboard
              </button>
              <span className="text-2xl text-gray-400">|</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                Position Pipeline
              </span>
            </div>
            <Button onClick={handleSignOut} variant="secondary" size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-purple text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('hr_intake')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'hr_intake'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                HR Intake
              </button>
              <button
                onClick={() => setFilter('business_validation')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'business_validation'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Business Val.
              </button>
              <button
                onClick={() => setFilter('jd_creation')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'jd_creation'
                    ? 'bg-purple text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                JD Creation
              </button>
              <button
                onClick={() => setFilter('active_recruitment')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'active_recruitment'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Recruiting
              </button>
              <button
                onClick={() => setFilter('shortlist_delivery')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'shortlist_delivery'
                    ? 'bg-cyan text-black'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Shortlist
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Completed
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {filteredPositions.length} posición{filteredPositions.length !== 1 ? 'es' : ''}
            </div>
          </div>
        </Card>

        {/* Positions Table */}
        {isLoading ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-bold text-black mb-2">Cargando posiciones...</h3>
            </div>
          </Card>
        ) : filteredPositions.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-black mb-2">No hay posiciones</h3>
              <p className="text-gray-600">
                Las posiciones aparecerán aquí cuando se aprueben leads y se creen posiciones
              </p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Área / Seniority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidatos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Act.
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPositions.map((position) => (
                    <tr key={position.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-purple">
                          {position.position_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {position.position_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{position.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {position.business_area}
                        </div>
                        <div className="text-xs text-gray-400">{position.seniority_level}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            STAGE_COLORS[position.workflow_stage]
                          }`}
                        >
                          {STAGE_LABELS[position.workflow_stage]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {position.applicant_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(position.updated_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/admin/positions/${position.position_code}/edit`)}
                            className="text-purple hover:text-purple/80"
                          >
                            Ver JD
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => navigate(`/admin/candidates/${position.position_code}`)}
                            className="text-cyan hover:text-cyan/80"
                          >
                            Candidatos
                          </button>
                          <span className="text-gray-300">|</span>
                          <button className="text-pink hover:text-pink/80">
                            Detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
