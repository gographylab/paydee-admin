import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { paymentType } = await request.json()
    const { id: bookingId } = await params

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient()

    // Map paymentType to commission payment_type
    const commissionPaymentType = paymentType === 'partial' ? 'partial_commission' : 'final_commission'

    // Check if commission payment exists
    const { data: existingPayments, error: checkError } = await adminSupabase
      .from('commission_payments')
      .select('*')
      .eq('booking_id', bookingId)

    if (checkError) {
      throw new Error(`Error checking payments: ${checkError.message}`)
    }

    // If no commission payments exist, create them first
    if (!existingPayments || existingPayments.length === 0) {
      // Get booking and trip details to calculate commission
      const { data: bookingData, error: bookingError } = await adminSupabase
        .from('bookings')
        .select(`
          *,
          trip_schedules!inner (
            trips!inner (
              price_per_person,
              commission_value,
              commission_type
            )
          )
        `)
        .eq('id', bookingId)
        .single()

      if (bookingError || !bookingData) {
        return NextResponse.json({ 
          error: 'ไม่พบข้อมูล booking หรือ trip' 
        }, { status: 404 })
      }

      if (!bookingData.seller_id) {
        return NextResponse.json({ 
          error: 'Booking นี้ไม่มี seller' 
        }, { status: 400 })
      }

      const trip = bookingData.trip_schedules.trips
      const totalCommission = trip.commission_type === 'percentage' 
        ? (trip.price_per_person * trip.commission_value) / 100
        : trip.commission_value

      // Create commission payments
      const commissionsToCreate = [
        {
          booking_id: bookingId,
          seller_id: bookingData.seller_id,
          payment_type: 'partial_commission',
          amount: totalCommission / 2,
          percentage: 50.00,
          status: 'pending'
        },
        {
          booking_id: bookingId,
          seller_id: bookingData.seller_id,
          payment_type: 'final_commission',
          amount: totalCommission / 2,
          percentage: 50.00,
          status: 'pending'
        }
      ]

      const { data: createdPayments, error: createError } = await adminSupabase
        .from('commission_payments')
        .insert(commissionsToCreate)
        .select()

      if (createError) {
        throw new Error(`Error creating commission payments: ${createError.message}`)
      }
      
      // Now proceed with the payment update using the newly created payments
      existingPayments.push(...createdPayments)
    }

    // Check if payment type exists
    const targetPayment = existingPayments.find(p => p.payment_type === commissionPaymentType)
    if (!targetPayment) {
      return NextResponse.json({ 
        error: `ไม่พบ commission payment ประเภท: ${commissionPaymentType}` 
      }, { status: 404 })
    }

    // Update commission payment status
    const { data, error: updateError } = await adminSupabase
      .from('commission_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('booking_id', bookingId)
      .eq('payment_type', commissionPaymentType)
      .select()

    if (updateError) {
      throw new Error(`Update error: ${updateError.message}`)
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: 'ไม่สามารถอัปเดต commission payment ได้' 
      }, { status: 400 })
    }

    // Update booking payment status based on commission payments
    // Check all commission payments for this booking to determine booking status
    const { data: allPayments, error: allPaymentsError } = await adminSupabase
      .from('commission_payments')
      .select('*')
      .eq('booking_id', bookingId)

    if (allPaymentsError) {
      console.error('Error fetching all payments:', allPaymentsError)
    } else {
      let bookingPaymentStatus = 'pending'
      
      const partialPayment = allPayments.find(p => p.payment_type === 'partial_commission')
      const finalPayment = allPayments.find(p => p.payment_type === 'final_commission')
      
      console.log('Commission payments status check:', {
        bookingId,
        partialPayment: partialPayment?.status,
        finalPayment: finalPayment?.status,
        allPayments: allPayments.map(p => ({ type: p.payment_type, status: p.status }))
      })
      
      if (partialPayment?.status === 'paid' && finalPayment?.status === 'paid') {
        bookingPaymentStatus = 'completed'
      } else if (partialPayment?.status === 'paid') {
        bookingPaymentStatus = 'partial'
      }

      console.log('Setting booking payment status to:', bookingPaymentStatus)

      // Update booking payment status
      const { error: bookingUpdateError } = await adminSupabase
        .from('bookings')
        .update({ payment_status: bookingPaymentStatus })
        .eq('id', bookingId)

      if (bookingUpdateError) {
        console.error('Error updating booking payment status:', bookingUpdateError)
      } else {
        console.log('Successfully updated booking payment status')
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0],
      message: 'อัปเดตสถานะการจ่ายเงินเรียบร้อยแล้ว'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการจ่ายเงิน' },
      { status: 500 }
    )
  }
}