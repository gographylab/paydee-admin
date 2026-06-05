import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
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

    // Create cache key
    const cacheKey = `admin_coin_stats`

    // Check cache first
    const cachedResult = apiCache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Get total coins distributed
    const { data: totalEarnedData } = await supabase
      .from('seller_coins')
      .select('total_earned')

    const totalDistributed = totalEarnedData?.reduce((sum, item) => sum + (Number(item.total_earned) || 0), 0) || 0

    // Get total coins redeemed
    const { data: totalRedeemedData } = await supabase
      .from('seller_coins')
      .select('total_redeemed')

    const totalRedeemed = totalRedeemedData?.reduce((sum, item) => sum + (Number(item.total_redeemed) || 0), 0) || 0

    // Get current total balance (locked + redeemable)
    const { data: balanceData } = await supabase
      .from('seller_coins')
      .select('locked_balance, redeemable_balance')

    const currentBalance = balanceData?.reduce((sum, item: any) =>
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

    // Get active gamification campaigns count
    // Note: gamification_campaigns table might not exist yet
    const activeCampaignsCount = 0

    // Get active sellers with coins
    const { data: sellersData } = await supabase
      .from('seller_coins')
      .select('locked_balance, redeemable_balance')

    const sellersWithCoinsCount = sellersData?.filter((s: any) =>
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
