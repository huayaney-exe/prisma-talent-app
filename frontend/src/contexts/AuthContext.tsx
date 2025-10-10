/**
 * Auth Context - Authentication state management
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, getCurrentSession, getCurrentUser, signOut as supabaseSignOut } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is admin (based on email domain or metadata)
  const isAdmin = user?.email?.includes('@prisma') || user?.user_metadata?.role === 'admin' || false

  // ============================================================================
  // INITIALIZE SESSION
  // ============================================================================

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const currentSession = await getCurrentSession()
        if (currentSession) {
          setSession(currentSession)
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setSession(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // ============================================================================
  // SIGN IN
  // ============================================================================

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.session && data.user) {
      setSession(data.session)
      setUser(data.user)
    }
  }

  // ============================================================================
  // SIGN OUT
  // ============================================================================

  const signOut = async () => {
    await supabaseSignOut()
    setUser(null)
    setSession(null)
  }

  // ============================================================================
  // PROVIDER VALUE
  // ============================================================================

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAdmin,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
