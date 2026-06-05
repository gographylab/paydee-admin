import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/utils/bookingUtils'
import type { CustomerData } from '@/hooks/useCustomers'

interface UseBookingActionsParams {
  trip: any
  schedule: any
  seller: any
  tripId: string
  scheduleId: string
  customers: CustomerData[]
}

export function useBookingActions({
  trip,
  schedule,
  seller,
  tripId,
  scheduleId,
  customers
}: UseBookingActionsParams) {
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const calculateTotalAmount = () => {
    return trip ? trip.price_per_person * customers.length : 0
  }

  const calculateCommissionAmount = () => {
    if (!trip) return 0
    
    return trip.commission_type === 'percentage'
      ? (trip.price_per_person * trip.commission_value) / 100 * customers.length
      : trip.commission_value * customers.length
  }

  const createCustomerBooking = async (customerData: CustomerData, isMainCustomer: boolean) => {
    // Create customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        ...customerData,
        referred_by_code: seller?.referral_code,
        referred_by_seller_id: seller?.id
      })
      .select()
      .single()

    if (customerError) throw customerError

    // Create individual booking for each customer
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        trip_schedule_id: scheduleId,
        customer_id: customer.id,
        seller_id: seller?.id,
        total_amount: trip.price_per_person,
        commission_amount: trip.commission_type === 'percentage'
          ? (trip.price_per_person * trip.commission_value) / 100
          : trip.commission_value,
        status: 'pending',
        notes: isMainCustomer 
          ? `ผู้ติดต่อหลัก - จองทั้งหมด ${customers.length} คน (รวม: ${formatPrice(calculateTotalAmount())})`
          : `ผู้เดินทางร่วมกับ ${customers[0].full_name}`
      })
      .select()
      .single()

    if (bookingError) throw bookingError
    return booking.id
  }

  const handleBooking = async (validateMainCustomer: () => boolean) => {
    if (!validateMainCustomer()) {
      setError('กรุณากรอกข้อมูลผู้ติดต่อหลักให้ครบถ้วน')
      return
    }

    if (!trip || !schedule) {
      setError('ไม่พบข้อมูลทริป')
      return
    }

    try {
      setIsBooking(true)
      setError(null)

      // Check available seats before booking
      const { data: availableSeats, error: seatsError } = await supabase
        .rpc('get_available_seats', { schedule_id: scheduleId })

      if (seatsError) {
        console.warn('Failed to get real-time seats, using fallback calculation')
        
        // Fallback: manual calculation
        const { data: bookings } = await supabase
          .from('bookings')
          .select('status')
          .eq('trip_schedule_id', scheduleId)
          .in('status', ['approved', 'pending', 'inprogress'])

        const bookedSeats = bookings?.length || 0
        const calculatedSeats = Math.max(0, schedule.available_seats - bookedSeats)
        
        if (customers.length > calculatedSeats) {
          setError(`ที่นั่งไม่เพียงพอ มีที่นั่งเหลือเพียง ${calculatedSeats} ที่นั่ง`)
          return
        }
      } else {
        if (customers.length > (availableSeats || 0)) {
          setError(`ที่นั่งไม่เพียงพอ มีที่นั่งเหลือเพียง ${availableSeats || 0} ที่นั่ง`)
          return
        }
      }

      // Create customers and bookings
      const bookingIds: string[] = []
      let isMainCustomer = true
      
      for (const customerData of customers) {
        const bookingId = await createCustomerBooking(customerData, isMainCustomer)
        bookingIds.push(bookingId)
        isMainCustomer = false
      }

      // Redirect to success page
      router.push('/book/success')

    } catch (err: any) {
      console.error('Error creating booking:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการจอง')
    } finally {
      setIsBooking(false)
    }
  }

  return {
    isBooking,
    error,
    calculateTotalAmount,
    calculateCommissionAmount,
    handleBooking,
    setError
  }
}
