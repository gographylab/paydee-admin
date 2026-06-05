import { Tables } from '../../database.types'

export interface TripWithRelations extends Tables<'trips'> {
    countries?: Tables<'countries'> | null
    partners?: Tables<'partners'> | null
    trip_schedules?: Tables<'trip_schedules'>[] | null
    next_schedule?: Tables<'trip_schedules'> | null
    seller_bookings_count?: number
    available_seats?: number | null
}

export interface SellerData {
    referral_code: string | null
    status: string | null
}

export interface TripCardProps {
    trip: TripWithRelations
    viewType?: 'seller' | 'general'
    currentSellerId?: string
    sellerData?: SellerData | null
    realtimeVersion?: number
}

export type ViewType = 'seller' | 'general'
