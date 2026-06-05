import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

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

    // Validate dates if both are provided
    if (body.start_date && body.end_date) {
      if (new Date(body.end_date) <= new Date(body.start_date)) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
      }
    }

    // Validate coin amount if provided
    if (body.coin_amount !== undefined && body.coin_amount <= 0) {
      return NextResponse.json({ error: 'Coin amount must be greater than 0' }, { status: 400 })
    }

    // Build update object
    const updateData: any = {}
    const allowedFields = [
      'title', 'description', 'campaign_type', 'coin_amount',
      'target_trip_id', 'start_date', 'end_date', 'is_active', 'conditions'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    // Update campaign
    const { data: campaign, error: updateError } = await supabase
      .from('coin_bonus_campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating campaign:', updateError)
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Campaign updated successfully',
      campaign
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/coins/campaigns/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
