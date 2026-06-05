import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TripFormData } from '@/types/admin'

// GET - List all trips (Admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    
    const supabase = await createClient()
    
    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Query trips with countries - optimized with select only needed fields
    let query = supabase
      .from('trips')
      .select(`
        id,
        title,
        description,
        price_per_person,
        total_seats,
        is_active,
        duration_days,
        duration_nights,
        created_at,
        updated_at,
        created_by,
        country_id,
        partner_id,
        cover_image_url,
        countries!inner (
          id,
          name,
          flag_emoji
        ),
        partners!left (
          id,
          name,
          logo_url
        ),
        trip_schedules (
          id,
          departure_date,
          return_date,
          available_seats,
          is_active
        )
      `, { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%, description.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: trips, error, count } = await query

    if (error) throw error


    const response = NextResponse.json({
      trips,
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / pageSize),
      pageSize
    })

    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error: any) {
    console.error('Admin trips GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new trip with schedules
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData: TripFormData = await request.json()

    // Validate form data
    const validationError = validateTripFormData(formData)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Insert trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        title: formData.title,
        description: formData.description,
        price_per_person: formData.price_per_person,
        duration_days: 1, // Default value - will be calculated from schedules
        duration_nights: 0, // Default value - will be calculated from schedules
        total_seats: 1, // Default value - individual schedules control available seats
        commission_type: formData.commission_type,
        commission_value: formData.commission_value,
        country_id: formData.country_id,
        cover_image_url: formData.cover_image_url,
        file_link: formData.file_link,
        is_active: formData.is_active,
        created_by: user.id
      })
      .select()
      .single()

    if (tripError) throw tripError

    // Insert schedules
    const schedules = formData.schedules.map(schedule => ({
      ...schedule,
      trip_id: trip.id
    }))

    const { data: tripSchedules, error: schedulesError } = await supabase
      .from('trip_schedules')
      .insert(schedules)
      .select()

    if (schedulesError) throw schedulesError

    return NextResponse.json({
      trip: {
        ...trip,
        trip_schedules: tripSchedules
      }
    })

  } catch (error: any) {
    console.error('Admin trips POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Validation function
function validateTripFormData(data: TripFormData): string | null {
  // Title validation
  if (!data.title || data.title.length < 5 || data.title.length > 200) {
    return 'Title must be between 5-200 characters'
  }

  // Description validation
  if (!data.description || data.description.length < 10 || data.description.length > 2000) {
    return 'Description must be between 10-2000 characters'
  }

  // Price validation
  if (data.price_per_person < 1 || data.price_per_person > 1000000) {
    return 'Price must be between ฿1 - ฿1,000,000'
  }



  // Commission validation
  if (data.commission_type === 'percentage' && (data.commission_value < 0 || data.commission_value > 100)) {
    return 'Commission percentage must be between 0-100%'
  }

  if (data.commission_type === 'fixed' && (data.commission_value < 0 || data.commission_value > 50000)) {
    return 'Commission fixed amount must be between ฿0 - ฿50,000'
  }

  // Country validation
  if (!data.country_id) {
    return 'Country is required'
  }

  // Schedules validation
  if (!data.schedules || data.schedules.length < 1) {
    return 'At least 1 schedule is required'
  }

  if (data.schedules.length > 10) {
    return 'Maximum 10 schedules allowed'
  }

  // Validate each schedule
  for (let i = 0; i < data.schedules.length; i++) {
    const schedule = data.schedules[i]
    const scheduleError = validateSchedule(schedule, i + 1)
    if (scheduleError) return scheduleError
  }

  return null
}

function validateSchedule(schedule: any, index: number): string | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const departureDate = new Date(schedule.departure_date)
  const returnDate = new Date(schedule.return_date)
  const registrationDeadline = new Date(schedule.registration_deadline)

  // Date validations
  if (departureDate <= today) {
    return `Schedule ${index}: Departure date must be in the future`
  }

  if (returnDate <= departureDate) {
    return `Schedule ${index}: Return date must be after departure date`
  }

  if (registrationDeadline >= departureDate) {
    return `Schedule ${index}: Registration deadline must be before departure date`
  }

  // Available seats validation
  if (schedule.available_seats < 1 || schedule.available_seats > 1000) {
    return `Schedule ${index}: Available seats must be between 1-1000`
  }

  return null
}
