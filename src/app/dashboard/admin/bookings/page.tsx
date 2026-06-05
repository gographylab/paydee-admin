import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

// OPTIMIZED: Code splitting - lazy load admin component
const AdminBookingsClient = dynamic(
  () => import('./AdminBookingsClient'),
  {
    loading: () => (
      <div className="p-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-sm text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }
)

export default async function AdminBookingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Use server-side API call instead of fetch
  // We'll use the same optimized logic but directly here for initial load
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      customers!inner (
        id,
        full_name,
        email,
        phone,
        id_card,
        passport_number
      ),
      trip_schedules!inner (
        id,
        departure_date,
        return_date,
        registration_deadline,
        available_seats,
        trips!inner (
          id,
          title,
          price_per_person,
          commission_type,
          commission_value,
          countries (
            name,
            flag_emoji
          )
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20) // OPTIMIZED: Reduced from 50 to 20 for faster initial load

  // Create admin client for all admin operations
  const adminSupabase = createAdminClient()

  // Get sellers in one optimized query
  const sellerIds = [...new Set(
    bookings?.filter(b => b.seller_id).map(b => b.seller_id).filter(Boolean) || []
  )] as string[]

  let sellersMap = new Map()
  if (sellerIds.length > 0) {
    const { data: sellersData } = await adminSupabase
      .from('user_profiles')
      .select('id, full_name, email, referral_code, avatar_url')
      .in('id', sellerIds)

    sellersData?.forEach(seller => {
      sellersMap.set(seller.id, seller)
    })
  }

  // Get commission payments in one query
  const bookingIds = bookings?.map(b => b.id) || []
  let commissionsMap = new Map()
  if (bookingIds.length > 0) {
    const { data: commissions } = await supabase
      .from('commission_payments')
      .select('booking_id, id, payment_type, amount, status, paid_at')
      .in('booking_id', bookingIds)

    commissions?.forEach(commission => {
      if (!commissionsMap.has(commission.booking_id)) {
        commissionsMap.set(commission.booking_id, [])
      }
      commissionsMap.get(commission.booking_id).push(commission)
    })
  }

  // Combine data efficiently
  const initialBookings = bookings?.map(booking => ({
    ...booking,
    seller: booking.seller_id ? sellersMap.get(booking.seller_id) || null : null,
    commission_payments: commissionsMap.get(booking.id) || [],
    // Fix type compatibility
    trip_schedules: {
      ...booking.trip_schedules,
      trips: {
        ...booking.trip_schedules?.trips,
        countries: booking.trip_schedules?.trips?.countries || undefined
      }
    }
  })) || []

  // Fetch sellers for the create booking form (lightweight query)
  // Use admin client to bypass RLS policy restrictions (reuse existing adminSupabase)
  const { data: sellers, error: sellersError } = await adminSupabase
    .from('user_profiles')
    .select('id, full_name, email, referral_code, avatar_url, status, role')
    .eq('role', 'seller')
    .eq('status', 'approved')
    .order('full_name')

  if (sellersError) {
    console.error('Error fetching sellers:', sellersError)
  }

  // Fetch active trips with schedules for the create booking form (lightweight query)
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      *,
      countries (
        name,
        flag_emoji
      ),
      trip_schedules (
        id,
        departure_date,
        return_date,
        registration_deadline,
        available_seats,
        is_active
      )
    `)
    .eq('is_active', true)
    .order('title')

  // Transform trips data to match TripWithSchedules type
  const transformedTrips = trips?.map(trip => ({
    ...trip,
    countries: trip.countries || undefined
  })) || []

  return (
    <AdminBookingsClient 
      initialBookings={initialBookings}
      sellers={sellers || []}
      trips={transformedTrips}
    />
  )
}
