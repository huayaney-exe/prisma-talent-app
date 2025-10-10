/**
 * Landing Page - Beautiful Prisma-styled public marketing site with lead capture
 */
import { useNavigate } from 'react-router-dom'

export function LandingPage() {
  const navigate = useNavigate()

  const scrollToForm = () => {
    const formElement = document.getElementById('talent-request')
    formElement?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-50 glassmorphism-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <a href="https://saas.getprisma.io" target="_blank" rel="noopener noreferrer">
                <img
                  src="/assets/logo-4wtbg.svg"
                  alt="Prisma"
                  className="h-10 w-auto hover:opacity-80 transition-opacity"
                />
              </a>
              <span className="text-2xl text-gray-400">|</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                  Prisma Talent
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Material Lilac Background */}
      <section className="bg-prisma-hero py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            {/* Section Label */}
            <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full border-2" style={{
              borderColor: 'var(--color-purple)',
              background: 'rgba(131, 118, 255, 0.1)'
            }}>
              <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: 'var(--color-purple)' }}>
                Community Driven Talent Acquisition
              </span>
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight" style={{ color: 'var(--color-black)' }}>
              Encuentra el mejor talento en Product, Growth, Design y Tech en{' '}
              <span className="relative inline-block">
                <span style={{ color: 'var(--color-purple)' }}>10 días</span>
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-xl md:text-2xl mb-6 max-w-4xl mx-auto" style={{ color: 'var(--color-gray-700)' }}>
              Acceso exclusivo a <strong style={{ color: 'var(--color-black)' }}>+2500 profesionales verificados</strong> de
              nuestra comunidad curada. Validación comunitaria, introduciones warm y assessment cultural
              superior.
            </p>
            <p className="text-lg md:text-xl font-semibold mb-10" style={{ color: 'var(--color-purple)' }}>
              Community-validated hiring con expertise especializado.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={scrollToForm}
                className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{
                  background: 'var(--color-cyan)',
                  color: 'var(--color-black)'
                }}
              >
                Acceder a la comunidad
              </button>
              <div className="flex items-center px-4 py-2 rounded-lg" style={{
                background: 'rgba(131, 118, 255, 0.1)',
                border: '1px solid rgba(131, 118, 255, 0.2)',
                fontFamily: 'var(--font-mono)'
              }}>
                <span className="font-bold" style={{ color: 'var(--color-cyan)' }}>10 días</span>
                <span className="mx-2" style={{ color: 'var(--color-gray-600)' }}>vs</span>
                <span className="line-through" style={{ color: 'var(--color-gray-500)' }}>2+ meses</span>
                <span className="ml-2" style={{ color: 'var(--color-gray-600)' }}>búsqueda tradicional</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition with Material Lilac Background */}
      <section className="bg-prisma-section py-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full border-2" style={{
              borderColor: 'var(--color-purple)',
              background: 'rgba(131, 118, 255, 0.1)'
            }}>
              <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: 'var(--color-purple)' }}>
                La Ventaja de Prisma
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--color-black)' }}>
              Community-validated hiring para Product, Growth, Design y Tech
            </h2>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Benefit Card 1 */}
            <div className="card-prisma p-10 text-center group">
              <div className="text-6xl mb-6">✅</div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-black)' }}>
                Community-Validated Candidates
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--color-gray-700)' }}>
                Acceso a +2500 profesionales verificados de nuestra comunidad curada, pre-validados a
                través de eventos y interacciones profesionales.
              </p>
            </div>

            {/* Benefit Card 2 */}
            <div className="card-prisma p-10 text-center group">
              <div className="text-6xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-black)' }}>
                Domain Specialization
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--color-gray-700)' }}>
                Expertise profundo en Product, Growth y Design desde eventos líderes de industria (Coffee
                Meetups, Product Nights, World Product Day).
              </p>
            </div>

            {/* Benefit Card 3 */}
            <div className="card-prisma p-10 text-center group">
              <div className="text-6xl mb-6">🤝</div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-black)' }}>
                Relationship Ecosystem
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--color-gray-700)' }}>
                Introducciones warm través de relaciones profesionales existentes vs. cold outreach,
                leveraging Leadership Circle de ejecutivos senior.
              </p>
            </div>

            {/* Benefit Card 4 */}
            <div className="card-prisma p-10 text-center group">
              <div className="text-6xl mb-6">🧠</div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-black)' }}>
                Framing Methodology
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--color-gray-700)' }}>
                Consultoría para definición de roles bajo metodología específica para producto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section with Material Lilac Background */}
      <section id="talent-request" className="bg-prisma-form py-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Form Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full border-2" style={{
              borderColor: 'var(--color-purple)',
              background: 'rgba(131, 118, 255, 0.1)'
            }}>
              <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: 'var(--color-purple)' }}>
                Conecta con Nuestra Comunidad
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--color-black)' }}>
              Community-validated hiring + consultoría para definición de roles
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-gray-700)' }}>
              Información básica para acceder a +2500 profesionales verificados con introduciones warm y
              cultural intelligence. <strong>Sin compromiso.</strong>
            </p>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={() => navigate('/lead')}
              className="inline-flex items-center px-10 py-5 rounded-xl font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                background: 'var(--color-cyan)',
                color: 'var(--color-black)',
                boxShadow: '0 10px 40px rgba(71, 255, 191, 0.3)'
              }}
            >
              <span>Comenzar Solicitud</span>
              <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <p className="mt-6 text-sm" style={{ color: 'var(--color-gray-600)' }}>
              Te contactaremos en ≤24 horas para agendar una llamada de 15 minutos
            </p>
          </div>
        </div>
      </section>

      {/* Footer with Talent Purple Accent */}
      <footer style={{
        background: 'var(--color-gray-900)',
        borderTop: '2px solid var(--color-purple)',
        color: 'var(--color-white)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Footer Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="/assets/logo-4dkbg.svg"
                alt="Prisma"
                className="h-8 w-auto opacity-90"
              />
              <span className="text-xl" style={{ color: 'var(--color-gray-500)' }}>|</span>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold" style={{ color: 'var(--color-purple)' }}>
                  Prisma Talent
                </span>
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center md:text-right">
              <p style={{ color: 'var(--color-gray-400)' }}>Community-driven talent acquisition</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-gray-500)' }}>
                Lima, Perú •{' '}
                <a
                  href="mailto:hello@getprisma.io"
                  className="hover:underline"
                  style={{ color: 'var(--color-purple)' }}
                >
                  hello@getprisma.io
                </a>
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 text-center text-sm" style={{
            borderTop: '1px solid var(--color-gray-800)',
            color: 'var(--color-gray-600)'
          }}>
            © {new Date().getFullYear()} Prisma. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
