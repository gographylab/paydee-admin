import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - Get single partner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { data: partner, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Partner not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching partner:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ partner })

  } catch (error: any) {
    console.error('Partner GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch partner' },
      { status: 500 }
    )
  }
}

// PUT - Update partner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, logo_url, contact_email, contact_phone, website, is_active } = body

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Partner name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Partner name must be less than 100 characters' },
        { status: 400 }
      )
    }

    // Optional email validation
    if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Use admin client for update
    const adminSupabase = createAdminClient()

    const { data: partner, error } = await adminSupabase
      .from('partners')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        logo_url: logo_url || null,
        contact_email: contact_email?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        website: website?.trim() || null,
        is_active: is_active ?? true
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Partner not found' },
          { status: 404 }
        )
      }
      console.error('Error updating partner:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      partner
    })

  } catch (error: any) {
    console.error('Partner PUT error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update partner' },
      { status: 500 }
    )
  }
}

// DELETE - Delete partner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Use admin client for operations
    const adminSupabase = createAdminClient()

    // Get partner data to check if it has a logo
    const { data: partner } = await adminSupabase
      .from('partners')
      .select('logo_url')
      .eq('id', id)
      .single()

    // First, set partner_id to NULL for all trips using this partner
    const { error: updateError } = await adminSupabase
      .from('trips')
      .update({ partner_id: null })
      .eq('partner_id', id)

    if (updateError) {
      console.error('Error removing partner from trips:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove partner from trips' },
        { status: 500 }
      )
    }

    // Delete logo from storage if exists
    if (partner?.logo_url) {
      try {
        // Extract file path from URL
        const url = new URL(partner.logo_url)
        const pathParts = url.pathname.split('/partner-logos/')
        if (pathParts.length > 1) {
          const filePath = pathParts[1]

          const { error: storageError } = await adminSupabase.storage
            .from('partner-logos')
            .remove([filePath])

          if (storageError) {
            console.error('Error deleting logo from storage:', storageError)
            // Continue with partner deletion even if logo deletion fails
          }
        }
      } catch (error) {
        console.error('Error parsing logo URL:', error)
        // Continue with partner deletion
      }
    }

    // Now delete the partner
    const { error } = await adminSupabase
      .from('partners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting partner:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Partner deleted successfully'
    })

  } catch (error: any) {
    console.error('Partner DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete partner' },
      { status: 500 }
    )
  }
}
