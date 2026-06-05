import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { apiCache } from '@/lib/cache'

export async function POST(request: NextRequest) {
  try {
    const { bookingId, sellerId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Validate seller if provided
    if (sellerId) {
      const adminSupabase = createAdminClient()
      const { data: seller } = await adminSupabase
        .from('user_profiles')
        .select('id, role, status')
        .eq('id', sellerId)
        .single()

      if (!seller || seller.role !== 'seller' || seller.status !== 'approved') {
        return NextResponse.json(
          { error: 'Invalid or inactive seller' },
          { status: 400 }
        )
      }
    }

    // Update booking seller using admin client to avoid RLS issues
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from('bookings')
      .update({ 
        seller_id: sellerId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // OPTIMIZED: Clear admin bookings cache for this user
    apiCache.clearPattern(`admin_bookings_${user.id}`)

    return NextResponse.json({ 
      success: true, 
      data,
      message: sellerId ? 'อัพเดท Seller สำเร็จ' : 'ลบ Seller สำเร็จ'
    })

  } catch (error) {
    console.error('Error updating booking seller:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
