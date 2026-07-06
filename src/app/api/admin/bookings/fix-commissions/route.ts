import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { createCommissionPayments, calculateCommission } from '@/utils/commissionUtils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: claims } = await supabase.auth.getClaims()
    const userId = claims?.claims?.sub
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // commission_payments has no RLS INSERT policy — writes need the admin client
    const adminSupabase = createAdminClient()

    // Get all bookings with sellers that don't have commission payments
    const { data: bookingsWithoutCommissions } = await adminSupabase
      .from('bookings')
      .select(`
        id,
        seller_id,
        total_amount,
        commission_amount,
        trip_schedules!inner(
          trips!inner(
            commission_type,
            commission_value,
            price_per_person
          )
        )
      `)
      .not('seller_id', 'is', null)

    if (!bookingsWithoutCommissions || bookingsWithoutCommissions.length === 0) {
      return NextResponse.json({
        message: 'No bookings with sellers found',
        created: 0
      })
    }

    // Fetch all existing commission_payments for these bookings in one query
    // instead of checking each booking individually (avoids N+1)
    const candidateBookingIds = bookingsWithoutCommissions.map(b => b.id)
    const { data: existingCommissions } = await adminSupabase
      .from('commission_payments')
      .select('booking_id')
      .in('booking_id', candidateBookingIds)

    const bookingIdsWithCommissions = new Set(existingCommissions?.map(c => c.booking_id) || [])

    let createdCount = 0
    let errors: string[] = []

    for (const booking of bookingsWithoutCommissions) {
      try {
        if (bookingIdsWithCommissions.has(booking.id)) {
          continue // Skip if already has commission payments
        }

        const trip = booking.trip_schedules?.trips
        if (!trip || !booking.seller_id) continue

        // Calculate commission
        const commissionCalc = calculateCommission(
          trip.price_per_person,
          trip.commission_value,
          trip.commission_type as 'fixed' | 'percentage'
        )

        await createCommissionPayments(booking.id, booking.seller_id, commissionCalc, adminSupabase)
        createdCount++

      } catch (error) {
        console.error(`Error creating commission for booking ${booking.id}:`, error)
        errors.push(`Booking ${booking.id}: ${error}`)
      }
    }

    return NextResponse.json({ 
      message: `Created commission payments for ${createdCount} bookings`,
      created: createdCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error in fix commission API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
