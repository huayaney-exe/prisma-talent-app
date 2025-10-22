/**
 * Client List Page - View and manage all business clients
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'

// ============================================================================
// TYPES
// ============================================================================

interface Company {
  id: string
  company_name: string
  company_domain: string
  primary_contact_name: string
  primary_contact_email: string
  subscription_status: 'trial' | 'active' | 'inactive' | 'cancelled'
  subscription_plan: 'basic' | 'professional' | 'enterprise'
  created_at: string
  onboarding_completed: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientListPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select(`
          id,
          company_name,
          company_domain,
          primary_contact_name,
          primary_contact_email,
          subscription_status,
          subscription_plan,
          created_at,
          onboarding_completed
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleDelete = async (id: string, companyName: string) => {
    if (!confirm(`¿Eliminar "${companyName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      setDeleting(id)
      const { error } = await supabase.from('companies').delete().eq('id', id)

      if (error) throw error

      // Refresh list
      await fetchCompanies()
      alert('Cliente eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Error al eliminar cliente. Ver consola para detalles.')
    } finally {
      setDeleting(null)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredCompanies = companies.filter((company) => {
    const query = searchQuery.toLowerCase()
    return (
      company.company_name.toLowerCase().includes(query) ||
      company.company_domain.toLowerCase().includes(query) ||
      company.primary_contact_email.toLowerCase().includes(query)
    )
  })

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getStatusBadge = (status: string) => {
    const styles = {
      trial: 'bg-cyan/10 text-cyan border border-cyan/20',
      active: 'bg-green-500/10 text-green-600 border border-green-500/20',
      inactive: 'bg-gray-500/10 text-gray-600 border border-gray-500/20',
      cancelled: 'bg-red-500/10 text-red-600 border border-red-500/20',
    }

    const labels = {
      trial: 'Trial',
      active: 'Activo',
      inactive: 'Inactivo',
      cancelled: 'Cancelado',
    }

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 24) return `hace ${hours} horas`
    if (days < 7) return `hace ${days} días`
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
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
              <button onClick={() => navigate('/admin')} className="hover:opacity-80 transition-opacity">
                <img src="/assets/logo-4wtbg.svg" alt="Prisma" className="h-10 w-auto" />
              </button>
              <span className="text-2xl text-gray-400">|</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                Clientes
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Admin</p>
                <p className="font-medium text-gray-700">{user?.email}</p>
              </div>
              <Button onClick={handleSignOut} variant="secondary" size="md">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes Activos</h1>
              <p className="text-gray-600">
                {filteredCompanies.length} {filteredCompanies.length === 1 ? 'cliente' : 'clientes'}
                {searchQuery && ' encontrados'}
              </p>
            </div>
            <Button onClick={() => navigate('/admin/clients/new')} variant="primary" size="lg">
              + Crear Nuevo Cliente
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, dominio o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando clientes...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCompanies.length === 0 && !searchQuery && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay clientes registrados</h3>
            <p className="text-gray-600 mb-6">Comienza creando tu primer cliente empresarial</p>
            <Button onClick={() => navigate('/admin/clients/new')} variant="primary" size="lg">
              Crear Primer Cliente
            </Button>
          </Card>
        )}

        {/* No Search Results */}
        {!loading && filteredCompanies.length === 0 && searchQuery && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-600 mb-4">
              No hay clientes que coincidan con "{searchQuery}"
            </p>
            <Button onClick={() => setSearchQuery('')} variant="secondary" size="md">
              Limpiar búsqueda
            </Button>
          </Card>
        )}

        {/* Companies Grid */}
        {!loading && filteredCompanies.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Company Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{company.company_name}</h3>
                  <p className="text-sm text-gray-600">{company.company_domain}</p>
                </div>

                {/* Contact Info */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-700 font-medium mb-1">{company.primary_contact_name}</p>
                  <p className="text-xs text-gray-600">{company.primary_contact_email}</p>
                </div>

                {/* Status and Metadata */}
                <div className="flex items-center justify-between mb-4">
                  {getStatusBadge(company.subscription_status)}
                  <span className="text-xs text-gray-500">{getRelativeTime(company.created_at)}</span>
                </div>

                <div className="mb-4">
                  <span className="text-xs text-gray-600">
                    Plan: <span className="font-medium capitalize">{company.subscription_plan}</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDelete(company.id, company.company_name)}
                    variant="secondary"
                    size="sm"
                    disabled={deleting === company.id}
                    className="flex-1"
                  >
                    {deleting === company.id ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
