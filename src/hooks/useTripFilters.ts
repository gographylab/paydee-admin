import { useMemo } from 'react'
import { TripWithRelations } from '../types/trip'

export type TabType = 'all' | 'sold' | 'not_sold' | 'full'

export function useTripFilters(trips: TripWithRelations[], userRole: string | null, activeTab: TabType) {
    const filteredTrips = useMemo(() => {
        if (!userRole || userRole !== 'seller') {
            return trips // Show all trips for non-sellers
        }

        switch (activeTab) {
            case 'all':
                return trips
            case 'sold':
                // If seller has any bookings (any status), count as "sold"
                return trips.filter(trip => trip.seller_bookings_count && trip.seller_bookings_count > 0)
            case 'not_sold':
                return trips.filter(trip => !trip.seller_bookings_count || trip.seller_bookings_count === 0)
            case 'full':
                return trips.filter(trip => trip.available_seats === 0)
            default:
                return trips
        }
    }, [trips, userRole, activeTab])

    const tripCounts = useMemo(() => ({
        all: trips.length,
        // If seller has any bookings (any status), count as "sold"
        sold: trips.filter(trip => trip.seller_bookings_count && trip.seller_bookings_count > 0).length,
        not_sold: trips.filter(trip => !trip.seller_bookings_count || trip.seller_bookings_count === 0).length,
        full: trips.filter(trip => trip.available_seats === 0).length
    }), [trips])

    return {
        filteredTrips,
        tripCounts
    }
}
