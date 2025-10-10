/**
 * Client Dashboard Page - Client portal home
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'

export function ClientDashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [company, setCompany] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCompanyData()
  }, [user?.id])

  const loadCompanyData = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('primary_contact_auth_id', user.id)
        .single()

      if (error) throw error
      setCompany(data)
    } catch (error) {
      console.error('Failed to load company:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/client/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-prisma-section flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-prisma-section">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🏢</span>
              <span className="text-lg font-semibold text-purple">
                {company?.company_name || 'Portal de Cliente'}
              </span>
            </div>
            <Button onClick={handleSignOut} variant="secondary" size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Welcome Card */}
        <Card className="p-8 mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            ¡Bienvenido, {user?.user_metadata?.full_name || user?.email}!
          </h1>
          <p className="text-gray-600">
            Gestiona tus posiciones y solicitudes de contratación
          </p>
        </Card>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Position */}
          <Card className="p-6 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-bold text-black mb-2">
              Crear Nueva Posición
            </h2>
            <p className="text-gray-600 mb-4">
              Completa el formulario para iniciar una nueva búsqueda de talento
            </p>
            <Button
              onClick={() => navigate('/hr-form')}
              fullWidth
            >
              Ir al Formulario HR
            </Button>
          </Card>

          {/* View Positions */}
          <Card className="p-6 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-black mb-2">
              Mis Posiciones
            </h2>
            <p className="text-gray-600 mb-4">
              Ver el estado de todas tus solicitudes de contratación
            </p>
            <Button
              onClick={() => navigate('/client/positions')}
              variant="secondary"
              fullWidth
            >
              Ver Posiciones
            </Button>
          </Card>

          {/* Company Info */}
          <Card className="p-6">
            <div className="text-4xl mb-4">🏢</div>
            <h2 className="text-xl font-bold text-black mb-2">
              Información de la Empresa
            </h2>
            <div className="space-y-2 text-sm">
              <p><strong>Empresa:</strong> {company?.company_name}</p>
              <p><strong>Industria:</strong> {company?.industry || '-'}</p>
              <p><strong>Tamaño:</strong> {company?.company_size || '-'}</p>
              <p><strong>Estado:</strong> <span className="text-green-600">{company?.subscription_status}</span></p>
            </div>
          </Card>

          {/* Support */}
          <Card className="p-6">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-black mb-2">
              Soporte
            </h2>
            <p className="text-gray-600 mb-4">
              ¿Necesitas ayuda? Contacta a tu account manager
            </p>
            <Button
              onClick={() => window.location.href = 'mailto:support@getprisma.io'}
              variant="secondary"
              fullWidth
            >
              Contactar Soporte
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
