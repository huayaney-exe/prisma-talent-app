/**
 * API Client - Production-grade HTTP client with auth and error handling
 */
import axios, { AxiosError, AxiosInstance } from 'axios'
import type { ApiError } from '@/types'

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const API_TIMEOUT = 30000 // 30 seconds

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================================
// REQUEST INTERCEPTOR - Add Authentication
// ============================================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    }

    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// ============================================================================
// RESPONSE INTERCEPTOR - Handle Errors
// ============================================================================

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - Success`)
    }
    return response
  },
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { status, data } = error.response

      console.error(`[API] Error ${status}:`, data)

      switch (status) {
        case 401:
          localStorage.removeItem('access_token')
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          break
        case 422:
          console.error('[API] Validation error:', data.errors)
          break
        case 500:
        case 502:
        case 503:
          console.error('[API] Server error')
          break
      }

      return Promise.reject(error.response.data)
    } else if (error.request) {
      console.error('[API] No response received')
      return Promise.reject({
        detail: 'No se pudo conectar con el servidor. Verifica tu conexión.',
      })
    } else {
      console.error('[API] Request setup error:', error.message)
      return Promise.reject({
        detail: 'Error al configurar la solicitud.',
      })
    }
  }
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function setAuthToken(token: string): void {
  localStorage.setItem('access_token', token)
}

export function clearAuthToken(): void {
  localStorage.removeItem('access_token')
}

export function getAuthToken(): string | null {
  return localStorage.getItem('access_token')
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'detail' in error) {
    return (error as ApiError).detail
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Ha ocurrido un error inesperado.'
}
