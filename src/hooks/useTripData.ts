import { useMemo } from 'react'
import { Tables } from '../../database.types'
import { 
    calculateDuration, 
    calculateCommission, 
    formatDateRange,
    formatThaiDate 
} from '../utils/tripUtils'
import { TRIP_CARD_CONSTANTS } from '../constants/tripCard'

interface TripWithRelations extends Tables<'trips'> {
    countries?: Tables<'countries'> | null
    next_schedule?: Tables<'trip_schedules'> | null
    seller_bookings_count?: number
    available_seats?: number | null
}

export function useTripData(trip: TripWithRelations) {
    // คำนวณจำนวนวัน/คืนจาก schedule จริง หรือใช้ template
    const duration = useMemo(() => {
        if (trip.next_schedule) {
            return calculateDuration(
                trip.next_schedule.departure_date,
                trip.next_schedule.return_date
            )
        }
        // fallback ไป template
        return { days: trip.duration_days, nights: trip.duration_nights }
    }, [trip.next_schedule, trip.duration_days, trip.duration_nights])

    // คำนวณคอมมิชชั่น
    const commission = useMemo(() => {
        return calculateCommission(
            trip.price_per_person,
            trip.commission_value,
            trip.commission_type
        )
    }, [trip.commission_type, trip.price_per_person, trip.commission_value])

    // Format วันที่เดินทาง
    const dateRange = useMemo(() => {
        if (!trip.next_schedule) return TRIP_CARD_CONSTANTS.NO_SCHEDULE_TEXT

        return formatDateRange(
            trip.next_schedule.departure_date,
            trip.next_schedule.return_date
        )
    }, [trip.next_schedule])

    // Format deadline และ total seats
    const deadlineInfo = useMemo(() => {
        if (!trip.next_schedule) return TRIP_CARD_CONSTANTS.NO_SCHEDULE_TEXT

        const deadline = new Date(trip.next_schedule.registration_deadline)
        const deadlineStr = formatThaiDate(deadline, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })

        return `${deadlineStr} / ${trip.next_schedule.available_seats} seats`
    }, [trip.next_schedule])

    return {
        duration,
        commission,
        dateRange,
        deadlineInfo,
        availableSeats: trip.available_seats || 0,
        mySales: trip.seller_bookings_count || 0
    }
}
