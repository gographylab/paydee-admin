import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, rejection_reason, notes } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    if (!['approved', 'rejected', 'paid'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json({ error: 'Rejection reason is required when rejecting' }, { status: 400 })
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

    // Get redemption details
    const { data: redemption, error: fetchError } = await supabase
      .from('coin_redemptions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !redemption) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 })
    }

    // Check if redemption is in pending status
    if (redemption.status !== 'pending' && redemption.status !== 'approved') {
      return NextResponse.json({
        error: `Cannot update redemption with status: ${redemption.status}`
      }, { status: 400 })
    }

    // If approving or rejecting, we need to use admin client to deduct coins
    const adminSupabase = createAdminClient()

    // Build update object
    const updateData: any = {
      status
    }

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = user.id

      // Get current balance
      const { data: currentBalance, error: balanceError } = await adminSupabase
        .from('seller_coins')
        .select('redeemable_balance')
        .eq('seller_id', redemption.seller_id)
        .single()

      if (balanceError) {
        console.error('Error fetching current balance:', balanceError)
        return NextResponse.json({ error: 'Failed to fetch current balance' }, { status: 500 })
      }

      const balance_before = currentBalance?.redeemable_balance || 0
      const balance_after = balance_before - redemption.coin_amount

      // Ensure balance doesn't go negative
      if (balance_after < 0) {
        return NextResponse.json({
          error: `Cannot deduct ${redemption.coin_amount} coins. Seller only has ${balance_before} coins available.`
        }, { status: 400 })
      }

      // Insert redemption transaction
      const { error: deductError } = await adminSupabase
        .from('coin_transactions')
        .insert({
          seller_id: redemption.seller_id,
          transaction_type: 'redeem',
          source_type: 'admin',
          source_id: id,
          amount: -redemption.coin_amount,
          balance_before,
          balance_after,
          description: `Coin redemption approved: ${redemption.coin_amount} coins to ${redemption.cash_amount} THB`,
          metadata: {
            redemption_id: id,
            cash_amount: redemption.cash_amount,
            conversion_rate: redemption.conversion_rate
          }
        })

      if (deductError) {
        console.error('Error deducting coins:', deductError)
        return NextResponse.json({ error: 'Failed to deduct coins: ' + deductError.message }, { status: 500 })
      }

      // Update seller_coins balance
      const { error: updateBalanceError } = await adminSupabase
        .from('seller_coins')
        .update({
          redeemable_balance: balance_after,
          total_redeemed: redemption.coin_amount,
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', redemption.seller_id)

      if (updateBalanceError) {
        console.error('Error updating seller balance:', updateBalanceError)
        return NextResponse.json({
          error: 'Transaction recorded but balance update failed. Please check manually.'
        }, { status: 500 })
      }
    }

    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason
    }

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
    }

    // Update redemption
    const { data: updatedRedemption, error: updateError } = await supabase
      .from('coin_redemptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating redemption:', updateError)
      return NextResponse.json({ error: 'Failed to update redemption' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Redemption ${status} successfully`,
      redemption: updatedRedemption
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/coins/redemptions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
