import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, TripFormData, Country } from '@/types/admin'
import { toast } from 'sonner'

export interface UseAdminTripsResult {
  trips: Trip[]
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  totalPages: number
  pageSize: number
  setCurrentPage: (page: number) => void
  createTrip: (tripData: TripFormData) => Promise<Trip>
  updateTrip: (id: string, tripData: TripFormData) => Promise<Trip>
  deleteTrip: (id: string) => Promise<void>
  toggleTripStatus: (id: string, isActive: boolean) => Promise<void>
  refreshTrips: () => Promise<void>
}

export function useAdminTrips(pageSize: number = 10): UseAdminTripsResult {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const supabase = createClient()

  const fetchTrips = async (page: number = 1, search: string = '', forceRefresh: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search })
      })

      const response = await fetch(`/api/admin/trips?${params}`, {
        // Use cache unless we force refresh (e.g., after updates)
        ...(forceRefresh ? {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        } : {
          next: { revalidate: 30 },
          headers: {
            'Content-Type': 'application/json'
          }
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch trips')
      }

      const data = await response.json()
      
      setTrips(data.trips)
      setTotalCount(data.totalCount)
      setCurrentPage(data.currentPage)
      setTotalPages(data.totalPages)

    } catch (err: any) {
      setError(err.message)
      console.error('Fetch trips error:', err)
    } finally {
      setLoading(false)
    }
  }

  const createTrip = async (tripData: TripFormData): Promise<Trip> => {
    try {
      setError(null)

      const response = await fetch('/api/admin/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create trip')
      }

      const data = await response.json()
      
      // Refresh trips list
      await fetchTrips(currentPage)
      
      toast.success('สร้างทริปสำเร็จ')
      return data.trip

    } catch (err: any) {
      setError(err.message)
      toast.error(`เกิดข้อผิดพลาดในการสร้างทริป: ${err.message}`)
      throw err
    }
  }

  const updateTrip = async (id: string, tripData: TripFormData): Promise<Trip> => {
    try {
      setError(null)

      const response = await fetch(`/api/admin/trips/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update trip')
      }

      const data = await response.json()
      
      // Refresh trips list
      await fetchTrips(currentPage)
      
      toast.success('อัพเดททริปสำเร็จ')
      return data.trip

    } catch (err: any) {
      setError(err.message)
      toast.error(`เกิดข้อผิดพลาดในการอัพเดททริป: ${err.message}`)
      throw err
    }
  }

  const deleteTrip = async (id: string): Promise<void> => {
    try {
      setError(null)

      // Optimistic update - remove from local state immediately
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== id))

      const response = await fetch(`/api/admin/trips/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // If delete failed, restore the trip to local state
        await fetchTrips(currentPage, '', true)
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete trip')
      }

      // Refresh trips list immediately after successful delete
      await fetchTrips(currentPage, '', true)

      toast.success('ลบทริปสำเร็จ')

    } catch (err: any) {
      setError(err.message)
      toast.error(`เกิดข้อผิดพลาดในการลบทริป: ${err.message}`)
      throw err
    }
  }

  const toggleTripStatus = async (id: string, isActive: boolean): Promise<void> => {
    try {
      setError(null)

      // Use Supabase client directly for simple toggle
      const { error } = await supabase
        .from('trips')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error

      // Update local state immediately for better UX
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip.id === id ? { ...trip, is_active: isActive } : trip
        )
      )
      
      // Also refresh from server to ensure consistency
      setTimeout(() => {
        fetchTrips(currentPage, '', true) // Force refresh after toggle
      }, 100)
      
      toast.success(`${isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}ทริปสำเร็จ`)

    } catch (err: any) {
      setError(err.message)
      toast.error(`เกิดข้อผิดพลาดในการอัพเดทสถานะทริป: ${err.message}`)
      throw err
    }
  }

  const refreshTrips = async (): Promise<void> => {
    await fetchTrips(currentPage, '', true) // Force refresh
  }

  // Fetch trips on component mount and when page changes
  useEffect(() => {
    fetchTrips(currentPage)
  }, [currentPage])

  return {
    trips,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    createTrip,
    updateTrip,
    deleteTrip,
    toggleTripStatus,
    refreshTrips
  }
}

// Hook for fetching countries
export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCountries = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/countries')
      
      if (!response.ok) {
        throw new Error('Failed to fetch countries')
      }

      const data = await response.json()
      setCountries(data.countries || [])

    } catch (err: any) {
      setError(err.message)
      console.error('Fetch countries error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCountries()
  }, [])

  return { countries, loading, error, fetchCountries }
}
