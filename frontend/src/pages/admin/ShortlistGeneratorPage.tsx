/**
 * Shortlist Generator Page - Create and send shortlist emails to clients
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'
import { applicantService } from '@/services/applicantService'

// ============================================================================
// TYPES
// ============================================================================

interface QualifiedCandidate {
  id: string
  full_name: string
  email: string
  phone: string
  linkedin_url?: string
  cv_url: string
  score: number
  notes?: string
  selected: boolean
}

interface PositionDetails {
  position_code: string
  position_name: string
  company_name: string
  client_contact_name: string
  client_contact_email: string
}

interface ShortlistEmail {
  subject: string
  body: string
  recipients: string[]
}

// ============================================================================
// EMAIL PREVIEW MODAL
// ============================================================================

interface EmailPreviewModalProps {
  email: ShortlistEmail
  onClose: () => void
  onSend: () => void
  isSending: boolean
}

function EmailPreviewModal({ email, onClose, onSend, isSending }: EmailPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-black text-white p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Preview Email</h2>
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
          {/* Email Metadata */}
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Para:</span>
              <div className="mt-1 text-sm text-gray-900">
                {email.recipients.join(', ')}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Asunto:</span>
              <div className="mt-1 text-sm font-medium text-gray-900">{email.subject}</div>
            </div>
          </div>

          {/* Email Body */}
          <div className="border-t border-gray-200 pt-6">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              disabled={isSending}
            >
              Cancelar
            </button>
            <button
              onClick={onSend}
              className="px-6 py-3 bg-purple text-white font-medium rounded-lg hover:bg-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSending}
            >
              {isSending ? 'Enviando...' : 'Enviar Shortlist'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ShortlistGeneratorPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [positionDetails, setPositionDetails] = useState<PositionDetails | null>(null)
  const [candidates, setCandidates] = useState<QualifiedCandidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [emailPreview, setEmailPreview] = useState<ShortlistEmail | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Load qualified candidates from Supabase
  useEffect(() => {
    if (code) {
      loadCandidates(code)
    }
  }, [code])

  const loadCandidates = async (positionCode: string) => {
    setIsLoading(true)
    try {
      const data = await applicantService.getQualifiedApplicants(positionCode)
      // Map to include selected flag
      const candidatesWithSelection = (data || []).map((c: any) => ({
        ...c,
        selected: false,
      }))
      setCandidates(candidatesWithSelection)

      // Extract position details from first candidate if available
      if (data && data.length > 0 && data[0].positions) {
        setPositionDetails({
          position_code: data[0].positions.position_code,
          position_name: data[0].positions.position_name,
          company_name: data[0].positions.company_name,
          client_contact_name: '', // Not available in applicants table
          client_contact_email: '', // Not available in applicants table
        } as any)
      }
    } catch (error) {
      console.error('Failed to load candidates:', error)
      alert('Error al cargar candidatos calificados')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const handleToggleCandidate = (candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, selected: !c.selected } : c))
    )
  }

  const handleSelectAll = () => {
    const allSelected = candidates.every((c) => c.selected)
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: !allSelected })))
  }

  const generateEmail = (): ShortlistEmail => {
    const selectedCandidates = candidates.filter((c) => c.selected)

    const candidatesHtml = selectedCandidates
      .map(
        (candidate, index) => `
      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">
          ${index + 1}. ${candidate.full_name}
        </h3>
        <div style="margin-bottom: 8px;">
          <strong>Puntuación:</strong> ${candidate.score}/100
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Contacto:</strong> ${candidate.email} | ${candidate.phone}
        </div>
        ${
          candidate.linkedin_url
            ? `<div style="margin-bottom: 8px;">
          <strong>LinkedIn:</strong> <a href="${candidate.linkedin_url}" style="color: #7c3aed;">${candidate.linkedin_url}</a>
        </div>`
            : ''
        }
        <div style="margin-bottom: 8px;">
          <strong>CV:</strong> <a href="${candidate.cv_url}" style="color: #7c3aed;">Descargar CV</a>
        </div>
        ${
          candidate.notes
            ? `<div style="margin-top: 12px; padding: 12px; background-color: white; border-left: 3px solid #7c3aed; border-radius: 4px;">
          <strong>Evaluación:</strong><br/>
          ${candidate.notes}
        </div>`
            : ''
        }
      </div>
    `
      )
      .join('')

    const subject = `Shortlist de Candidatos - ${positionDetails?.position_name || code}`

    const body = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #000000; margin-bottom: 8px;">Shortlist de Candidatos</h1>
        <p style="color: #6b7280; margin-bottom: 32px;">
          Posición: <strong>${positionDetails?.position_name || code}</strong><br/>
          Empresa: <strong>${positionDetails?.company_name || 'N/A'}</strong><br/>
          Código: <strong style="font-family: monospace;">${code}</strong>
        </p>

        <p style="color: #1f2937; margin-bottom: 24px;">
          Estimado/a ${positionDetails?.client_contact_name || 'Cliente'},
        </p>

        <p style="color: #1f2937; margin-bottom: 24px;">
          Tras un exhaustivo proceso de revisión, hemos seleccionado a los siguientes ${selectedCandidates.length} candidatos que mejor se ajustan al perfil solicitado para la posición de <strong>${positionDetails?.position_name || code}</strong>.
        </p>

        <h2 style="color: #000000; margin-top: 32px; margin-bottom: 16px; font-size: 20px;">
          Candidatos Seleccionados
        </h2>

        ${candidatesHtml}

        <div style="margin-top: 32px; padding: 16px; background-color: #eff6ff; border-left: 4px solid #06b6d4; border-radius: 4px;">
          <p style="margin: 0; color: #1f2937;">
            <strong>Próximos Pasos:</strong><br/>
            Por favor, revise los perfiles de los candidatos y confírmenos cuáles le gustaría entrevistar.
            Quedamos a su disposición para coordinar las entrevistas o responder cualquier consulta.
          </p>
        </div>

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Saludos cordiales,</p>
          <p style="margin: 8px 0 0 0;"><strong style="color: #7c3aed;">Prisma Talent</strong></p>
        </div>
      </div>
    `

    return {
      subject,
      body,
      recipients: positionDetails?.client_contact_email
        ? [positionDetails.client_contact_email]
        : [],
    }
  }

  const handlePreviewEmail = () => {
    const email = generateEmail()
    setEmailPreview(email)
  }

  const handleSendEmail = async () => {
    if (!emailPreview) return

    setIsSending(true)
    try {
      // TODO: API call to send email
      console.log('Sending shortlist email:', emailPreview)
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call
      alert('Shortlist enviado exitosamente')
      setEmailPreview(null)
      navigate('/admin/positions')
    } catch (error) {
      console.error('Failed to send email:', error)
      alert('Error al enviar el shortlist')
    } finally {
      setIsSending(false)
    }
  }

  const selectedCount = candidates.filter((c) => c.selected).length
  const allSelected = candidates.length > 0 && candidates.every((c) => c.selected)

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
                onClick={() => navigate('/admin/positions')}
                className="hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-purple)' }}
              >
                ← Posiciones
              </button>
              <span className="text-2xl text-gray-400">|</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                Shortlist Generator
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
        {/* Position Summary */}
        {positionDetails && (
          <Card className="p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Posición</h3>
                <p className="text-lg font-bold text-black">{positionDetails.position_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Empresa</h3>
                <p className="text-lg font-bold text-black">{positionDetails.company_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Cliente</h3>
                <p className="text-lg font-bold text-black">
                  {positionDetails.client_contact_name}
                </p>
                <p className="text-sm text-gray-600">{positionDetails.client_contact_email}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Selection Controls */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                {allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </button>
              <span className="text-sm text-gray-600">
                {selectedCount} de {candidates.length} candidatos seleccionados
              </span>
            </div>

            <Button
              onClick={handlePreviewEmail}
              variant="primary"
              disabled={selectedCount === 0}
            >
              Preview Shortlist
            </Button>
          </div>
        </Card>

        {/* Candidates List */}
        {isLoading ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-bold text-black mb-2">Cargando candidatos...</h3>
            </div>
          </Card>
        ) : candidates.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-black mb-2">
                No hay candidatos calificados
              </h3>
              <p className="text-gray-600 mb-6">
                Primero debe calificar candidatos en la sección de Candidate Review
              </p>
              <Button onClick={() => navigate(`/admin/candidates/${code}`)}>
                Ir a Candidate Review
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <Card
                key={candidate.id}
                className={`p-6 cursor-pointer transition-all ${
                  candidate.selected
                    ? 'ring-2 ring-purple bg-purple/5'
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleToggleCandidate(candidate.id)}
              >
                <div className="flex items-start justify-between">
                  {/* Candidate Info */}
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={candidate.selected}
                          onChange={() => handleToggleCandidate(candidate.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-purple border-gray-300 rounded focus:ring-purple cursor-pointer"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-black">
                            {candidate.full_name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <span className="text-2xl font-bold text-purple">
                              {candidate.score}
                            </span>
                            <span className="text-sm text-gray-500">/100</span>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Email:</span>{' '}
                            <span className="text-gray-900">{candidate.email}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Teléfono:</span>{' '}
                            <span className="text-gray-900">{candidate.phone}</span>
                          </div>
                          {candidate.linkedin_url && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600">LinkedIn:</span>{' '}
                              <a
                                href={candidate.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple hover:text-purple/80"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Ver perfil →
                              </a>
                            </div>
                          )}
                        </div>

                        {candidate.notes && (
                          <div className="bg-gray-50 border-l-4 border-purple p-3 rounded text-sm text-gray-700">
                            <span className="font-medium">Evaluación:</span> {candidate.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4">
                    <a
                      href={candidate.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cyan hover:text-cyan/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver CV →
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Email Preview Modal */}
      {emailPreview && (
        <EmailPreviewModal
          email={emailPreview}
          onClose={() => setEmailPreview(null)}
          onSend={handleSendEmail}
          isSending={isSending}
        />
      )}
    </div>
  )
}
