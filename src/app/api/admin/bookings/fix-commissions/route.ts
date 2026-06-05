import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createCommissionPayments, calculateCommission } from '@/utils/commissionUtils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all bookings with sellers that don't have commission payments
    const { data: bookingsWithoutCommissions } = await supabase
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

    let createdCount = 0
    let errors: string[] = []

    for (const booking of bookingsWithoutCommissions) {
      try {
        // Check if commission payments already exist
        const { data: existingCommissions } = await supabase
          .from('commission_payments')
          .select('id')
          .eq('booking_id', booking.id)

        if (existingCommissions && existingCommissions.length > 0) {
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

        // Create commission payments
        await createCommissionPayments(booking.id, booking.seller_id, commissionCalc)
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
