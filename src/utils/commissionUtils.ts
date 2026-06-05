import { createClient } from '@/lib/supabase/client'
import { Database } from '../../database.types'

type Tables = Database['public']['Tables']
type BookingRow = Tables['bookings']['Row']
type CommissionPaymentInsert = Tables['commission_payments']['Insert']

export interface CommissionCalculation {
  totalCommission: number
  depositCommission: number
  finalCommission: number
}

/**
 * คำนวณจำนวน commission ทั้งหมดและแบ่งเป็น 50/50
 */
export const calculateCommission = (
  totalAmount: number, 
  commissionValue: number, 
  commissionType: 'fixed' | 'percentage'
): CommissionCalculation => {
  let totalCommission: number

  if (commissionType === 'percentage') {
    totalCommission = (totalAmount * commissionValue) / 100
  } else {
    totalCommission = commissionValue
  }

  const halfCommission = totalCommission / 2

  return {
    totalCommission,
    depositCommission: halfCommission,
    finalCommission: halfCommission
  }
}

/**
 * สร้าง commission payment records เมื่อมีการจองใหม่
 */
export const createCommissionPayments = async (
  bookingId: string, 
  sellerId: string, 
  commissionCalculation: CommissionCalculation,
  supabaseClient?: any
) => {
  const supabase = supabaseClient || createClient()

  const commissionPayments: CommissionPaymentInsert[] = [
    {
      booking_id: bookingId,
      seller_id: sellerId,
      payment_type: 'partial_commission',
      amount: commissionCalculation.depositCommission,
      percentage: 50.00,
      status: 'pending'
    },
    {
      booking_id: bookingId,
      seller_id: sellerId,
      payment_type: 'final_commission',
      amount: commissionCalculation.finalCommission,
      percentage: 50.00,
      status: 'pending'
    }
  ]

  const { data, error } = await supabase
    .from('commission_payments')
    .insert(commissionPayments)
    .select()

  if (error) {
    throw new Error(`Failed to create commission payments: ${error.message}`)
  }

  return data
}

/**
 * อัปเดตสถานะ commission payment เมื่อลูกค้าจ่ายเงิน
 */
export const updateCommissionStatus = async (
  bookingId: string, 
  paymentType: 'deposit_commission' | 'final_commission', 
  status: 'paid' | 'cancelled'
) => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('commission_payments')
    .update({ 
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null 
    })
    .eq('booking_id', bookingId)
    .eq('payment_type', paymentType)
    .select()

  if (error) {
    throw new Error(`Failed to update commission status: ${error.message}`)
  }

  return data
}

/**
 * จัดการ commission flow เมื่อลูกค้าจ่ายมัดจำ
 */
export const handleDepositPayment = async (bookingId: string) => {
  const supabase = createClient()
  
  // อัปเดต booking status
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({
      payment_status: 'deposit_paid',
      deposit_paid_at: new Date().toISOString()
    })
    .eq('id', bookingId)

  if (bookingError) {
    throw new Error(`Failed to update booking: ${bookingError.message}`)
  }

  // อัปเดต commission status สำหรับมัดจำ
  return await updateCommissionStatus(bookingId, 'deposit_commission', 'paid')
}

/**
 * จัดการ commission flow เมื่อลูกค้าจ่ายเต็มจำนวน
 */
export const handleFullPayment = async (bookingId: string) => {
  const supabase = createClient()
  
  // อัปเดต booking status
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({
      payment_status: 'fully_paid',
      full_payment_at: new Date().toISOString()
    })
    .eq('id', bookingId)

  if (bookingError) {
    throw new Error(`Failed to update booking: ${bookingError.message}`)
  }

  // อัปเดต commission status สำหรับยอดสุดท้าย
  return await updateCommissionStatus(bookingId, 'final_commission', 'paid')
}

/**
 * จัดการ commission flow เมื่อลูกค้ายกเลิกหลังจ่ายมัดจำ
 */
export const handleCancellationAfterDeposit = async (bookingId: string) => {
  const supabase = createClient()
  
  // อัปเดต booking status
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({
      payment_status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', bookingId)

  if (bookingError) {
    throw new Error(`Failed to update booking: ${bookingError.message}`)
  }

  // ยกเลิก commission สำหรับยอดสุดท้าย (50% ที่เหลือ)
  return await updateCommissionStatus(bookingId, 'final_commission', 'cancelled')
}

/**
 * ดึงข้อมูล commission ทั้งหมดของ seller
 */
export const getSellerCommissions = async (sellerId: string) => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('commission_payments')
    .select(`
      *,
      bookings!inner(
        id,
        total_amount,
        payment_status,
        customers(full_name, email),
        trip_schedules!inner(
          departure_date,
          trips!inner(title, country_id, countries(name, flag_emoji))
        )
      )
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get seller commissions: ${error.message}`)
  }

  return data
}

/**
 * สร้าง booking พร้อม commission payments
 */
export const createBookingWithCommission = async (
  bookingData: Omit<Tables['bookings']['Insert'], 'commission_amount'>,
  tripCommissionValue: number,
  tripCommissionType: 'fixed' | 'percentage'
) => {
  const supabase = createClient()

  // คำนวณ commission
  const commissionCalc = calculateCommission(
    bookingData.total_amount,
    tripCommissionValue,
    tripCommissionType
  )

  // สร้าง booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      ...bookingData,
      commission_amount: commissionCalc.totalCommission,
      payment_status: 'pending'
    })
    .select()
    .single()

  if (bookingError) {
    throw new Error(`Failed to create booking: ${bookingError.message}`)
  }

  // สร้าง commission payments
  if (booking && bookingData.seller_id) {
    await createCommissionPayments(booking.id, bookingData.seller_id, commissionCalc)
  }

  return booking
}
