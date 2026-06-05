import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '../../database.types'

interface ScheduleWithSeats extends Tables<'trip_schedules'> {
  realTimeSeats?: number
}

// OPTIMIZED: Added realtimeVersion to trigger refetches from parent subscription
export function useTripSchedules(tripId: string, realtimeVersion?: number) {
  const [schedules, setSchedules] = useState<ScheduleWithSeats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchSchedulesWithSeats = async () => {
      setLoading(true)
      setError(null)

      try {

        // First, check if there are any schedules at all for this trip
        const { data: allSchedules, error: allSchedulesError } = await supabase
          .from('trip_schedules')
          .select('*')
          .eq('trip_id', tripId)


        if (allSchedulesError) {
          throw allSchedulesError
        }

        // Fetch active schedules (including today and future dates)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Start of today

        const { data: schedulesData, error: schedulesError } = await supabase
          .from('trip_schedules')
          .select('*')
          .eq('trip_id', tripId)
          .eq('is_active', true)
          .gte('departure_date', today.toISOString().split('T')[0]) // >= today (date only)
          .order('departure_date', { ascending: true })


        if (schedulesError) {
          throw schedulesError
        }

        if (!schedulesData || schedulesData.length === 0) {
          setSchedules([])
          return
        }

        // OPTIMIZED: Batch query for all bookings instead of N queries
        // Get all schedule IDs
        const scheduleIds = schedulesData.map(s => s.id)

        // Fetch all bookings for these schedules in ONE query
        const { data: allBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('trip_schedule_id, status')
          .in('trip_schedule_id', scheduleIds)
          .in('status', ['approved', 'pending', 'inprogress'])

        // Calculate seats for each schedule using the batch data
        const schedulesWithSeats = schedulesData.map(schedule => {
          // Count bookings for this specific schedule
          const bookedSeats = allBookings
            ? allBookings.filter(b => b.trip_schedule_id === schedule.id).length
            : 0

          const realTimeSeats = Math.max(0, schedule.available_seats - bookedSeats)

          return {
            ...schedule,
            realTimeSeats
          }
        })

        setSchedules(schedulesWithSeats)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedulesWithSeats()

    // OPTIMIZED: Removed individual subscription - now handled by parent component
    // This reduces 6 subscriptions (one per card) to 1 subscription at parent level
  }, [tripId, realtimeVersion]) // realtimeVersion triggers refetch when parent subscription fires

  return { schedules, loading, error, refetch: () => setSchedules([]) }
}
