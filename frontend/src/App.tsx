/**
 * App - Main application component with routing
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth'
import { LandingPage, LeadFormPage, JobListingPage, ApplicationFormPage } from '@/pages'
import { AdminLoginPage, AdminDashboardPage, LeadManagementPage, PositionPipelinePage, JobDescriptionEditorPage, CandidateReviewPage, ShortlistGeneratorPage } from '@/pages/admin'
import { HRForm, BusinessLeaderForm } from '@/components/forms'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/lead" element={<LeadFormPage />} />
          <Route path="/job/:code" element={<JobListingPage />} />
          <Route path="/apply/:code" element={<ApplicationFormPage />} />

          {/* Client Dashboard Pages */}
          <Route
            path="/hr-form"
            element={
              <div className="min-h-screen bg-gray-50 py-12 px-4">
                <HRForm />
              </div>
            }
          />
          <Route
            path="/business-form"
            element={
              <div className="min-h-screen bg-gray-50 py-12 px-4">
                <BusinessLeaderForm positionCode={new URLSearchParams(window.location.search).get('code') || ''} />
              </div>
            }
          />

          {/* Admin Pages */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leads"
            element={
              <ProtectedRoute requireAdmin>
                <LeadManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/positions"
            element={
              <ProtectedRoute requireAdmin>
                <PositionPipelinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/positions/:code/edit"
            element={
              <ProtectedRoute requireAdmin>
                <JobDescriptionEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/candidates"
            element={
              <ProtectedRoute requireAdmin>
                <CandidateReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/candidates/:code"
            element={
              <ProtectedRoute requireAdmin>
                <CandidateReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shortlist/:code"
            element={
              <ProtectedRoute requireAdmin>
                <ShortlistGeneratorPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-black mb-4">404</h1>
                  <p className="text-gray-600 mb-6">Página no encontrada</p>
                  <a
                    href="/"
                    className="inline-flex items-center justify-center px-6 py-3 bg-purple text-white font-medium rounded-lg hover:bg-purple/90 transition-colors"
                  >
                    Volver al Inicio
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
