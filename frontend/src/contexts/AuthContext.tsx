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
  isClient: boolean
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
  const [isAdmin, setIsAdmin] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Check if user is admin by querying prisma_admins table
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('prisma_admins')
          .select('id, role, is_active')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .single()

        if (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
        } else {
          setIsAdmin(!!data) // User is admin if record exists
        }
      } catch (error) {
        console.error('Error querying prisma_admins:', error)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [user?.id])

  // Check if user is client by querying companies table
  useEffect(() => {
    const checkClientStatus = async () => {
      if (!user?.id) {
        setIsClient(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, company_name')
          .eq('primary_contact_auth_id', user.id)
          .single()

        if (error) {
          console.error('Error checking client status:', error)
          setIsClient(false)
        } else {
          setIsClient(!!data) // User is client if linked to a company
        }
      } catch (error) {
        console.error('Error querying companies for client:', error)
        setIsClient(false)
      }
    }

    checkClientStatus()
  }, [user?.id])

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
    isClient,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
