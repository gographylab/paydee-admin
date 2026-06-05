import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { apiCache } from '@/lib/cache'

export async function POST(request: NextRequest) {
  try {
    const { action, bookingIds, data } = await request.json()

    if (!action || !bookingIds || !Array.isArray(bookingIds)) {
      return NextResponse.json(
        { error: 'Missing action or bookingIds' },
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

    let updateData: any = { updated_at: new Date().toISOString() }
    let message = ''

    switch (action) {
      case 'approve':
        updateData.status = 'approved'
        updateData.approved_at = new Date().toISOString()
        updateData.approved_by = user.id
        message = 'อนุมัติการจองสำเร็จ'
        break

      case 'reject':
        updateData.status = 'rejected'
        message = 'ปฏิเสธการจองสำเร็จ'
        break

      case 'cancel':
        updateData.status = 'cancelled'
        message = 'ยกเลิกการจองสำเร็จ'
        break

      case 'assign_seller':
        if (!data?.sellerId) {
          return NextResponse.json(
            { error: 'Missing sellerId for assign_seller action' },
            { status: 400 }
          )
        }

        // Validate seller
        const { data: seller } = await supabase
          .from('user_profiles')
          .select('id, role, status')
          .eq('id', data.sellerId)
          .single()

        if (!seller || seller.role !== 'seller' || seller.status !== 'approved') {
          return NextResponse.json(
            { error: 'Invalid or inactive seller' },
            { status: 400 }
          )
        }

        updateData.seller_id = data.sellerId
        message = 'กำหนด Seller สำเร็จ'
        break

      case 'remove_seller':
        updateData.seller_id = null
        message = 'ลบ Seller สำเร็จ'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update bookings
    const { data: result, error } = await supabase
      .from('bookings')
      .update(updateData)
      .in('id', bookingIds)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `${message} (${bookingIds.length} รายการ)`,
      affectedCount: result?.length || 0
    })

  } catch (error) {
    console.error('Error in bulk operations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
