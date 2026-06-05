import { useState, useEffect } from 'react'
import { Partner, PartnerFormData, PartnerWithStats } from '@/types/admin'
import { toast } from 'sonner'

interface UsePartnersResult {
  partners: Partner[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  fetchPartners: (page?: number, filters?: { status?: string; search?: string }) => Promise<void>
  createPartner: (data: PartnerFormData) => Promise<Partner>
  updatePartner: (id: string, data: PartnerFormData) => Promise<Partner>
  deletePartner: (id: string) => Promise<void>
  getPartnerById: (id: string) => Promise<Partner>
  getPartnerStats: (id: string) => Promise<Omit<PartnerWithStats, keyof Partner>>
}

export function usePartners(): UsePartnersResult {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })

  const fetchPartners = async (
    page: number = 1,
    filters?: { status?: string; search?: string }
  ) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString()
      })

      if (filters?.status) {
        params.append('status', filters.status)
      }

      if (filters?.search) {
        params.append('search', filters.search)
      }

      const response = await fetch(`/api/admin/partners?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch partners')
      }

      const data = await response.json()
      setPartners(data.partners || [])
      setPagination(data.pagination)

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch partners'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createPartner = async (data: PartnerFormData): Promise<Partner> => {
    try {
      setError(null)

      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create partner')
      }

      const result = await response.json()
      toast.success('Partner created successfully')

      // Refresh the list
      await fetchPartners(pagination.page)

      return result.partner

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create partner'
      setError(errorMessage)
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updatePartner = async (id: string, data: PartnerFormData): Promise<Partner> => {
    try {
      setError(null)

      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update partner')
      }

      const result = await response.json()
      toast.success('Partner updated successfully')

      // Refresh the list
      await fetchPartners(pagination.page)

      return result.partner

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update partner'
      setError(errorMessage)
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deletePartner = async (id: string): Promise<void> => {
    try {
      setError(null)

      // Optimistic update - remove immediately
      const previousPartners = partners
      setPartners(prev => prev.filter(p => p.id !== id))

      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Revert optimistic update on error
        setPartners(previousPartners)
        throw new Error(errorData.error || 'Failed to delete partner')
      }

      toast.success('Partner deleted successfully')
      // Don't refetch - rely on optimistic update

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete partner'
      setError(errorMessage)
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getPartnerById = async (id: string): Promise<Partner> => {
    try {
      setError(null)

      const response = await fetch(`/api/admin/partners/${id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch partner')
      }

      const data = await response.json()
      return data.partner

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch partner'
      setError(errorMessage)
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getPartnerStats = async (id: string): Promise<any> => {
    try {
      setError(null)

      const response = await fetch(`/api/admin/partners/${id}/stats`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch partner statistics')
      }

      const data = await response.json()
      return data.stats

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch partner statistics'
      setError(errorMessage)
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    partners,
    loading,
    error,
    pagination,
    fetchPartners,
    createPartner,
    updatePartner,
    deletePartner,
    getPartnerById,
    getPartnerStats
  }
}

// Hook for uploading partner logos
interface UsePartnerLogoUploadResult {
  uploading: boolean
  error: string | null
  uploadLogo: (file: File, partnerId?: string) => Promise<string>
  deleteLogo: (url: string) => Promise<void>
}

export function usePartnerLogoUpload(): UsePartnerLogoUploadResult {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadLogo = async (file: File, partnerId?: string): Promise<string> => {
    try {
      setUploading(true)
      setError(null)

      // Validate file - 5MB max for partner logo
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
      if (partnerId) {
        formData.append('partnerId', partnerId)
      }

      const response = await fetch('/api/upload/partner-logo', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload partner logo')
      }

      const data = await response.json()
      return data.url

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload partner logo'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const deleteLogo = async (url: string): Promise<void> => {
    try {
      setError(null)

      const response = await fetch(`/api/upload/partner-logo?url=${encodeURIComponent(url)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete partner logo')
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete partner logo'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    uploading,
    error,
    uploadLogo,
    deleteLogo
  }
}

// Simple hook for fetching active partners (for dropdown)
export function useActivePartners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const response = await fetch('/api/admin/partners?status=active&pageSize=100')
        if (response.ok) {
          const data = await response.json()
          setPartners(data.partners || [])
        }
      } catch (error) {
        console.error('Failed to fetch active partners:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActive()
  }, [])

  return { partners, loading }
}
