import { Tables, TablesInsert, TablesUpdate } from '../../database.types'

// Trip Types
export type Trip = Tables<'trips'> & {
  countries?: Tables<'countries'>
  partners?: Tables<'partners'>
  trip_schedules?: TripSchedule[]
}

export type TripInsert = TablesInsert<'trips'>
export type TripUpdate = TablesUpdate<'trips'>

// Trip Schedule Types
export type TripSchedule = Tables<'trip_schedules'>
export type TripScheduleInsert = TablesInsert<'trip_schedules'>
export type TripScheduleUpdate = TablesUpdate<'trip_schedules'>

// Form Types
export type TripFormData = {
  title: string
  description: string
  price_per_person: number
  commission_type: 'fixed' | 'percentage'
  commission_value: number
  country_id: string
  partner_id: string // Required: Partner who provides this trip
  cover_image_url?: string
  file_link?: string
  is_active: boolean
  schedules: TripScheduleFormData[]
}

export type TripScheduleFormData = {
  departure_date: string
  return_date: string
  registration_deadline: string
  available_seats: number
  is_active: boolean
}

// Country Type
export type Country = Tables<'countries'>

// Partner Types
export type Partner = Tables<'partners'>
export type PartnerInsert = TablesInsert<'partners'>
export type PartnerUpdate = TablesUpdate<'partners'>

// Partner with statistics
export type PartnerWithStats = Partner & {
  trips_count?: number
  total_bookings?: number
  total_revenue?: number
}

// Partner Form Data
export type PartnerFormData = {
  name: string
  description: string
  logo_url?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  is_active: boolean
}

// Commission Options
export const COMMISSION_TYPES = [
  { value: 'fixed', label: 'Fixed Amount (฿)' },
  { value: 'percentage', label: 'Percentage (%)' }
] as const

// Validation Rules
export const VALIDATION_RULES = {
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 2000,
  PRICE_MIN: 1,
  PRICE_MAX: 1000000,
  AVAILABLE_SEATS_MIN: 1,
  AVAILABLE_SEATS_MAX: 1000,
  COMMISSION_MIN: 0,
  COMMISSION_MAX_PERCENTAGE: 100,
  COMMISSION_MAX_FIXED: 50000,
  MIN_SCHEDULES: 1,
  MAX_SCHEDULES: 10
} as const
