import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { apiCache } from '@/lib/cache'

// ฟังก์ชันสร้าง commission payment
async function createCommissionPayment(adminSupabase: any, booking: any, paymentType: string) {
  // เช็คว่ามี commission payment ประเภทนี้อยู่แล้วหรือไม่
  const { data: existingPayment } = await adminSupabase
    .from('commission_payments')
    .select('id')
    .eq('booking_id', booking.id)
    .eq('payment_type', paymentType)
    .single()

  if (existingPayment) {
    // มีแล้วไม่ต้องสร้างใหม่
    return existingPayment
  }

  // คำนวณจำนวนเงิน commission
  const commissionAmount = booking.commission_amount || 0
  const amount = paymentType === 'deposit_commission' 
    ? Math.round(commissionAmount * 0.5) // 50%
    : Math.round(commissionAmount * 0.5) // อีก 50%

  // สร้าง commission payment ใหม่
  const { data: newPayment, error } = await adminSupabase
    .from('commission_payments')
    .insert({
      booking_id: booking.id,
      seller_id: booking.seller_id,
      payment_type: paymentType,
      amount: amount,
      status: 'paid',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating commission payment:', error)
    throw error
  }

  return newPayment
}

export async function POST(request: NextRequest) {
  try {
    const { bookingId, paymentStatus } = await request.json()

    if (!bookingId || !paymentStatus) {
      return NextResponse.json(
        { error: 'Missing bookingId or paymentStatus' },
        { status: 400 }
      )
    }

    // Validate payment status - ใช้ค่าจริงตาม constraint
    const validPaymentStatuses = ['pending', 'partial', 'completed', 'refunded']
    
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: `Invalid payment status. Received: "${paymentStatus}", Allowed values: ${validPaymentStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Update payment status using admin client
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from('bookings')
      .update({ 
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // OPTIMIZED: Clear admin bookings cache for this user
    apiCache.clearPattern(`admin_bookings_${user.id}`)

    // จัดการ commission payments และข้อความตามสถานะ
    let commissionMessage = ''
    const updatedBooking = data[0]
    
    if (updatedBooking && updatedBooking.seller_id) {
      try {
        switch (paymentStatus) {
          case 'partial':
            // จ่ายมัดจำแล้ว - จ่าย commission 50%
            await createCommissionPayment(adminSupabase, updatedBooking, 'direct')
            commissionMessage = ' และจ่าย Commission Seller 50% แล้ว'
            break
            
          case 'completed':
            // จ่ายครบแล้ว - จ่าย commission 100%
            await createCommissionPayment(adminSupabase, updatedBooking, 'direct')
            await createCommissionPayment(adminSupabase, updatedBooking, 'referral')
            commissionMessage = ' และจ่าย Commission Seller 100% แล้ว'
            break
            
          case 'refunded':
            // ยกเลิก - seller ยังได้ commission 50% แรกอยู่
            commissionMessage = ' (Seller ยังได้ Commission 50% แรกอยู่)'
            break
        }
      } catch (commissionError) {
        console.error('Error handling commission:', commissionError)
        commissionMessage = ' (เกิดข้อผิดพลาดในการสร้าง Commission)'
      }
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'อัพเดทสถานะการชำระเงินสำเร็จ' + commissionMessage
    })

  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}