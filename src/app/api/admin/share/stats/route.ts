import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = createAdminClient()

    // Get total click count
    const { count: totalClicks } = await db
      .from('share_click_events')
      .select('*', { count: 'exact', head: true })

    // Get total coins awarded from sharing
    const { data: totalAwardsData } = await db
      .from('share_coin_awards')
      .select('coins_awarded')

    const totalCoinsAwarded = (totalAwardsData || []).reduce(
      (sum: number, a: { coins_awarded: number }) => sum + Number(a.coins_awarded), 0
    )

    // Get unique sellers who shared
    const { data: uniqueSellers } = await db
      .from('share_click_events')
      .select('seller_id')

    const uniqueSellerCount = new Set(
      (uniqueSellers || []).map((s: { seller_id: string }) => s.seller_id)
    ).size

    // Get unique trips shared
    const { data: uniqueTrips } = await db
      .from('share_click_events')
      .select('trip_id')

    const uniqueTripCount = new Set(
      (uniqueTrips || []).map((t: { trip_id: string }) => t.trip_id)
    ).size

    // Top sellers by clicks
    const { data: clicksBySeller } = await db
      .from('share_click_events')
      .select('seller_id')

    const sellerClickCounts: Record<string, number> = {}
    for (const row of (clicksBySeller || []) as { seller_id: string }[]) {
      sellerClickCounts[row.seller_id] = (sellerClickCounts[row.seller_id] || 0) + 1
    }

    const topSellerIds = Object.entries(sellerClickCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    let topSellers: { seller_id: string; full_name: string; clicks: number; coins_earned: number }[] = []
    if (topSellerIds.length > 0) {
      const { data: sellerProfiles } = await db
        .from('user_profiles')
        .select('id, full_name')
        .in('id', topSellerIds)

      const sellerNameMap = Object.fromEntries(
        (sellerProfiles || []).map(s => [s.id, s.full_name || 'Unknown'])
      )

      // Get coins per seller
      const { data: awardsBySeller } = await db
        .from('share_coin_awards')
        .select('seller_id, coins_awarded')
        .in('seller_id', topSellerIds)

      const sellerCoinsMap: Record<string, number> = {}
      for (const a of (awardsBySeller || []) as { seller_id: string; coins_awarded: number }[]) {
        sellerCoinsMap[a.seller_id] = (sellerCoinsMap[a.seller_id] || 0) + Number(a.coins_awarded)
      }

      topSellers = topSellerIds.map(id => ({
        seller_id: id,
        full_name: sellerNameMap[id] || 'Unknown',
        clicks: sellerClickCounts[id],
        coins_earned: sellerCoinsMap[id] || 0,
      }))
    }

    // Active share campaigns
    const { data: activeCampaigns } = await db
      .from('coin_bonus_campaigns')
      .select('id, title, target_trip_id, coin_amount, conditions, start_date, end_date, is_active')
      .eq('campaign_type', 'share_clicks')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      summary: {
        total_clicks: totalClicks || 0,
        total_coins_awarded: totalCoinsAwarded,
        unique_sellers: uniqueSellerCount,
        unique_trips: uniqueTripCount,
      },
      top_sellers: topSellers,
      campaigns: activeCampaigns || [],
    })
  } catch (error) {
    console.error('Admin share stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
