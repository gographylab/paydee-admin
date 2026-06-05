import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      campaign_type,
      coin_amount,
      target_trip_id,
      start_date,
      end_date,
      conditions
    } = body

    // Validation
    if (!title || !campaign_type || !coin_amount || !start_date || !end_date) {
      return NextResponse.json({
        error: 'Missing required fields: title, campaign_type, coin_amount, start_date, end_date'
      }, { status: 400 })
    }

    if (coin_amount <= 0) {
      return NextResponse.json({ error: 'Coin amount must be greater than 0' }, { status: 400 })
    }

    if (new Date(end_date) <= new Date(start_date)) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('coin_bonus_campaigns')
      .insert({
        title,
        description: description || null,
        campaign_type,
        coin_amount,
        target_trip_id: target_trip_id || null,
        start_date,
        end_date,
        is_active: true,
        conditions: conditions || {},
        created_by: user.id
      })
      .select()
      .single()

    if (campaignError) {
      console.error('Error creating campaign:', campaignError)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Campaign created successfully',
      campaign
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/admin/coins/campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const isActive = searchParams.get('is_active')

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Build query
    let query = supabase
      .from('coin_bonus_campaigns')
      .select('*, user_profiles!coin_bonus_campaigns_created_by_fkey(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: campaigns, error, count } = await query

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/coins/campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
