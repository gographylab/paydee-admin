import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status')
    const sellerId = searchParams.get('seller_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

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

    // Build query with joins
    let query = supabase
      .from('coin_redemptions')
      .select(`
        *,
        seller:user_profiles!coin_redemptions_seller_id_fkey(id, full_name, email),
        bank_account:bank_accounts!coin_redemptions_bank_account_id_fkey(bank_name, account_number, account_name),
        approver:user_profiles!coin_redemptions_approved_by_fkey(full_name, email)
      `, { count: 'exact' })
      .order('requested_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status as any)
    }
    if (sellerId) {
      query = query.eq('seller_id', sellerId)
    }
    if (startDate) {
      query = query.gte('requested_at', startDate)
    }
    if (endDate) {
      query = query.lte('requested_at', endDate)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: redemptions, error, count } = await query

    if (error) {
      console.error('Error fetching redemptions:', error)
      return NextResponse.json({ error: 'Failed to fetch redemptions' }, { status: 500 })
    }

    return NextResponse.json({
      redemptions: redemptions || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/coins/redemptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
