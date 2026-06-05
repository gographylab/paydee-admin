import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiCache } from '@/lib/cache'

// GET - List all bookings (Admin only) with optimized pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''
    const sellerId = searchParams.get('sellerId') || ''

    const supabase = await createClient()

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // OPTIMIZED: Check cache first
    const cacheKey = `admin_bookings_${user.id}_${page}_${pageSize}_${search}_${status}_${paymentStatus}_${sellerId}`
    const cached = apiCache.get(cacheKey)
    if (cached) {
      const response = NextResponse.json(cached)
      response.headers.set('X-Cache', 'HIT')
      return response
    }

    // Query bookings with optimized select - only needed fields
    // Use LEFT JOIN instead of nested select to avoid RLS issues
    let query = supabase
      .from('bookings')
      .select(`
        id,
        seller_id,
        customer_id,
        trip_schedule_id,
        status,
        payment_status,
        total_amount,
        deposit_amount,
        commission_amount,
        created_at,
        updated_at
      `, { count: 'exact' })

    // Apply search filter - search across customer name, email, trip title
    // We'll handle search after fetching related data
    // if (search) {
    //   query = query.or(`customers.full_name.ilike.%${search}%,customers.email.ilike.%${search}%,trip_schedules.trips.title.ilike.%${search}%`)
    // }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply payment status filter
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus)
    }

    // Apply seller filter
    if (sellerId && sellerId !== 'all') {
      if (sellerId === 'none') {
        query = query.is('seller_id', null)
      } else {
        query = query.eq('seller_id', sellerId)
      }
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: bookings, error, count } = await query

    if (error) throw error

    // Fetch related data separately to avoid RLS circular dependency
    const allBookingIds = bookings?.map(b => b.id) || []
    const customerIds = [...new Set(bookings?.map(b => b.customer_id).filter(Boolean) || [])] as string[]
    const scheduleIds = [...new Set(bookings?.map(b => b.trip_schedule_id).filter(Boolean) || [])] as string[]

    // Get customers data using service role to bypass RLS
    let customersMap = new Map()
    if (customerIds.length > 0) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, id_card, passport_number')
        .in('id', customerIds)

      customers?.forEach(customer => {
        customersMap.set(customer.id, customer)
      })
    }

    // Get trip schedules with trips and countries
    let schedulesMap = new Map()
    if (scheduleIds.length > 0) {
      const { data: schedules } = await supabase
        .from('trip_schedules')
        .select(`
          id,
          departure_date,
          return_date,
          registration_deadline,
          available_seats,
          trips (
            id,
            title,
            price_per_person,
            commission_type,
            commission_value,
            countries (
              name,
              flag_emoji
            )
          )
        `)
        .in('id', scheduleIds)

      schedules?.forEach(schedule => {
        schedulesMap.set(schedule.id, schedule)
      })
    }

    // Get sellers in one query for all bookings that have seller_id
    const sellerIds = [...new Set(
      bookings?.filter(b => b.seller_id).map(b => b.seller_id).filter(Boolean) || []
    )] as string[]

    let sellersMap = new Map()
    if (sellerIds.length > 0) {
      // Use admin client to bypass RLS policy restrictions
      const adminSupabase = createAdminClient()
      const { data: sellers } = await adminSupabase
        .from('user_profiles')
        .select('id, full_name, email, referral_code, avatar_url')
        .in('id', sellerIds)

      sellers?.forEach(seller => {
        sellersMap.set(seller.id, seller)
      })
    }

    // Get commission payments for all bookings in one query
    let commissionsMap = new Map()
    if (allBookingIds.length > 0) {
      const { data: commissions } = await supabase
        .from('commission_payments')
        .select('booking_id, id, payment_type, amount, status, paid_at')
        .in('booking_id', allBookingIds)

      commissions?.forEach(commission => {
        if (!commissionsMap.has(commission.booking_id)) {
          commissionsMap.set(commission.booking_id, [])
        }
        commissionsMap.get(commission.booking_id).push(commission)
      })
    }

    // Combine data efficiently
    const bookingsWithRelations = bookings?.map(booking => ({
      ...booking,
      customers: booking.customer_id ? customersMap.get(booking.customer_id) || null : null,
      trip_schedules: booking.trip_schedule_id ? schedulesMap.get(booking.trip_schedule_id) || null : null,
      seller: booking.seller_id ? sellersMap.get(booking.seller_id) || null : null,
      commission_payments: commissionsMap.get(booking.id) || []
    })) || []

    // Apply search filter here after data is combined
    let filteredBookings = bookingsWithRelations
    if (search) {
      filteredBookings = bookingsWithRelations.filter(booking =>
        booking.customers?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        booking.customers?.email?.toLowerCase().includes(search.toLowerCase()) ||
        booking.trip_schedules?.trips?.title?.toLowerCase().includes(search.toLowerCase())
      )
    }

    const responseData = {
      bookings: filteredBookings,
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / pageSize),
      pageSize
    }

    // OPTIMIZED: Cache the response for 30 seconds
    apiCache.set(cacheKey, responseData, 30000)

    const response = NextResponse.json(responseData)

    // Add cache headers for optimization
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Cache', 'MISS')

    return response

  } catch (error: any) {
    console.error('Admin bookings GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}