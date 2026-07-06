import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: claims } = await supabase.auth.getClaims()
    const userId = claims?.claims?.sub
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Create cache key
    const cacheKey = `admin_coin_stats`

    // Check cache first
    const cachedResult = apiCache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Get every seller_coins row once and derive all four aggregates from it,
    // plus the active campaigns count, in parallel
    const [{ data: sellerCoinsData }, { count: activeCampaignsCount }] = await Promise.all([
      supabase
        .from('seller_coins')
        .select('total_earned, total_redeemed, locked_balance, redeemable_balance'),
      supabase
        .from('coin_bonus_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
    ])

    const totalDistributed = sellerCoinsData?.reduce((sum, item) => sum + (Number(item.total_earned) || 0), 0) || 0

    const totalRedeemed = sellerCoinsData?.reduce((sum, item) => sum + (Number(item.total_redeemed) || 0), 0) || 0

    const currentBalance = sellerCoinsData?.reduce((sum, item: any) =>
      sum + (Number(item.locked_balance) || 0) + (Number(item.redeemable_balance) || 0), 0) || 0

    // Get pending redemptions
    const { data: pendingRedemptions, count: pendingCount } = await supabase
      .from('coin_redemptions')
      .select('coin_amount, cash_amount', { count: 'exact' })
      .eq('status', 'pending')

    const pendingCoins = pendingRedemptions?.reduce((sum, item) => sum + (Number(item.coin_amount) || 0), 0) || 0
    const pendingCash = pendingRedemptions?.reduce((sum, item) => sum + (Number(item.cash_amount) || 0), 0) || 0

    // Get approved but not paid redemptions
    const { data: approvedRedemptions, count: approvedCount } = await supabase
      .from('coin_redemptions')
      .select('coin_amount, cash_amount', { count: 'exact' })
      .eq('status', 'approved')

    const approvedCoins = approvedRedemptions?.reduce((sum, item) => sum + (Number(item.coin_amount) || 0), 0) || 0
    const approvedCash = approvedRedemptions?.reduce((sum, item) => sum + (Number(item.cash_amount) || 0), 0) || 0

    // Get active sellers with coins
    const sellersWithCoinsCount = sellerCoinsData?.filter((s: any) =>
      ((Number(s.locked_balance) || 0) + (Number(s.redeemable_balance) || 0)) > 0
    ).length || 0

    const result = {
      total_distributed: totalDistributed,
      total_redeemed: totalRedeemed,
      current_balance: currentBalance,
      pending_redemptions: {
        count: pendingCount || 0,
        coins: pendingCoins,
        cash: pendingCash
      },
      approved_redemptions: {
        count: approvedCount || 0,
        coins: approvedCoins,
        cash: approvedCash
      },
      active_campaigns: activeCampaignsCount || 0,
      sellers_with_coins: sellersWithCoinsCount
    }

    // Cache the result for 30 seconds
    apiCache.set(cacheKey, result, 30000)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in GET /api/admin/coins/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
