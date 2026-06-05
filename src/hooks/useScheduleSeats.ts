import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useScheduleSeats(scheduleId: string | null) {
  const [availableSeats, setAvailableSeats] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!scheduleId) {
      setAvailableSeats(null)
      return
    }

    const fetchAvailableSeats = async () => {
      setLoading(true)
      setError(null)

      try {
        // Use the database function to get real-time available seats
        const { data, error } = await supabase
          .rpc('get_available_seats', { schedule_id: scheduleId })

        if (error) throw error

        setAvailableSeats(data || 0)
      } catch (err: any) {
        console.error('Error fetching available seats:', err)
        setError(err.message)
        
        // Fallback: calculate manually
        try {
          const { data: scheduleData } = await supabase
            .from('trip_schedules')
            .select('available_seats')
            .eq('id', scheduleId)
            .single()

          const { data: bookings } = await supabase
            .from('bookings')
            .select('status')
            .eq('trip_schedule_id', scheduleId)
            .in('status', ['approved', 'pending', 'inprogress'])

          const bookedSeats = bookings?.length || 0
          const totalSeats = scheduleData?.available_seats || 0
          setAvailableSeats(Math.max(0, totalSeats - bookedSeats))
        } catch (fallbackErr) {
          console.error('Fallback calculation failed:', fallbackErr)
          setAvailableSeats(0)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableSeats()

    // Set up real-time subscription for booking changes
    const channel = supabase
      .channel(`schedule-seats-${scheduleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `trip_schedule_id=eq.${scheduleId}`
        },
        () => {
          // Refetch when bookings change
          fetchAvailableSeats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [scheduleId])

  return { availableSeats, loading, error, refetch: () => {
    if (scheduleId) {
      setLoading(true)
      // Re-trigger the effect
      setAvailableSeats(null)
    }
  }}
}
