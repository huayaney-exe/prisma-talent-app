/**
 * Client Login Page - Magic Link Authentication
 * Clients login via magic link sent to their email
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button, Card, Input } from '@/components/ui'

export function ClientLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_APP_URL}/client/dashboard`,
        },
      })

      if (error) throw error

      setEmailSent(true)
    } catch (error) {
      console.error('Magic link error:', error)
      alert('Error al enviar magic link: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-prisma-section flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8">
        {!emailSent ? (
          <>
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔐</div>
              <h1 className="text-3xl font-bold text-black mb-2">
                Portal de Clientes
              </h1>
              <p className="text-gray-600">
                Ingresa tu email para recibir un link de acceso
              </p>
            </div>

            <form onSubmit={handleMagicLinkLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : '📧 Enviar Magic Link'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Eres administrador?{' '}
                <button
                  onClick={() => navigate('/admin/login')}
                  className="text-purple hover:underline font-medium"
                >
                  Ir al portal admin
                </button>
              </p>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">📬</div>
            <h2 className="text-2xl font-bold text-black mb-4">
              ¡Revisa tu email!
            </h2>
            <p className="text-gray-600 mb-6">
              Hemos enviado un link de acceso a <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              El link es válido por 1 hora. Revisa tu bandeja de spam si no lo ves.
            </p>
            <Button
              onClick={() => setEmailSent(false)}
              variant="secondary"
              fullWidth
            >
              Volver
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
