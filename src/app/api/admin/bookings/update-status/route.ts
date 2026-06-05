import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { apiCache } from '@/lib/cache'

// Request deduplication cache (prevent multiple simultaneous updates)
const pendingUpdates = new Map<string, Promise<any>>()

export async function POST(request: NextRequest) {
  try {
    const { bookingId, status } = await request.json()

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'Missing bookingId or status' },
        { status: 400 }
      )
    }

    // Request deduplication - prevent simultaneous updates
    const requestKey = `${bookingId}_${status}`
    if (pendingUpdates.has(requestKey)) {
      const result = await pendingUpdates.get(requestKey)
      return NextResponse.json(result)
    }

    // Validate status - เช็คค่าที่อนุญาตตาม database constraint
    const validStatuses = ['pending', 'inprogress', 'approved', 'rejected', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Use consistent Supabase client setup like middleware for better session handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // In API routes, we don't need to set cookies back to the response
            // since this is a one-time operation
          },
        },
      }
    )

    // Check if user is admin with improved error handling
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Cache admin check for 2 minutes to reduce DB load
    const adminCacheKey = `admin_role_${user.id}`
    let isAdmin = apiCache.get(adminCacheKey)

    if (isAdmin === undefined || isAdmin === null) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        return NextResponse.json(
          { error: 'Failed to verify user permissions' },
          { status: 403 }
        )
      }

      // More robust role checking - ensure profile exists and has admin role
      isAdmin = profile && profile.role === 'admin' && profile.status !== 'rejected'
      apiCache.set(adminCacheKey, isAdmin, 120000) // 2 minutes
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Create update promise and cache it
    const updatePromise = (async () => {
      // Update booking status using admin client
      const adminSupabase = createAdminClient()
      const { data, error } = await adminSupabase
        .from('bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'approved' ? { 
            approved_at: new Date().toISOString(),
            approved_by: user.id 
          } : {})
        })
        .eq('id', bookingId)
        .select()

      if (error) {
        throw error
      }

      // OPTIMIZED: Clear admin bookings cache for this user
      apiCache.clearPattern(`admin_bookings_${user.id}`)

      return { 
        success: true, 
        data: data[0],
        message: `Booking status updated to ${status}`
      }
    })()

    // Cache the promise to prevent duplicate requests
    pendingUpdates.set(requestKey, updatePromise)

    try {
      const result = await updatePromise
      // Clean up after completion
      pendingUpdates.delete(requestKey)
      return NextResponse.json(result)
    } catch (error: any) {
      // Clean up on error
      pendingUpdates.delete(requestKey)
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
