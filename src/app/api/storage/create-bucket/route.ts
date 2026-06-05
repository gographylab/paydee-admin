import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if bucket already exists
    const { data: buckets } = await adminClient.storage.listBuckets()
    const existingBucket = buckets?.find(b => b.name === 'seller-assets')
    
    if (existingBucket) {
      return NextResponse.json({ 
        message: 'Bucket already exists',
        bucket: existingBucket
      })
    }

    // Create bucket without RLS (public bucket)
    const { data, error } = await adminClient.storage.createBucket('seller-assets', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    })

    if (error) {
      console.error('Bucket creation error:', error)
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      bucket: data,
      message: 'Public bucket created successfully (no RLS required)'
    })

  } catch (error: any) {
    console.error('Create bucket error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create bucket'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // List all buckets
    const { data: buckets, error } = await adminClient.storage.listBuckets()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const sellerBucket = buckets?.find(b => b.name === 'seller-assets')

    return NextResponse.json({ 
      allBuckets: buckets,
      sellerBucket: sellerBucket || null,
      exists: !!sellerBucket
    })

  } catch (error: any) {
    console.error('List buckets error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to list buckets'
    }, { status: 500 })
  }
}