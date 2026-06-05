import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get partner statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get total trips count for this partner
    const { count: tripsCount, error: tripsError } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', id)

    if (tripsError) {
      console.error('Error fetching trips count:', tripsError)
      return NextResponse.json(
        { error: 'Failed to fetch trips statistics' },
        { status: 500 }
      )
    }

    // Get active trips count
    const { count: activeTripsCount, error: activeTripsError } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', id)
      .eq('is_active', true)

    if (activeTripsError) {
      console.error('Error fetching active trips count:', activeTripsError)
    }

    // Get bookings statistics through trips
    const { data: trips } = await supabase
      .from('trips')
      .select('id')
      .eq('partner_id', id)

    let totalBookings = 0
    let totalRevenue = 0
    let approvedBookings = 0

    if (trips && trips.length > 0) {
      const tripIds = trips.map(t => t.id)

      // Get trip schedules for these trips
      const { data: schedules } = await supabase
        .from('trip_schedules')
        .select('id')
        .in('trip_id', tripIds)

      if (schedules && schedules.length > 0) {
        const scheduleIds = schedules.map(s => s.id)

        // Get bookings for these schedules
        const { data: bookings } = await supabase
          .from('bookings')
          .select('total_amount, status')
          .in('trip_schedule_id', scheduleIds)

        if (bookings) {
          totalBookings = bookings.length
          approvedBookings = bookings.filter(b => b.status === 'approved').length
          totalRevenue = bookings
            .filter(b => b.status === 'approved')
            .reduce((sum, b) => sum + (b.total_amount || 0), 0)
        }
      }
    }

    return NextResponse.json({
      stats: {
        trips_count: tripsCount || 0,
        active_trips_count: activeTripsCount || 0,
        total_bookings: totalBookings,
        approved_bookings: approvedBookings,
        total_revenue: totalRevenue
      }
    })

  } catch (error: any) {
    console.error('Partner stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch partner statistics' },
      { status: 500 }
    )
  }
}
