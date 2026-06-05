import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TripFormData } from '@/types/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET - Get single trip
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const resolvedParams = await context.params
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

    const { data: trip, error } = await supabase
      .from('trips')
      .select(`
        *,
        countries (
          id,
          name,
          flag_emoji
        ),
        partners (
          id,
          name,
          logo_url
        ),
        trip_schedules (
          id,
          departure_date,
          return_date,
          registration_deadline,
          available_seats,
          is_active,
          created_at
        )
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (error) throw error

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json({ trip })

  } catch (error: any) {
    console.error('Admin trip GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update trip and schedules
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const resolvedParams = await context.params
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

    // Update trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .update({
        title: formData.title,
        description: formData.description,
        price_per_person: formData.price_per_person,
        duration_days: 1, // Default value - will be calculated from schedules
        duration_nights: 0, // Default value - will be calculated from schedules
        total_seats: 1, // Default value - individual schedules control available seats
        commission_type: formData.commission_type,
        commission_value: formData.commission_value,
        country_id: formData.country_id,
        partner_id: formData.partner_id,
        cover_image_url: formData.cover_image_url,
        file_link: formData.file_link,
        is_active: formData.is_active
      })
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (tripError) throw tripError

    // Delete existing schedules
    await supabase
      .from('trip_schedules')
      .delete()
      .eq('trip_id', resolvedParams.id)

    // Insert new schedules
    const schedules = formData.schedules.map(schedule => ({
      ...schedule,
      trip_id: resolvedParams.id
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
    console.error('Admin trip PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete trip and all related schedules
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const resolvedParams = await context.params
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

    // Check if trip has any bookings
    const { data: scheduleIds } = await supabase
      .from('trip_schedules')
      .select('id')
      .eq('trip_id', resolvedParams.id)

    if (scheduleIds && scheduleIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .in('trip_schedule_id', scheduleIds.map(s => s.id))
        .limit(1)

      if (bookings && bookings.length > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete trip with existing bookings' 
        }, { status: 400 })
      }
    }

    // Delete trip schedules first (cascade will handle this, but being explicit)
    await supabase
      .from('trip_schedules')
      .delete()
      .eq('trip_id', resolvedParams.id)

    // Delete trip
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) throw error

    return NextResponse.json({ message: 'Trip deleted successfully' })

  } catch (error: any) {
    console.error('Admin trip DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Validation function (same as in main route)
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

  // Partner validation
  if (!data.partner_id) {
    return 'Partner is required'
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
