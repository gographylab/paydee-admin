import { Database } from '../../database.types'

type Tables = Database['public']['Tables']

// Booking Types
export type BookingRow = Tables['bookings']['Row']
export type BookingInsert = Tables['bookings']['Insert']
export type BookingUpdate = Tables['bookings']['Update']

// Commission Payment Types
export type CommissionPaymentRow = Tables['commission_payments']['Row']
export type CommissionPaymentInsert = Tables['commission_payments']['Insert']
export type CommissionPaymentUpdate = Tables['commission_payments']['Update']

// Payment Status Enum
export type PaymentStatus = 'pending' | 'deposit_paid' | 'fully_paid' | 'cancelled'

// Commission Payment Type Enum
export type CommissionPaymentType = 'deposit_commission' | 'final_commission'

// Commission Status Enum
export type CommissionStatus = 'pending' | 'paid' | 'cancelled'

// Extended Booking with related data
export interface BookingWithDetails extends BookingRow {
  customer?: {
    id: string
    full_name: string
    email: string
    phone: string | null
  }
  trip_schedule?: {
    id: string
    departure_date: string
    return_date: string
    trip?: {
      id: string
      title: string
      price_per_person: number
      commission_value: number
      commission_type: string | null
      country?: {
        name: string
        flag_emoji: string | null
      }
    }
  }
  commission_payments?: CommissionPaymentRow[]
}

// Commission Summary for Seller Dashboard
export interface CommissionSummary {
  total_earned: number
  pending_amount: number
  this_month_earned: number
  total_bookings: number
  commission_payments: CommissionPaymentWithBooking[]
}

// Commission Payment with Booking Details
export interface CommissionPaymentWithBooking extends CommissionPaymentRow {
  booking?: {
    id: string
    total_amount: number
    payment_status: string | null
    customer?: {
      full_name: string
      email: string
    }
    trip_schedule?: {
      departure_date: string
      trip?: {
        title: string
        country?: {
          name: string
          flag_emoji: string | null
        }
      }
    }
  }
}

// Commission Flow State
export interface CommissionFlowState {
  booking_id: string
  current_status: PaymentStatus
  deposit_commission_status: CommissionStatus
  final_commission_status: CommissionStatus
  total_amount: number
  deposit_amount: number | null
  remaining_amount: number | null
  commission_total: number
  commission_earned: number
  commission_pending: number
}

// Commission Analytics
export interface CommissionAnalytics {
  total_commissions: number
  paid_commissions: number
  pending_commissions: number
  cancelled_commissions: number
  commission_rate: number
  monthly_breakdown: {
    month: string
    total_earned: number
    bookings_count: number
  }[]
}
