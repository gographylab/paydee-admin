import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCommissionPayments, calculateCommission } from '@/utils/commissionUtils'
import { apiCache } from '@/lib/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      selectedTripId,
      selectedScheduleId,
      selectedSellerId,
      customers,
      notes
    } = body

    const adminSupabase = createAdminClient()

    // Get trip details
    const { data: trip } = await adminSupabase
      .from('trips')
      .select('price_per_person, commission_type, commission_value')
      .eq('id', selectedTripId)
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Check available seats
    const { data: availableSeats, error: seatsError } = await adminSupabase
      .rpc('get_available_seats', { schedule_id: selectedScheduleId })

    if (seatsError) {
      console.warn('Failed to get real-time seats, using fallback calculation')
      
      // Fallback: manual calculation
      const { data: bookings } = await adminSupabase
        .from('bookings')
        .select('status')
        .eq('trip_schedule_id', selectedScheduleId)
        .in('status', ['approved', 'pending', 'inprogress'])

      const bookedSeats = bookings?.length || 0
      const { data: schedule } = await adminSupabase
        .from('trip_schedules')
        .select('available_seats')
        .eq('id', selectedScheduleId)
        .single()

      const calculatedSeats = Math.max(0, (schedule?.available_seats || 0) - bookedSeats)
      
      if (customers.length > calculatedSeats) {
        return NextResponse.json({ 
          error: `ที่นั่งไม่เพียงพอ มีที่นั่งเหลือเพียง ${calculatedSeats} ที่นั่ง` 
        }, { status: 400 })
      }
    } else {
      if (customers.length > (availableSeats || 0)) {
        return NextResponse.json({ 
          error: `ที่นั่งไม่เพียงพอ มีที่นั่งเหลือเพียง ${availableSeats || 0} ที่นั่ง` 
        }, { status: 400 })
      }
    }

    const calculateCommissionAmount = (trip: any) => {
      if (!trip) return 0
      if (trip.commission_type === 'percentage') {
        return (trip.price_per_person * trip.commission_value) / 100
      }
      return trip.commission_value
    }

    const createdBookings = []

    // Create customers and bookings
    for (let i = 0; i < customers.length; i++) {
      const customerData = customers[i]
      const isMainCustomer = i === 0

      // Get seller data for referral
      let sellerData = null
      if (selectedSellerId) {
        const { data: seller } = await adminSupabase
          .from('user_profiles')
          .select('referral_code')
          .eq('id', selectedSellerId)
          .single()
        sellerData = seller
      }

      // Create customer
      const { data: customer, error: customerError } = await adminSupabase
        .from('customers')
        .insert({
          ...customerData,
          referred_by_code: sellerData?.referral_code,
          referred_by_seller_id: selectedSellerId
        })
        .select()
        .single()

      if (customerError) throw customerError

      // Create booking
      const { data: booking, error: bookingError } = await adminSupabase
        .from('bookings')
        .insert({
          trip_schedule_id: selectedScheduleId,
          customer_id: customer.id,
          seller_id: selectedSellerId,
          total_amount: trip.price_per_person,
          commission_amount: calculateCommissionAmount(trip),
          status: 'inprogress',
          notes: isMainCustomer
            ? `Admin สร้างการจอง - ผู้ติดต่อหลัก (จองทั้งหมด ${customers.length} คน) ${notes ? ` - ${notes}` : ''}`
            : `Admin สร้างการจอง - ผู้เดินทางร่วมกับ ${customers[0].full_name}`,
          booking_date: new Date().toISOString()
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Create commission payments if there's a seller
      if (selectedSellerId && trip) {
        const commissionCalc = calculateCommission(
          trip.price_per_person,
          trip.commission_value,
          trip.commission_type as 'fixed' | 'percentage'
        )
        
        try {
          await createCommissionPayments(booking.id, selectedSellerId, commissionCalc, adminSupabase)
        } catch (commissionError) {
          console.error('Failed to create commission payments:', commissionError)
          // Don't fail the whole booking creation for commission error
        }
      }

      createdBookings.push(booking)
    }

    // OPTIMIZED: Clear admin bookings cache for this user
    apiCache.clearPattern(`admin_bookings_${user.id}`)

    return NextResponse.json({ 
      success: true, 
      bookings: createdBookings,
      message: `สร้างการจองสำเร็จ ${createdBookings.length} รายการ`
    })

  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการสร้างการจอง' },
      { status: 500 }
    )
  }
}