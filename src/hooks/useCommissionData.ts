import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CommissionSummary, 
  CommissionPaymentWithBooking, 
  CommissionFlowState,
  CommissionAnalytics 
} from '@/types/commission'

export const useCommissionData = (sellerId: string) => {
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCommissionSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      // ดึงข้อมูล commission payments พร้อม booking details
      const { data: commissionPayments, error: commissionsError } = await supabase
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
              trips!inner(
                title,
                countries(name, flag_emoji)
              )
            )
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (commissionsError) throw commissionsError

      // คำนวณสรุปข้อมูล
      const totalEarned = commissionPayments
        ?.filter(cp => cp.status === 'paid')
        .reduce((sum, cp) => sum + cp.amount, 0) || 0

      const pendingAmount = commissionPayments
        ?.filter(cp => cp.status === 'pending')
        .reduce((sum, cp) => sum + cp.amount, 0) || 0

      // คำนวณรายได้เดือนนี้
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      const thisMonthEarned = commissionPayments
        ?.filter(cp => 
          cp.status === 'paid' && 
          cp.paid_at && 
          cp.paid_at.startsWith(currentMonth)
        )
        .reduce((sum, cp) => sum + cp.amount, 0) || 0

      // นับจำนวน booking ที่ไม่ซ้ำ
      const uniqueBookingIds = new Set(commissionPayments?.map(cp => cp.booking_id))
      const totalBookings = uniqueBookingIds.size

      setSummary({
        total_earned: totalEarned,
        pending_amount: pendingAmount,
        this_month_earned: thisMonthEarned,
        total_bookings: totalBookings,
        commission_payments: commissionPayments as CommissionPaymentWithBooking[]
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล commission')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sellerId) {
      fetchCommissionSummary()
    }
  }, [sellerId])

  return {
    summary,
    loading,
    error,
    refetch: fetchCommissionSummary
  }
}

export const useCommissionAnalytics = (sellerId: string) => {
  const [analytics, setAnalytics] = useState<CommissionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // ดึงข้อมูล commission payments
      const { data: commissionPayments, error } = await supabase
        .from('commission_payments')
        .select('*')
        .eq('seller_id', sellerId)

      if (error) throw error

      if (!commissionPayments) {
        setAnalytics({
          total_commissions: 0,
          paid_commissions: 0,
          pending_commissions: 0,
          cancelled_commissions: 0,
          commission_rate: 0,
          monthly_breakdown: []
        })
        return
      }

      // คำนวณสถิติ
      const totalCommissions = commissionPayments.reduce((sum, cp) => sum + cp.amount, 0)
      const paidCommissions = commissionPayments
        .filter(cp => cp.status === 'paid')
        .reduce((sum, cp) => sum + cp.amount, 0)
      const pendingCommissions = commissionPayments
        .filter(cp => cp.status === 'pending')
        .reduce((sum, cp) => sum + cp.amount, 0)
      const cancelledCommissions = commissionPayments
        .filter(cp => cp.status === 'cancelled')
        .reduce((sum, cp) => sum + cp.amount, 0)

      // คำนวณอัตราการได้ commission
      const commissionRate = totalCommissions > 0 ? (paidCommissions / totalCommissions) * 100 : 0

      // สร้าง monthly breakdown
      const monthlyData = new Map<string, { total: number, count: number }>()
      
      commissionPayments
        .filter(cp => cp.status === 'paid' && cp.paid_at)
        .forEach(cp => {
          const month = cp.paid_at!.slice(0, 7) // YYYY-MM
          const existing = monthlyData.get(month) || { total: 0, count: 0 }
          monthlyData.set(month, {
            total: existing.total + cp.amount,
            count: existing.count + 1
          })
        })

      const monthlyBreakdown = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          total_earned: data.total,
          bookings_count: Math.ceil(data.count / 2) // แบ่ง 2 เพราะมี 2 commission per booking
        }))
        .sort((a, b) => b.month.localeCompare(a.month)) // เรียงจากใหม่ไปเก่า

      setAnalytics({
        total_commissions: totalCommissions,
        paid_commissions: paidCommissions,
        pending_commissions: pendingCommissions,
        cancelled_commissions: cancelledCommissions,
        commission_rate: commissionRate,
        monthly_breakdown: monthlyBreakdown
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sellerId) {
      fetchAnalytics()
    }
  }, [sellerId])

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  }
}

export const useBookingCommissionFlow = (bookingId: string) => {
  const [flowState, setFlowState] = useState<CommissionFlowState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchFlowState = async () => {
    try {
      setLoading(true)
      setError(null)

      // ดึงข้อมูล booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError

      // ดึงข้อมูล commission payments
      const { data: commissionPayments, error: commissionsError } = await supabase
        .from('commission_payments')
        .select('*')
        .eq('booking_id', bookingId)

      if (commissionsError) throw commissionsError

      if (!booking) {
        throw new Error('ไม่พบข้อมูลการจอง')
      }

      // หา commission payments แต่ละประเภท
      const depositCommission = commissionPayments?.find(cp => cp.payment_type === 'deposit_commission')
      const finalCommission = commissionPayments?.find(cp => cp.payment_type === 'final_commission')

      // คำนวณยอดที่ได้และรอได้
      const commissionEarned = commissionPayments
        ?.filter(cp => cp.status === 'paid')
        .reduce((sum, cp) => sum + cp.amount, 0) || 0

      const commissionPending = commissionPayments
        ?.filter(cp => cp.status === 'pending')
        .reduce((sum, cp) => sum + cp.amount, 0) || 0

      setFlowState({
        booking_id: bookingId,
        current_status: booking.payment_status as any,
        deposit_commission_status: depositCommission?.status as any || 'pending',
        final_commission_status: finalCommission?.status as any || 'pending',
        total_amount: booking.total_amount,
        deposit_amount: booking.deposit_amount,
        remaining_amount: booking.remaining_amount,
        commission_total: booking.commission_amount,
        commission_earned: commissionEarned,
        commission_pending: commissionPending
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (bookingId) {
      fetchFlowState()
    }
  }, [bookingId])

  return {
    flowState,
    loading,
    error,
    refetch: fetchFlowState
  }
}
