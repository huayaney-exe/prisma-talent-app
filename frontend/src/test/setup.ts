/**
 * Test Setup - Vitest configuration with mocks
 */
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// ============================================================================
// CLEANUP
// ============================================================================

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ============================================================================
// MOCK API CLIENT
// ============================================================================

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
  isAuthenticated: vi.fn(),
  getErrorMessage: vi.fn((error: unknown) => {
    if (typeof error === 'object' && error !== null && 'detail' in error) {
      return (error as { detail: string }).detail
    }
    return 'Ha ocurrido un error inesperado.'
  }),
}))

// ============================================================================
// MOCK SUPABASE CLIENT
// ============================================================================

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/mock-file.pdf' },
        })),
      })),
    },
  },
  signInWithEmail: vi.fn(),
  signOut: vi.fn(),
  getCurrentSession: vi.fn(),
  getCurrentUser: vi.fn(),
  uploadFile: vi.fn(),
  getPublicUrl: vi.fn(() => 'https://example.com/mock-file.pdf'),
  uploadResume: vi.fn(() => Promise.resolve('https://example.com/mock-resume.pdf')),
}))

// ============================================================================
// MOCK WINDOW OBJECTS
// ============================================================================

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})
