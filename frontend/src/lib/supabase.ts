/**
 * Supabase Client - PostgreSQL database + Auth + Storage
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'prisma-talent-frontend',
    },
  },
})

// ============================================================================
// AUTH HELPERS
// ============================================================================

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean }
) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: options?.cacheControl || '3600',
    upsert: options?.upsert || false,
  })
  if (error) throw error
  return data
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadResume(
  positionId: string,
  applicantId: string,
  file: File
): Promise<string> {
  const fileExtension = file.name.split('.').pop()
  const filePath = `${positionId}/${applicantId}/resume.${fileExtension}`

  await uploadFile('resumes', filePath, file, {
    cacheControl: '86400',
    upsert: true,
  })

  return getPublicUrl('resumes', filePath)
}
