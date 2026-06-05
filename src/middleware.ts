import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { apiCache } from '@/lib/cache'

export async function middleware(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile if user exists (with caching)
  let userProfile = null
  if (user) {
    // Check cache first
    const profileCacheKey = `user_profile_${user.id}`
    userProfile = apiCache.get(profileCacheKey)

    if (!userProfile) {
      // Cache miss - fetch from database
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      userProfile = data

      // Cache for 1 minute
      if (userProfile) {
        apiCache.set(profileCacheKey, userProfile, 60000)
      }
    }
  }

  const url = request.nextUrl.clone()

  // Public routes that don't require authentication (no /book for admin site)
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/callback', '/api/docs', '/api-docs']
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route))

  if (!user && !isPublicRoute && url.pathname !== '/') {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && userProfile) {
    // Non-admin users should not use admin site
    if (userProfile.role !== 'admin') {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login?error=Admin access required', request.url))
    }

    // Redirect authenticated admins away from auth pages
    if (isPublicRoute) {
      return NextResponse.redirect(new URL('/dashboard/admin/sellers', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
