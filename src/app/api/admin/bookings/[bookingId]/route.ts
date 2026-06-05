import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiCache } from '@/lib/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
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

    const { bookingId } = await params

    // Use admin client to fetch booking with full data
    const adminSupabase = createAdminClient()

    const { data: booking, error } = await adminSupabase
      .from('bookings')
      .select(`
        *,
        customers!inner (
          id,
          full_name,
          email,
          phone,
          id_card,
          passport_number
        ),
        trip_schedules!inner (
          id,
          departure_date,
          return_date,
          registration_deadline,
          available_seats,
          trips!inner (
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
        ),
        commission_payments (
          id,
          payment_type,
          amount,
          status,
          paid_at
        )
      `)
      .eq('id', bookingId)
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Get seller info if exists
    let seller = null
    if (booking.seller_id) {
      const { data: sellerData } = await adminSupabase
        .from('user_profiles')
        .select('id, full_name, email, referral_code, avatar_url')
        .eq('id', booking.seller_id)
        .single()

      seller = sellerData
    }

    // Combine data
    const bookingWithDetails = {
      ...booking,
      seller,
      // Fix type compatibility
      trip_schedules: {
        ...booking.trip_schedules,
        trips: {
          ...booking.trip_schedules?.trips,
          countries: booking.trip_schedules?.trips?.countries || undefined
        }
      }
    }

    console.log('GET booking details:', {
      id: booking.id,
      payment_status: booking.payment_status,
      commission_payments: booking.commission_payments?.map(cp => ({ 
        type: cp.payment_type, 
        status: cp.status 
      }))
    })

    return NextResponse.json({ 
      success: true,
      booking: bookingWithDetails
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล booking' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
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

    const { bookingId } = await params

    // Use admin client to delete booking
    const adminSupabase = createAdminClient()

    // First check if booking exists and get customer_id
    const { data: existingBooking, error: checkError } = await adminSupabase
      .from('bookings')
      .select('id, status, customer_id')
      .eq('id', bookingId)
      .single()

    if (checkError || !existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const customerId = existingBooking.customer_id

    // Delete commission payments first (due to foreign key constraint)
    const { error: commissionError } = await adminSupabase
      .from('commission_payments')
      .delete()
      .eq('booking_id', bookingId)

    if (commissionError) {
      throw new Error(`Failed to delete commission payments: ${commissionError.message}`)
    }

    // Delete the booking
    const { error: deleteError } = await adminSupabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)

    if (deleteError) {
      throw new Error(`Failed to delete booking: ${deleteError.message}`)
    }

    // Delete the customer if exists
    if (customerId) {
      const { error: customerError } = await adminSupabase
        .from('customers')
        .delete()
        .eq('id', customerId)

      if (customerError) {
        console.error('Failed to delete customer:', customerError)
        // Don't throw error here as booking is already deleted
        // Just log the error for debugging
      }
    }

    // OPTIMIZED: Clear admin bookings cache for this user
    apiCache.clearPattern(`admin_bookings_${user.id}`)

    return NextResponse.json({ 
      success: true,
      message: 'ลบการจองเรียบร้อยแล้ว'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการลบ booking' },
      { status: 500 }
    )
  }
}