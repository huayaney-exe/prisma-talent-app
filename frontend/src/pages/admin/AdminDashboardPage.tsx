/**
 * Admin Dashboard Page - Overview and navigation for Prisma admins
 */
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  // ============================================================================
  // DASHBOARD CARDS
  // ============================================================================

  const dashboardSections = [
    {
      title: 'New Business Client',
      description: 'Crear nueva cuenta de cliente empresarial directamente',
      icon: '🏢',
      path: '/admin/clients/new',
      color: 'bg-purple',
      textColor: 'text-purple',
    },
    {
      title: 'Lead Management',
      description: 'Gestionar solicitudes entrantes y aprobar nuevos clientes',
      icon: '📋',
      path: '/admin/leads',
      color: 'bg-cyan',
      textColor: 'text-cyan',
    },
    {
      title: 'Position Pipeline',
      description: 'Ver y gestionar todas las posiciones activas',
      icon: '🎯',
      path: '/admin/positions',
      color: 'bg-pink',
      textColor: 'text-pink',
    },
    {
      title: 'Candidate Review',
      description: 'Calificar candidatos y revisar aplicaciones',
      icon: '👥',
      path: '/admin/candidates',
      color: 'bg-gray-700',
      textColor: 'text-gray-700',
    },
  ]

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
              <a href="/" className="hover:opacity-80 transition-opacity">
                <img src="/assets/logo-4wtbg.svg" alt="Prisma" className="h-10 w-auto" />
              </a>
              <span className="text-2xl text-gray-400">|</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                Admin Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Bienvenido</p>
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
      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Leads Pendientes</div>
            <div className="text-3xl font-bold text-purple">0</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Posiciones Activas</div>
            <div className="text-3xl font-bold text-cyan">0</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Candidatos Nuevos</div>
            <div className="text-3xl font-bold text-pink">0</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Shortlists Pendientes</div>
            <div className="text-3xl font-bold text-purple">0</div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-black mb-6">Acciones Rápidas</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {dashboardSections.map((section) => (
              <Card
                key={section.path}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(section.path)}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-5xl">{section.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black mb-2">
                      {section.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {section.description}
                    </p>
                    <Button variant="primary" size="sm">
                      Abrir →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-black mb-6">Actividad Reciente</h2>
          <Card className="p-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-600">
                No hay actividad reciente para mostrar
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="py-12 px-4 mt-12"
        style={{
          background: 'var(--color-gray-900)',
          borderTop: '2px solid var(--color-purple)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <img src="/assets/logo-4dkbg.svg" alt="Prisma" className="h-8 w-auto" />
              <span className="text-2xl text-gray-600">|</span>
              <div className="flex items-center space-x-2">
                <span
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-purple)' }}
                >
                  Admin Dashboard
                </span>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">Prisma Talent Platform</p>
              <p className="text-sm text-gray-500 mt-1">
                © {new Date().getFullYear()} Prisma
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
