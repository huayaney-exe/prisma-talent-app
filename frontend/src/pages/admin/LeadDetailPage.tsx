/**
 * Lead Detail Page - View and manage individual lead
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'
import { leadService } from '@/services/leadService'

// ============================================================================
// TYPES
// ============================================================================

interface Lead {
  id: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  contact_position?: string
  company_name: string
  industry?: string
  company_size?: string
  intent: 'hiring' | 'conversation'
  role_title?: string
  role_type?: string
  seniority?: string
  work_mode?: string
  urgency?: string
  created_at: string
  updated_at?: string
  status: 'pending' | 'approved' | 'rejected'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load lead data
  useEffect(() => {
    if (leadId) {
      loadLead()
    }
  }, [leadId])

  const loadLead = async () => {
    if (!leadId) return

    setIsLoading(true)
    try {
      const data = await leadService.getLeadById(leadId)
      setLead(data)
    } catch (error) {
      console.error('Failed to load lead:', error)
      alert('Error al cargar el lead')
      navigate('/admin/leads')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!lead) return

    const confirmed = confirm('¿Aprobar este lead?')
    if (!confirmed) return

    setIsProcessing(true)
    try {
      await leadService.approveLead(lead.id)
      alert('✅ Lead aprobado exitosamente')
      await loadLead() // Refresh data
    } catch (error) {
      console.error('Failed to approve lead:', error)
      alert('❌ Error al aprobar el lead')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!lead) return

    const reason = prompt('¿Razón para rechazar este lead? (opcional)')
    if (reason === null) return // User cancelled

    setIsProcessing(true)
    try {
      await leadService.rejectLead(lead.id)
      alert('✅ Lead rechazado')
      await loadLead() // Refresh data
    } catch (error) {
      console.error('Failed to reject lead:', error)
      alert('❌ Error al rechazar el lead')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateClient = async () => {
    if (!lead) return

    const confirmed = confirm(
      '¿Crear cuenta de cliente?\n\n' +
        'Se enviará un email de invitación con magic link para acceder a la plataforma.\n\n' +
        `Email: ${lead.contact_email}`
    )
    if (!confirmed) return

    setIsProcessing(true)
    try {
      await leadService.convertLeadToClient(lead.id)
      alert('✅ Cuenta de cliente creada exitosamente!\n\nEmail de invitación enviado.')
      await loadLead() // Refresh data
    } catch (error) {
      console.error('Failed to create client:', error)
      alert('❌ Error al crear cuenta de cliente:\n\n' + (error as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }

    return (
      <span
        className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    )
  }

  const getIntentBadge = (intent: string) => {
    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          intent === 'hiring' ? 'bg-purple/10 text-purple' : 'bg-cyan/10 text-cyan'
        }`}
      >
        {intent}
      </span>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-prisma-section flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-xl font-bold text-black mb-2">Cargando lead...</h3>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-prisma-section flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-black mb-2">Lead no encontrado</h3>
          <Button onClick={() => navigate('/admin/leads')} className="mt-4">
            Volver a Leads
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-prisma-section">
      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-50 glassmorphism-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin/leads')}
                className="hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-purple)' }}
              >
                ← Volver a Leads
              </button>
              <span className="text-2xl text-gray-400">|</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                Lead Detail
              </span>
            </div>
            <Button onClick={handleSignOut} variant="secondary" size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Status and Actions */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Estado</div>
                {getStatusBadge(lead.status)}
              </div>
              <div className="h-12 w-px bg-gray-200"></div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Intento</div>
                {getIntentBadge(lead.intent)}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {lead.status === 'pending' && (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    ✅ Aprobar
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={isProcessing}
                    variant="secondary"
                    className="bg-pink hover:bg-pink/80 text-white"
                  >
                    ❌ Rechazar
                  </Button>
                </>
              )}
              {lead.status === 'approved' && (
                <Button
                  onClick={handleCreateClient}
                  disabled={isProcessing}
                  className="bg-purple hover:bg-purple/80"
                >
                  🎯 Crear Cliente
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-black mb-4 flex items-center">
              <span className="text-2xl mr-2">👤</span>
              Información de Contacto
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Nombre</div>
                <div className="text-base font-medium text-gray-900">{lead.contact_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="text-base font-medium text-gray-900">{lead.contact_email}</div>
              </div>
              {lead.contact_phone && (
                <div>
                  <div className="text-sm text-gray-500">Teléfono</div>
                  <div className="text-base font-medium text-gray-900">{lead.contact_phone}</div>
                </div>
              )}
              {lead.contact_position && (
                <div>
                  <div className="text-sm text-gray-500">Cargo</div>
                  <div className="text-base font-medium text-gray-900">{lead.contact_position}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Company Information */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-black mb-4 flex items-center">
              <span className="text-2xl mr-2">🏢</span>
              Información de Empresa
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Empresa</div>
                <div className="text-base font-medium text-gray-900">{lead.company_name}</div>
              </div>
              {lead.industry && (
                <div>
                  <div className="text-sm text-gray-500">Industria</div>
                  <div className="text-base font-medium text-gray-900">{lead.industry}</div>
                </div>
              )}
              {lead.company_size && (
                <div>
                  <div className="text-sm text-gray-500">Tamaño</div>
                  <div className="text-base font-medium text-gray-900">{lead.company_size}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Role Information (if hiring intent) */}
          {lead.intent === 'hiring' && (
            <Card className="p-6 lg:col-span-2">
              <h3 className="text-xl font-bold text-black mb-4 flex items-center">
                <span className="text-2xl mr-2">💼</span>
                Información del Rol
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {lead.role_title && (
                  <div>
                    <div className="text-sm text-gray-500">Título</div>
                    <div className="text-base font-medium text-gray-900">{lead.role_title}</div>
                  </div>
                )}
                {lead.role_type && (
                  <div>
                    <div className="text-sm text-gray-500">Tipo</div>
                    <div className="text-base font-medium text-gray-900">{lead.role_type}</div>
                  </div>
                )}
                {lead.seniority && (
                  <div>
                    <div className="text-sm text-gray-500">Seniority</div>
                    <div className="text-base font-medium text-gray-900">{lead.seniority}</div>
                  </div>
                )}
                {lead.work_mode && (
                  <div>
                    <div className="text-sm text-gray-500">Modalidad</div>
                    <div className="text-base font-medium text-gray-900">{lead.work_mode}</div>
                  </div>
                )}
                {lead.urgency && (
                  <div>
                    <div className="text-sm text-gray-500">Urgencia</div>
                    <div className="text-base font-medium text-gray-900">{lead.urgency}</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Metadata */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-xl font-bold text-black mb-4 flex items-center">
              <span className="text-2xl mr-2">📅</span>
              Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Fecha de Creación</div>
                <div className="text-base font-medium text-gray-900">
                  {new Date(lead.created_at).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {lead.updated_at && (
                <div>
                  <div className="text-sm text-gray-500">Última Actualización</div>
                  <div className="text-base font-medium text-gray-900">
                    {new Date(lead.updated_at).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Lead ID</div>
                <div className="text-xs font-mono text-gray-600">{lead.id}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
