/**
 * Protected Route - Route guard for authenticated pages
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth()

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // NOT AUTHENTICATED
  // ============================================================================

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  // ============================================================================
  // NOT ADMIN (when required)
  // ============================================================================

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-black mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-6">
              No tienes permisos para acceder a esta página
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-purple text-white font-medium rounded-lg hover:bg-purple/90 transition-colors"
            >
              Volver al Inicio
            </a>
          </div>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // AUTHORIZED
  // ============================================================================

  return <>{children}</>
}
