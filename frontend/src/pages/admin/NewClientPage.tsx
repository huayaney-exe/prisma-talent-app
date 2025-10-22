/**
 * New Client Page - Create business client directly
 *
 * Admin workflow to create company + HR user + send magic link invitation
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card, Input } from '@/components/ui'
import { clientService, type CreateClientData } from '@/services/clientService'

// ============================================================================
// TYPES
// ============================================================================

interface FormData extends CreateClientData {
  confirm_email: string // Email confirmation field
}

interface FormErrors {
  [key: string]: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NewClientPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    // Company Information
    company_name: '',
    company_domain: '',
    industry: '',
    company_size: undefined,
    website_url: '',
    linkedin_url: '',
    company_description: '',

    // Primary Contact
    primary_contact_name: '',
    primary_contact_email: '',
    confirm_email: '',
    primary_contact_phone: '',
    primary_contact_position: '',

    // Subscription
    subscription_plan: 'basic',
    trial_days: 30,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidatingDomain, setIsValidatingDomain] = useState(false)

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Required fields
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Nombre de empresa es requerido'
    }

    if (!formData.company_domain.trim()) {
      newErrors.company_domain = 'Dominio de empresa es requerido'
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(formData.company_domain)) {
      newErrors.company_domain = 'Formato de dominio inválido (ej: empresa.com)'
    }

    if (!formData.primary_contact_name.trim()) {
      newErrors.primary_contact_name = 'Nombre de contacto es requerido'
    }

    if (!formData.primary_contact_email.trim()) {
      newErrors.primary_contact_email = 'Email de contacto es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact_email)) {
      newErrors.primary_contact_email = 'Email inválido'
    }

    if (formData.primary_contact_email !== formData.confirm_email) {
      newErrors.confirm_email = 'Los emails no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleDomainBlur = async () => {
    if (!formData.company_domain.trim()) return

    setIsValidatingDomain(true)
    try {
      const isValid = await clientService.validateDomain(formData.company_domain)
      if (!isValid) {
        setErrors((prev) => ({
          ...prev,
          company_domain: 'Este dominio ya está registrado',
        }))
      }
    } catch (error) {
      console.error('Domain validation failed:', error)
    } finally {
      setIsValidatingDomain(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const confirmed = confirm(
      `¿Crear cuenta de cliente para ${formData.company_name}?\n\n` +
      `Se enviará un email de invitación con magic link a:\n${formData.primary_contact_email}`
    )

    if (!confirmed) return

    setIsSubmitting(true)

    try {
      const result = await clientService.createClient(formData)

      alert(result.message)

      // Redirect to company list or lead management
      navigate('/admin/leads')
    } catch (error) {
      console.error('Client creation failed:', error)
      alert(`❌ Error al crear cliente:\n${(error as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
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
              <button
                onClick={() => navigate('/admin')}
                className="hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-purple)' }}
              >
                ← Dashboard
              </button>
              <span className="text-2xl text-gray-400">|</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                Nuevo Cliente Empresarial
              </span>
            </div>
            <Button onClick={handleSignOut} variant="secondary" size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Instructions */}
        <Card className="p-6 mb-6" style={{ borderLeft: '4px solid var(--color-purple)' }}>
          <div className="flex items-start space-x-3">
            <div className="text-3xl">🏢</div>
            <div>
              <h3 className="font-bold text-lg text-black mb-2">Crear Nuevo Cliente</h3>
              <p className="text-sm text-gray-600 mb-2">
                Este proceso creará:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-5 list-disc">
                <li>Cuenta de empresa con período de prueba de 30 días</li>
                <li>Usuario HR administrador para el contacto principal</li>
                <li>Email con magic link para acceder a la plataforma</li>
              </ul>
              <p className="text-sm text-gray-600 mt-3">
                ⚠️ <strong>Importante:</strong> Verifica que el email esté correcto. El contacto
                recibirá un magic link para iniciar sesión.
              </p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Company Information */}
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-bold text-black mb-4">Información de la Empresa</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa <span className="text-pink">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="TechCorp S.A.C."
                  error={errors.company_name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dominio de la Empresa <span className="text-pink">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.company_domain}
                  onChange={(e) => handleChange('company_domain', e.target.value.toLowerCase())}
                  onBlur={handleDomainBlur}
                  placeholder="techcorp.com"
                  error={errors.company_domain}
                  disabled={isValidatingDomain}
                />
                {isValidatingDomain && (
                  <p className="text-xs text-gray-500 mt-1">Validando dominio...</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  El dominio debe ser único. Los emails corporativos deben terminar con este dominio.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industria
                  </label>
                  <Input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    placeholder="Tecnología, Finanzas, Retail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamaño de la Empresa
                  </label>
                  <select
                    value={formData.company_size || ''}
                    onChange={(e) => handleChange('company_size', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-purple transition-colors bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="1-10">1-10 empleados</option>
                    <option value="11-50">11-50 empleados</option>
                    <option value="51-200">51-200 empleados</option>
                    <option value="201-1000">201-1000 empleados</option>
                    <option value="1000+">1000+ empleados</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio Web
                  </label>
                  <Input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                    placeholder="https://techcorp.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn de la Empresa
                  </label>
                  <Input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => handleChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/company/techcorp"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Primary Contact */}
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-bold text-black mb-4">Contacto Principal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta persona será el administrador de la cuenta y recibirá el email de invitación.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo <span className="text-pink">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.primary_contact_name}
                  onChange={(e) => handleChange('primary_contact_name', e.target.value)}
                  placeholder="María López Rodríguez"
                  error={errors.primary_contact_name}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Corporativo <span className="text-pink">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.primary_contact_email}
                    onChange={(e) => handleChange('primary_contact_email', e.target.value.toLowerCase())}
                    placeholder="maria.lopez@techcorp.com"
                    error={errors.primary_contact_email}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Email <span className="text-pink">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.confirm_email}
                    onChange={(e) => handleChange('confirm_email', e.target.value.toLowerCase())}
                    placeholder="maria.lopez@techcorp.com"
                    error={errors.confirm_email}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <Input
                    type="tel"
                    value={formData.primary_contact_phone}
                    onChange={(e) => handleChange('primary_contact_phone', e.target.value)}
                    placeholder="+51 999 999 999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo
                  </label>
                  <Input
                    type="text"
                    value={formData.primary_contact_position}
                    onChange={(e) => handleChange('primary_contact_position', e.target.value)}
                    placeholder="HR Director, CHRO, Talent Lead..."
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Subscription Configuration */}
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-bold text-black mb-4">Configuración de Suscripción</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan de Suscripción
                </label>
                <select
                  value={formData.subscription_plan}
                  onChange={(e) => handleChange('subscription_plan', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-purple transition-colors bg-white"
                >
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Días de Prueba
                </label>
                <Input
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => handleChange('trial_days', parseInt(e.target.value) || 30)}
                  min="0"
                  max="90"
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isValidatingDomain}
            >
              {isSubmitting ? 'Creando Cliente...' : '🏢 Crear Cliente y Enviar Invitación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
