import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const adminKeys = {
  sellers: ['admin', 'sellers'] as const,
  customers: ['admin', 'customers'] as const,
  trips: ['admin', 'trips'] as const,
}

// Sellers management
export function useSellers() {
  return useQuery({
    queryKey: adminKeys.sellers,
    queryFn: async () => {
      const response = await fetch('/api/admin/sellers')
      if (!response.ok) throw new Error('Failed to fetch sellers')
      return response.json()
    },
  })
}

export function useUpdateSellerStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sellerId,
      status,
    }: {
      sellerId: string
      status: string
    }) => {
      const response = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update seller status')
      return response.json()
    },
    // OPTIMISTIC UPDATE: UI changes instantly before API response
    onMutate: async ({ sellerId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminKeys.sellers })

      // Snapshot the previous value
      const previousSellers = queryClient.getQueryData(adminKeys.sellers)

      // Optimistically update to the new value
      queryClient.setQueryData(adminKeys.sellers, (old: any) => {
        if (!old) return old

        // Handle different response structures
        if (old.sellers && Array.isArray(old.sellers)) {
          return {
            ...old,
            sellers: old.sellers.map((seller: any) =>
              seller.id === sellerId ? { ...seller, status } : seller
            ),
          }
        }

        // If it's just an array
        if (Array.isArray(old)) {
          return old.map((seller: any) =>
            seller.id === sellerId ? { ...seller, status } : seller
          )
        }

        return old
      })

      // Return context object with the snapshotted value
      return { previousSellers }
    },
    // If the mutation fails, rollback to the previous value
    onError: (err, variables, context) => {
      if (context?.previousSellers) {
        queryClient.setQueryData(adminKeys.sellers, context.previousSellers)
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.sellers })
    },
  })
}

// Customers management
export function useCustomers() {
  return useQuery({
    queryKey: adminKeys.customers,
    queryFn: async () => {
      const response = await fetch('/api/admin/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      return response.json()
    },
  })
}

// Admin trips management
export function useAdminTrips() {
  return useQuery({
    queryKey: adminKeys.trips,
    queryFn: async () => {
      const response = await fetch('/api/admin/trips')
      if (!response.ok) throw new Error('Failed to fetch trips')
      return response.json()
    },
  })
}

export function useUpdateTripStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tripId,
      status,
    }: {
      tripId: string
      status: string
    }) => {
      const response = await fetch(`/api/admin/trips/${tripId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update trip status')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.trips })
    },
  })
}
