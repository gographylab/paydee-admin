import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

export type UserRole = 'admin' | 'seller'

export interface AuthRedirectPaths {
  admin: string
  seller: string
}

// In-memory cache for user roles to avoid repeated DB queries
const userRoleCache = new Map<string, { role: UserRole; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const AUTH_REDIRECTS: AuthRedirectPaths = {
  admin: '/dashboard/admin/sellers',
  seller: '/dashboard/admin/sellers' // Non-admins will be blocked by middleware
}

/**
 * Get redirect path based on user role
 */
export function getRedirectPath(role?: string): string {
  return AUTH_REDIRECTS.admin
}

/**
 * Get user role from URL parameters
 */
export function getRoleFromParams(searchParams: URLSearchParams): UserRole {
  return searchParams.get('role') === 'admin' ? 'admin' : 'seller'
}

/**
 * Fetch user profile and return role (with caching)
 */
export async function getUserRole(user: User): Promise<UserRole> {
  // Check cache first
  const cachedData = userRoleCache.get(user.id)
  const now = Date.now()
  
  if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
    return cachedData.role
  }
  
  // Fetch from database
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const role: UserRole = profile?.role === 'admin' ? 'admin' : 'seller'
  
  // Cache the result
  userRoleCache.set(user.id, { role, timestamp: now })
  
  return role
}

/**
 * Create OAuth redirect URL with role and redirect path
 */
export function createOAuthRedirectURL(role: UserRole, currentDomain: string): string {
  const redirectPath = getRedirectPath(role)
  const baseUrl = currentDomain === 'app.paydee.me' || process.env.NEXT_PUBLIC_SITE_URL?.includes('app.paydee.me')
    ? 'https://app.paydee.me'
    : window.location.origin
    
  return `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}&role=${role}`
}

/**
 * Clear user role cache (call on logout)
 */
export function clearUserRoleCache(userId?: string): void {
  if (userId) {
    userRoleCache.delete(userId)
  } else {
    userRoleCache.clear()
  }
}

/**
 * Handle authentication error with loading state reset
 */
export function handleAuthError(
  error: string,
  setError: (error: string) => void,
  setLoading: (loading: boolean) => void
): void {
  setError(error)
  setLoading(false)
  toast.error(`เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${error}`)
}