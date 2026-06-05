import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List all partners with pagination
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status') // 'active', 'inactive', or null for all
    const search = searchParams.get('search') // search by name

    const offset = (page - 1) * pageSize

    let query = supabase
      .from('partners')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filter by status
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Search by name
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data: partners, error, count } = await query

    if (error) {
      console.error('Error fetching partners:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      partners,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })

  } catch (error: any) {
    console.error('Partners GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch partners' },
      { status: 500 }
    )
  }
}

// POST - Create new partner
export async function POST(request: NextRequest) {
  try {
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

    // Use admin client for insert
    const adminSupabase = createAdminClient()

    const { data: partner, error } = await adminSupabase
      .from('partners')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        logo_url: logo_url || null,
        contact_email: contact_email?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        website: website?.trim() || null,
        is_active: is_active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating partner:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      partner
    }, { status: 201 })

  } catch (error: any) {
    console.error('Partner POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create partner' },
      { status: 500 }
    )
  }
}
