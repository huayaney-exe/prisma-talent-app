/**
 * Lead Form Page - Beautiful Prisma-styled wrapper for LeadForm component
 */
import { LeadForm } from '@/components/forms'

export function LeadFormPage() {
  return (
    <div className="min-h-screen bg-prisma-form">
      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-50 glassmorphism-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <a href="/" className="hover:opacity-80 transition-opacity">
                <img
                  src="/assets/logo-4wtbg.svg"
                  alt="Prisma"
                  className="h-10 w-auto"
                />
              </a>
              <span className="text-2xl text-gray-400">|</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                  Prisma Talent
                </span>
              </div>
            </div>
            <a
              href="/"
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--color-purple)' }}
            >
              ← Volver al inicio
            </a>
          </div>
        </div>
      </header>

      {/* Form Section */}
      <div className="py-12 px-4">
        <LeadForm />
      </div>

      {/* Footer */}
      <footer style={{
        background: 'var(--color-gray-900)',
        borderTop: '2px solid var(--color-purple)',
        color: 'var(--color-white)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img src="/assets/logo-4dkbg.svg" alt="Prisma" className="h-6 w-auto opacity-90" />
              <span className="text-lg" style={{ color: 'var(--color-gray-500)' }}>|</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-purple)' }}>
                Prisma Talent
              </span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                Lima, Perú •{' '}
                <a href="mailto:hello@getprisma.io" className="hover:underline" style={{ color: 'var(--color-purple)' }}>
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
