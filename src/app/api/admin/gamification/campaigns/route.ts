import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/gamification/campaigns
 * Fetch all gamification campaigns (admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all campaigns
    const { data: campaigns, error } = await supabase
      .from('gamification_campaigns' as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({ campaigns: campaigns || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/gamification/campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/gamification/campaigns
 * Create a new gamification campaign (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      condition_1_type,
      condition_1_reward_amount,
      condition_1_reward_type,
      condition_2_type,
      condition_2_action,
      condition_2_bonus_amount,
      start_date,
      end_date,
      is_active
    } = body

    // Validate required fields
    if (!title || !condition_1_type || !condition_1_reward_amount || !condition_1_reward_type ||
        !condition_2_type || !condition_2_action || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert campaign
    const { data: campaign, error } = await supabase
      .from('gamification_campaigns' as any)
      .insert({
        title,
        description,
        condition_1_type,
        condition_1_reward_amount,
        condition_1_reward_type,
        condition_2_type,
        condition_2_action,
        condition_2_bonus_amount: condition_2_bonus_amount || 0,
        start_date,
        end_date,
        is_active: is_active !== undefined ? is_active : true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/gamification/campaigns:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
