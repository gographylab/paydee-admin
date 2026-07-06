import { createClient } from '@/lib/supabase/client'
import { Database } from '../../database.types'

type Tables = Database['public']['Tables']
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
 * payment_type: 'partial_commission' = 50% แรก, 'final_commission' = 50% หลัง
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
