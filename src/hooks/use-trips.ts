import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Query Keys
export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters?: any) => [...tripKeys.lists(), filters] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: string) => [...tripKeys.details(), id] as const,
}

interface TripsFilters {
  page?: number
  pageSize?: number
  filter?: string
  countries?: string[]
  partners?: string[]
}

// Fetch trips with pagination and filters
export function useTrips(filters?: TripsFilters) {
  return useQuery({
    queryKey: tripKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())
      if (filters?.filter) params.append('filter', filters.filter)
      if (filters?.countries && filters.countries.length > 0) {
        params.append('countries', filters.countries.join(','))
      }
      if (filters?.partners && filters.partners.length > 0) {
        params.append('partners', filters.partners.join(','))
      }

      const response = await fetch(`/api/trips?${params}`)
      if (!response.ok) throw new Error('Failed to fetch trips')
      return response.json()
    },
  })
}

// Fetch single trip
export function useTrip(tripId: string) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: async () => {
      const response = await fetch(`/api/trips/${tripId}`)
      if (!response.ok) throw new Error('Failed to fetch trip')
      return response.json()
    },
    enabled: !!tripId,
  })
}

// Create trip mutation
export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (trip: any) => {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      })
      if (!response.ok) throw new Error('Failed to create trip')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch trips list
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() })
    },
  })
}

// Update trip mutation
export function useUpdateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...trip }: any & { id: string }) => {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      })
      if (!response.ok) throw new Error('Failed to update trip')
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate specific trip and list
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() })
    },
  })
}

// Delete trip mutation
export function useDeleteTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tripId: string) => {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete trip')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() })
    },
  })
}
