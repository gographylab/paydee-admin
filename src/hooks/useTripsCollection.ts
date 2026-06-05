import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TripWithRelations } from '../types/trip'

export function useTripsCollection() {
    const [trips, setTrips] = useState<TripWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)

    const supabase = createClient()

    const fetchTrips = async () => {
        try {
            setLoading(true)
            
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            const currentUserId = user?.id || null
            setUserId(currentUserId)

            // Get user profile to check role
            const { data: profile } = currentUserId ? await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', currentUserId)
                .single() : { data: null }

            setUserRole(profile?.role || null)

            // Get all active trips with related data
            const { data: tripsData, error: tripsError } = await supabase
                .from('trips')
                .select(`
                    *,
                    countries (
                        name,
                        flag_emoji
                    )
                `)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (tripsError) throw tripsError

            // Get next schedules for each trip
            const tripsWithSchedules = await Promise.all(
                (tripsData || []).map(async (trip) => {
                    // Get next upcoming schedule
                    const { data: nextSchedule } = await supabase
                        .from('trip_schedules')
                        .select('*')
                        .eq('trip_id', trip.id)
                        .eq('is_active', true)
                        .gt('departure_date', new Date().toISOString())
                        .order('departure_date', { ascending: true })
                        .limit(1)
                        .single()

                    // Get available seats if schedule exists
                    let availableSeats = null
                    if (nextSchedule) {
                        const { data: availableSeatsData } = await supabase
                            .rpc('get_available_seats', { schedule_id: nextSchedule.id })
                        availableSeats = availableSeatsData
                    }

                    // Get seller bookings count (only for seller view)
                    let sellerBookingsCount = 0
                    if (currentUserId && profile?.role === 'seller' && nextSchedule) {
                        const { count } = await supabase
                            .from('bookings')
                            .select('*', { count: 'exact', head: true })
                            .eq('seller_id', currentUserId)
                            .eq('trip_schedule_id', nextSchedule.id)
                            .in('status', ['confirmed', 'pending'])
                        
                        sellerBookingsCount = count || 0
                    }

                    return {
                        ...trip,
                        countries: trip.countries as any,
                        next_schedule: nextSchedule,
                        available_seats: availableSeats,
                        seller_bookings_count: sellerBookingsCount
                    }
                })
            )

            setTrips(tripsWithSchedules)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTrips()
    }, [])

    return {
        trips,
        loading,
        error,
        userId,
        userRole,
        refetch: fetchTrips
    }
}
