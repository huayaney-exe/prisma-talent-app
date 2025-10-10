/**
 * Candidate Review Page - View, filter, and score applicants for positions
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'
import { applicantService } from '@/services/applicantService'

// ============================================================================
// TYPES
// ============================================================================

type QualificationStatus = 'pending' | 'qualified' | 'rejected' | 'shortlisted'

interface Applicant {
  id: string
  full_name: string
  email: string
  phone: string
  linkedin_url?: string
  portfolio_url?: string
  cv_url: string
  cover_letter?: string
  position_code: string
  position_name: string
  submitted_at: string
  qualification_status: QualificationStatus
  score?: number
  notes?: string
}

const STATUS_LABELS: Record<QualificationStatus, string> = {
  pending: 'Pendiente',
  qualified: 'Calificado',
  rejected: 'Rechazado',
  shortlisted: 'Shortlist',
}

const STATUS_COLORS: Record<QualificationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  shortlisted: 'bg-purple-100 text-purple-800',
}

// ============================================================================
// APPLICANT DETAIL MODAL
// ============================================================================

interface ApplicantDetailModalProps {
  applicant: Applicant
  onClose: () => void
  onQualify: (applicantId: string, score: number, notes: string) => void
  onReject: (applicantId: string, notes: string) => void
}

function ApplicantDetailModal({
  applicant,
  onClose,
  onQualify,
  onReject,
}: ApplicantDetailModalProps) {
  const [score, setScore] = useState(applicant.score || 0)
  const [notes, setNotes] = useState(applicant.notes || '')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-black text-white p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{applicant.full_name}</h2>
              <p className="text-sm text-gray-400 mt-1">{applicant.position_name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-3xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-bold text-black mb-3">Información de Contacto</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <div className="mt-1">
                  <a
                    href={`mailto:${applicant.email}`}
                    className="text-purple hover:text-purple/80"
                  >
                    {applicant.email}
                  </a>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Teléfono:</span>
                <div className="mt-1">{applicant.phone}</div>
              </div>
              {applicant.linkedin_url && (
                <div>
                  <span className="font-medium text-gray-600">LinkedIn:</span>
                  <div className="mt-1">
                    <a
                      href={applicant.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple hover:text-purple/80"
                    >
                      Ver perfil →
                    </a>
                  </div>
                </div>
              )}
              {applicant.portfolio_url && (
                <div>
                  <span className="font-medium text-gray-600">Portfolio:</span>
                  <div className="mt-1">
                    <a
                      href={applicant.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple hover:text-purple/80"
                    >
                      Ver portfolio →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CV */}
          <div>
            <h3 className="text-lg font-bold text-black mb-3">CV</h3>
            <a
              href={applicant.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/90 transition-colors"
            >
              Descargar CV →
            </a>
          </div>

          {/* Cover Letter */}
          {applicant.cover_letter && (
            <div>
              <h3 className="text-lg font-bold text-black mb-3">Carta de Presentación</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {applicant.cover_letter}
              </div>
            </div>
          )}

          {/* Scoring Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-black mb-3">Calificación</h3>
            <div className="space-y-4">
              {/* Score Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntuación (0-100)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="text-2xl font-bold text-purple w-16 text-center">
                    {score}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas de Evaluación
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent"
                  placeholder="Fortalezas, áreas de mejora, fit cultural..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              onClick={() => onReject(applicant.id, notes)}
              className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              Rechazar
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => onQualify(applicant.id, score, notes)}
                className="px-6 py-3 bg-purple text-white font-medium rounded-lg hover:bg-purple/90 transition-colors"
              >
                Calificar
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CandidateReviewPage() {
  const { code } = useParams<{ code?: string }>() // Optional: filter by position
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<QualificationStatus | 'all'>('all')
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)

  // Load applicants from Supabase
  useEffect(() => {
    loadApplicants()
  }, [code, filter])

  const loadApplicants = async () => {
    setIsLoading(true)
    try {
      const qualificationStatus = filter === 'all' ? undefined : filter
      const data = await applicantService.getAllApplicants(code, qualificationStatus)
      setApplicants((data || []) as any)
    } catch (error) {
      console.error('Failed to load applicants:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const handleQualify = async (applicantId: string, score: number, notes: string) => {
    try {
      await applicantService.qualifyApplicant(applicantId, score, notes)
      await loadApplicants() // Refresh list
      setSelectedApplicant(null)
    } catch (error) {
      console.error('Failed to qualify applicant:', error)
      alert('Error al calificar candidato')
    }
  }

  const handleReject = async (applicantId: string, notes: string) => {
    try {
      await applicantService.rejectApplicant(applicantId, notes)
      await loadApplicants() // Refresh list
      setSelectedApplicant(null)
    } catch (error) {
      console.error('Failed to reject applicant:', error)
      alert('Error al rechazar candidato')
    }
  }

  const filteredApplicants = applicants

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
                Candidate Review
              </span>
              {code && <span className="text-sm text-gray-500 font-mono">({code})</span>}
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
                Todos
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setFilter('qualified')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'qualified'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Calificados
              </button>
              <button
                onClick={() => setFilter('shortlisted')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'shortlisted'
                    ? 'bg-purple text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Shortlist
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rechazados
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {filteredApplicants.length} candidato{filteredApplicants.length !== 1 ? 's' : ''}
            </div>
          </div>
        </Card>

        {/* Applicants Table */}
        {isLoading ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-bold text-black mb-2">Cargando candidatos...</h3>
            </div>
          </Card>
        ) : filteredApplicants.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-black mb-2">No hay candidatos</h3>
              <p className="text-gray-600">
                Los candidatos aparecerán aquí cuando se envíen aplicaciones
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
                      Candidato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntuación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {applicant.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{applicant.position_name}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {applicant.position_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{applicant.email}</div>
                        <div className="text-xs text-gray-400">{applicant.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(applicant.submitted_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {applicant.score !== undefined ? (
                          <div className="text-lg font-bold text-purple">{applicant.score}</div>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            STATUS_COLORS[applicant.qualification_status]
                          }`}
                        >
                          {STATUS_LABELS[applicant.qualification_status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedApplicant(applicant)}
                            className="text-purple hover:text-purple/80"
                          >
                            Revisar
                          </button>
                          <span className="text-gray-300">|</span>
                          <a
                            href={applicant.cv_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan hover:text-cyan/80"
                          >
                            CV
                          </a>
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

      {/* Detail Modal */}
      {selectedApplicant && (
        <ApplicantDetailModal
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onQualify={handleQualify}
          onReject={handleReject}
        />
      )}
    </div>
  )
}
