import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/admin/gamification/campaigns/[id]
 * Update a gamification campaign (admin only)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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
    const campaignId = params.id

    // Update campaign
    const { data: campaign, error } = await supabase
      .from('gamification_campaigns' as any)
      .update(body)
      .eq('id', campaignId)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      return NextResponse.json({ error: error.message || 'Failed to update campaign' }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/gamification/campaigns/[id]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/gamification/campaigns/[id]
 * Delete a gamification campaign (admin only)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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

    const campaignId = params.id

    // Delete campaign
    const { error } = await supabase
      .from('gamification_campaigns' as any)
      .delete()
      .eq('id', campaignId)

    if (error) {
      console.error('Error deleting campaign:', error)
      return NextResponse.json({ error: error.message || 'Failed to delete campaign' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/gamification/campaigns/[id]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
