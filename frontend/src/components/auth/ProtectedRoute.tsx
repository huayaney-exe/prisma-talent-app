/**
 * Protected Route - Authentication guard for admin pages
 * Redirects to login if user is not authenticated
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

// ============================================================================
// LOADING COMPONENT
// ============================================================================

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-radial from-purple/5 via-transparent to-transparent">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-gray-600">Verificando autenticación...</p>
      </div>
    </div>
  )
}

// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Check admin permission if required
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-radial from-purple/5 via-transparent to-transparent">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-purple/10">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-black mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">
            No tienes permisos de administrador para acceder a esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-purple text-white rounded-lg font-semibold hover:bg-purple/90 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  // Render protected content
  return <>{children}</>
}
