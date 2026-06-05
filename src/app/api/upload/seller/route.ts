import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const sellerId = formData.get('sellerId') as string
    const category = formData.get('category') as string // 'id-card' | 'documents' | 'profile'
    const fileName = formData.get('fileName') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      )
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    // Check user permissions - only allow users to upload to their own folder
    if (sellerId !== user.id) {
      // Only admin can upload for other users
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!profile || profile.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only upload files to your own account' },
          { status: 403 }
        )
      }
    }

    // Validate file based on category
    const fileType = category === 'documents' ? 'PDF' : 'IMAGE'
    
    if (fileType === 'IMAGE') {
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'Image file size must be less than 5MB' },
          { status: 400 }
        )
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Only JPEG, PNG, and WebP images are allowed' },
          { status: 400 }
        )
      }
    } else if (fileType === 'PDF') {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'PDF file size must be less than 10MB' },
          { status: 400 }
        )
      }

      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Only PDF files are allowed for documents' },
          { status: 400 }
        )
      }
    }

    // Generate file name if not provided
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const finalFileName = fileName || `${category}-${timestamp}.${fileExtension}`
    
    // Create path: seller-assets/{sellerId}/{category}/{fileName}
    const filePath = `${sellerId}/${category}/${finalFileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to storage using admin client (bypasses RLS)
    const adminClient = createAdminClient()
    const { data, error: uploadError } = await adminClient.storage
      .from('seller-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('seller-assets')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      path: filePath,
      url: urlData.publicUrl,
      fileName: finalFileName
    })

  } catch (error: any) {
    console.error('Seller file upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('filePath')

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    // Delete from storage using admin client (bypasses RLS)
    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient.storage
      .from('seller-assets')
      .remove([filePath])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error: any) {
    console.error('Seller file delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    )
  }
}
