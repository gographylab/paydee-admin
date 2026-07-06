import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { apiCache } from '@/lib/cache'

// Admin-only site: no public /book funnel, no self-registration
const PUBLIC_PREFIXES = ['/auth/login', '/auth/callback', '/api/docs', '/api-docs']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Redirect that preserves any refreshed session cookies
  const redirect = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url))
    supabaseResponse.cookies.getAll().forEach(cookie => res.cookies.set(cookie))
    return res
  }

  // Validates the JWT locally against cached JWKS when possible — much faster
  // than getUser(), which hits the Auth server on every request
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null

  const isPublicRoute = PUBLIC_PREFIXES.some(p => pathname.startsWith(p))

  if (!userId) {
    if (isPublicRoute || pathname === '/') {
      return supabaseResponse
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return redirect('/auth/login')
  }

  // Get user profile (role only, cached 1 minute)
  const profileCacheKey = `user_profile_${userId}`
  let userProfile = apiCache.get(profileCacheKey) as { role: string } | null
  if (!userProfile) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    userProfile = profile
    if (userProfile) {
      apiCache.set(profileCacheKey, userProfile, 60000)
    }
  }

  // No profile row, or not an admin → this site is not for them
  if (!userProfile || userProfile.role !== 'admin') {
    await supabase.auth.signOut()
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return redirect('/auth/login?error=Admin access required')
  }

  // Redirect authenticated admins away from auth pages
  if (isPublicRoute) {
    return redirect('/dashboard/admin/sellers')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
}
