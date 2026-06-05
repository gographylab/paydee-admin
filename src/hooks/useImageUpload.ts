import { useState } from 'react'

interface UseImageUploadResult {
  uploading: boolean
  error: string | null
  uploadImage: (file: File, tripId: string) => Promise<string>
  deleteImage: (url: string) => Promise<void>
}

export function useImageUpload(): UseImageUploadResult {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = async (file: File, tripId: string): Promise<string> => {
    try {
      setUploading(true)
      setError(null)

      // Validate file
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB')
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed')
      }

      // Upload via API route
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tripId', tripId)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      return data.url

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload image'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (url: string): Promise<void> => {
    try {
      setError(null)

      // Delete via API route
      const response = await fetch(`/api/upload/image?url=${encodeURIComponent(url)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete image')
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete image'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    uploading,
    error,
    uploadImage,
    deleteImage
  }
}
