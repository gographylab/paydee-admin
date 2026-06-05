import { createClient } from '@/lib/supabase/client'

// File types และ sizes
export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  PDF: ['application/pdf']
}

export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  PDF: 10 * 1024 * 1024   // 10MB
}

// Helper สำหรับ validate file
export const validateFile = (file: File, type: 'IMAGE' | 'PDF') => {
  const allowedTypes = FILE_TYPES[type]
  const maxSize = MAX_FILE_SIZES[type]

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`กรุณาเลือกไฟล์ ${type === 'IMAGE' ? 'รูปภาพ (JPG, PNG, WebP)' : 'PDF'} เท่านั้น`)
  }

  if (file.size > maxSize) {
    const sizeMB = maxSize / (1024 * 1024)
    throw new Error(`ไฟล์ต้องมีขนาดไม่เกิน ${sizeMB}MB`)
  }
}

// Upload ไฟล์ไปยัง Supabase Storage ผ่าน API route
export const uploadSellerFile = async (
  file: File,
  sellerId: string,
  category: 'id-card' | 'documents' | 'profile',
  fileName?: string
) => {
  // Validate file based on category
  const fileType = category === 'documents' ? 'PDF' : 'IMAGE'
  validateFile(file, fileType)

  // Upload via API route
  const formData = new FormData()
  formData.append('file', file)
  formData.append('sellerId', sellerId)
  formData.append('category', category)
  if (fileName) {
    formData.append('fileName', fileName)
  }

  const response = await fetch('/api/upload/seller', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to upload file')
  }

  const data = await response.json()
  return {
    path: data.path,
    url: data.url,
    fileName: data.fileName
  }
}

// ลบไฟล์จาก Storage ผ่าน API route
export const deleteSellerFile = async (filePath: string) => {
  const response = await fetch(`/api/upload/seller?filePath=${encodeURIComponent(filePath)}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete file')
  }
}

// Get file URL (สำหรับ preview) - ใช้ direct URL pattern
export const getSellerFileUrl = (filePath: string) => {
  // สร้าง URL pattern โดยตรง (ต้องปรับตาม Supabase project)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/seller-assets/${filePath}`
}

// Update seller profile with file URLs ผ่าน API
export const updateSellerFiles = async (
  sellerId: string,
  updates: {
    id_card_url?: string
    avatar_url?: string  
    document_url?: string
    documents_urls?: string[]
    id_card_uploaded_at?: string
    avatar_uploaded_at?: string
    document_uploaded_at?: string
  }
) => {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', sellerId)

  if (error) {
    console.error('Update profile error:', error)
    throw new Error(`เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ${error.message}`)
  }
}
