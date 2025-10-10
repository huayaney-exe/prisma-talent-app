/**
 * Job Listing Page - Public job posting detail page
 * Route: /job/:code
 *
 * Displays position details and job description for published positions
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { positionService } from '@/services/positionService'
import { Button, Card } from '@/components/ui'
import type { Position } from '@/types'

// ============================================================================
// COMPONENT
// ============================================================================

export function JobListingPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [position, setPosition] = useState<Position | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ============================================================================
  // LOAD POSITION
  // ============================================================================

  useEffect(() => {
    const loadPosition = async () => {
      if (!code) {
        setError('Código de posición no válido')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const positionData = await positionService.getPositionByCode(code)

        // Verify position is published
        if (positionData.workflow_stage !== 'active') {
          setError('Esta posición aún no está publicada')
          setIsLoading(false)
          return
        }

        setPosition(positionData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la posición')
      } finally {
        setIsLoading(false)
      }
    }

    loadPosition()
  }, [code])

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-prisma-section flex items-center justify-center">
        <Card className="max-w-md w-full p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando posición...</p>
          </div>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error || !position) {
    return (
      <div className="min-h-screen bg-prisma-section flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-black mb-2">Posición No Encontrada</h2>
            <p className="text-gray-600 mb-6">{error || 'Esta posición no existe'}</p>
            <Button onClick={() => navigate('/')} variant="primary">
              Volver al Inicio
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // RENDER JOB LISTING
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
                Prisma Talent
              </span>
            </div>
            <div className="font-mono text-sm" style={{ color: 'var(--color-gray-400)' }}>
              {position.position_code}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* Job Header Card */}
        <Card className="mb-8 p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-black mb-4">
                {position.position_name}
              </h1>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="px-4 py-2 bg-purple/10 text-purple text-sm font-medium rounded-full">
                  {position.area}
                </span>
                <span className="px-4 py-2 bg-cyan/10 text-cyan text-sm font-medium rounded-full">
                  {position.seniority}
                </span>
                <span className="px-4 py-2 bg-pink/10 text-pink text-sm font-medium rounded-full">
                  {position.contract_type}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200">
            <div>
              <div className="text-sm text-gray-600 mb-1">💰 Compensación</div>
              <div className="font-semibold text-black">{position.salary_range}</div>
              {position.equity_included && (
                <div className="text-sm text-purple mt-1">+ Equity</div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">📍 Modalidad</div>
              <div className="font-semibold text-black">
                {position.work_arrangement || 'A definir'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">📅 Inicio</div>
              <div className="font-semibold text-black">
                {position.target_fill_date
                  ? new Date(position.target_fill_date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                    })
                  : 'A definir'}
              </div>
            </div>
          </div>

          {/* Apply CTA */}
          <Button
            onClick={() => navigate(`/apply/${position.position_code}`)}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Aplicar a Esta Posición
          </Button>
        </Card>

        {/* Job Description */}
        <Card className="mb-8 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">Descripción del Puesto</h2>

          {/* If JD is available, render it */}
          {position.job_description_content ? (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: position.job_description_content }}
            />
          ) : (
            <div className="space-y-6">
              {/* Fallback: Display structured data from forms */}
              <div>
                <h3 className="text-xl font-bold text-black mb-3">Sobre la Posición</h3>
                <p className="text-gray-700 leading-relaxed">
                  Estamos buscando un/a <strong>{position.position_name}</strong> con nivel{' '}
                  <strong>{position.seniority}</strong> para unirse a nuestro equipo en el área de{' '}
                  <strong>{position.area}</strong>.
                </p>
              </div>

              {position.critical_notes && (
                <div>
                  <h3 className="text-xl font-bold text-black mb-3">Notas Importantes</h3>
                  <p className="text-gray-700 leading-relaxed">{position.critical_notes}</p>
                </div>
              )}

              {position.area_specific_data && (
                <div>
                  <h3 className="text-xl font-bold text-black mb-3">Especificaciones Técnicas</h3>
                  <div className="space-y-4">
                    {Object.entries(position.area_specific_data).map(([key, value]) => (
                      <div key={key} className="border-l-4 border-purple pl-4">
                        <div className="text-sm text-gray-600 font-medium capitalize mb-1">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-gray-800">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-black mb-3">Compensación y Beneficios</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-purple mr-2">•</span>
                    Salario: {position.salary_range}
                  </li>
                  {position.equity_included && position.equity_details && (
                    <li className="flex items-start">
                      <span className="text-purple mr-2">•</span>
                      Equity: {position.equity_details}
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="text-purple mr-2">•</span>
                    Modalidad: {position.work_arrangement || 'Flexible'}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </Card>

        {/* Application CTA */}
        <Card className="p-8 bg-purple text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">¿Te interesa esta oportunidad?</h2>
            <p className="text-purple-100 mb-6 text-lg">
              Envíanos tu CV y nos pondremos en contacto contigo lo antes posible
            </p>
            <Button
              onClick={() => navigate(`/apply/${position.position_code}`)}
              variant="secondary"
              size="lg"
            >
              Aplicar Ahora
            </Button>
          </div>
        </Card>

        {/* Company Info (if available) */}
        {position.company_id && (
          <Card className="mt-8 p-8">
            <h3 className="text-xl font-bold text-black mb-4">Sobre la Empresa</h3>
            <p className="text-gray-600">
              Esta posición es parte del programa de Community-Validated Hiring de Prisma Talent.
              Trabajarás con empresas de alto crecimiento en el ecosistema de producto digital.
            </p>
          </Card>
        )}
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
                  Prisma Talent
                </span>
                <img src="/assets/trebol-lilac.svg" alt="Trébol" className="h-5 w-auto" />
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">Community-driven talent acquisition</p>
              <p className="text-sm text-gray-500 mt-1">
                Lima, Perú •{' '}
                <a
                  href="mailto:hello@getprisma.io"
                  className="hover:text-purple-400 transition-colors"
                >
                  hello@getprisma.io
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
