/**
 * Lead Management Page - View and manage incoming leads
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'
import { leadService } from '@/services/leadService'

// ============================================================================
// TYPES
// ============================================================================

interface LeadItem {
  id: string
  contact_name: string
  contact_email: string
  company_name: string
  intent: 'hiring' | 'conversation'
  role_title?: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LeadManagementPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [leads, setLeads] = useState<LeadItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // Load leads from Supabase
  useEffect(() => {
    loadLeads()
  }, [filter])

  const loadLeads = async () => {
    setIsLoading(true)
    try {
      const data = await leadService.getAllLeads(filter === 'all' ? undefined : filter)
      setLeads(data || [])
    } catch (error) {
      console.error('Failed to load leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (leadId: string) => {
    try {
      await leadService.approveLead(leadId)
      await loadLeads() // Refresh list
    } catch (error) {
      console.error('Failed to approve lead:', error)
      alert('Error al aprobar el lead')
    }
  }

  const handleReject = async (leadId: string) => {
    try {
      await leadService.rejectLead(leadId)
      await loadLeads() // Refresh list
    } catch (error) {
      console.error('Failed to reject lead:', error)
      alert('Error al rechazar el lead')
    }
  }

  const handleCreateClient = async (leadId: string) => {
    const confirmed = confirm(
      '¿Crear cuenta de cliente? Se enviará un email de invitación con magic link para acceder a la plataforma.'
    )
    if (!confirmed) return

    try {
      await leadService.convertLeadToClient(leadId)
      alert('✅ Cuenta de cliente creada. Email de invitación enviado.')
      await loadLeads() // Refresh list
    } catch (error) {
      console.error('Failed to create client:', error)
      alert('❌ Error al crear cuenta de cliente: ' + (error as Error).message)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const filteredLeads = leads

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
                Lead Management
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
            <div className="flex items-center space-x-4">
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-cyan text-black'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'approved'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Aprobados
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'rejected'
                    ? 'bg-pink text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rechazados
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            </div>
          </div>
        </Card>

        {/* Leads Table */}
        {isLoading ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-bold text-black mb-2">Cargando leads...</h3>
            </div>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-black mb-2">No hay leads</h3>
              <p className="text-gray-600">
                Los nuevos leads aparecerán aquí cuando se envíen solicitudes
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
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
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
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.contact_name}
                        </div>
                        <div className="text-sm text-gray-500">{lead.contact_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            lead.intent === 'hiring'
                              ? 'bg-purple/10 text-purple'
                              : 'bg-cyan/10 text-cyan'
                          }`}
                        >
                          {lead.intent}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.role_title || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            lead.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : lead.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {lead.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(lead.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Aprobar
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleReject(lead.id)}
                                className="text-pink hover:text-pink/80"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {lead.status === 'approved' && (
                            <>
                              <button
                                onClick={() => handleCreateClient(lead.id)}
                                className="text-purple hover:text-purple/80 font-semibold"
                                title="Create client account and send magic link"
                              >
                                🎯 Crear Cliente
                              </button>
                              <span className="text-gray-300">|</span>
                            </>
                          )}
                          <button
                            onClick={() => navigate(`/admin/leads/${lead.id}`)}
                            className="text-purple hover:text-purple/80"
                          >
                            Ver Detalles
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
