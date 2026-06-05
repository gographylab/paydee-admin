import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters?: any) => [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  stats: () => [...bookingKeys.all, 'stats'] as const,
}

export interface BookingsFilters {
  status?: string
  sellerId?: string
  tripId?: string
  searchTerm?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

// Fetch bookings with filters and pagination
export function useBookings(filters?: BookingsFilters) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.status) params.append('status', filters.status)
      if (filters?.sellerId) params.append('sellerId', filters.sellerId)
      if (filters?.tripId) params.append('tripId', filters.tripId)
      if (filters?.searchTerm) params.append('search', filters.searchTerm)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())

      const response = await fetch(`/api/admin/bookings?${params}`)
      if (!response.ok) throw new Error('Failed to fetch bookings')
      return response.json()
    },
  })
}

// Infinite scroll bookings (for load more functionality)
export function useInfiniteBookings(filters?: Omit<BookingsFilters, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...bookingKeys.lists(), 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()

      if (filters?.status) params.append('status', filters.status)
      if (filters?.sellerId) params.append('sellerId', filters.sellerId)
      if (filters?.tripId) params.append('tripId', filters.tripId)
      if (filters?.searchTerm) params.append('search', filters.searchTerm)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      params.append('page', pageParam.toString())
      params.append('pageSize', filters?.pageSize?.toString() || '20')

      const response = await fetch(`/api/admin/bookings?${params}`)
      if (!response.ok) throw new Error('Failed to fetch bookings')
      return response.json()
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.hasMore) {
        return pages.length + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })
}

// Get booking stats
export function useBookingStats() {
  return useQuery({
    queryKey: bookingKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/admin/bookings/stats')
      if (!response.ok) throw new Error('Failed to fetch booking stats')
      return response.json()
    },
    staleTime: 60000, // 1 minute
  })
}

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: async () => {
      const response = await fetch(`/api/admin/bookings/${bookingId}`)
      if (!response.ok) throw new Error('Failed to fetch booking')
      return response.json()
    },
    enabled: !!bookingId,
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update booking')
      return response.json()
    },
    // Optimistic update
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: bookingKeys.lists() })
      await queryClient.cancelQueries({ queryKey: bookingKeys.detail(id) })

      // Snapshot the previous values
      const previousBookingsQueries = queryClient.getQueriesData({ queryKey: bookingKeys.lists() })
      const previousBooking = queryClient.getQueryData(bookingKeys.detail(id))

      // Optimistically update to the new value for all booking lists
      queryClient.setQueriesData({ queryKey: bookingKeys.lists() }, (old: any) => {
        if (!old) return old

        // Handle different response structures
        if (old.bookings && Array.isArray(old.bookings)) {
          return {
            ...old,
            bookings: old.bookings.map((booking: any) =>
              booking.id === id ? { ...booking, status } : booking
            ),
          }
        }

        if (old.pages) {
          // Infinite query structure
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              bookings: page.bookings?.map((booking: any) =>
                booking.id === id ? { ...booking, status } : booking
              ),
            })),
          }
        }

        return old
      })

      // Optimistically update the single booking
      queryClient.setQueryData(bookingKeys.detail(id), (old: any) => {
        if (!old) return old
        return { ...old, status }
      })

      // Return context with the snapshotted values
      return { previousBookingsQueries, previousBooking }
    },
    // If the mutation fails, rollback to the previous values
    onError: (err, variables, context) => {
      if (context?.previousBookingsQueries) {
        context.previousBookingsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      if (context?.previousBooking) {
        queryClient.setQueryData(bookingKeys.detail(variables.id), context.previousBooking)
      }
    },
    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.stats() })
    },
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (booking: any) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      })
      if (!response.ok) throw new Error('Failed to create booking')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
  })
}
