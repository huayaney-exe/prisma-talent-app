/**
 * Admin Login Page - Authentication for Prisma admins
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Input, Button, Card } from '@/components/ui'

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setApiError(null)

    try {
      await signIn(data.email, data.password)
      navigate('/admin')
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Error al iniciar sesión'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-prisma-section flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <img src="/assets/logo-4wtbg.svg" alt="Prisma" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-black mb-2">Admin Login</h1>
          <p className="text-gray-600">Prisma Talent Platform</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            required
            placeholder="admin@prisma.com"
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {apiError && (
            <div className="p-4 bg-pink/10 border border-pink rounded-lg">
              <p className="text-pink text-sm">{apiError}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-purple transition-colors"
          >
            ← Volver al inicio
          </a>
        </div>
      </Card>
    </div>
  )
}
