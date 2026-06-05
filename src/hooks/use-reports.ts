import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const reportKeys = {
  all: ['reports'] as const,
  seller: (sellerId: string, dateRange?: { start: string; end: string }) =>
    [...reportKeys.all, 'seller', sellerId, dateRange] as const,
  commission: (sellerId: string) => [...reportKeys.all, 'commission', sellerId] as const,
  bookings: (sellerId: string, filters?: any) =>
    [...reportKeys.all, 'bookings', sellerId, filters] as const,
  earnings: (sellerId: string, period?: string) =>
    [...reportKeys.all, 'earnings', sellerId, period] as const,
  summary: (sellerId: string) => [...reportKeys.all, 'summary', sellerId] as const,
}

interface ReportFilters {
  startDate?: string
  endDate?: string
  tripId?: string
  status?: string
}

/**
 * Get seller report with optional date range filtering
 * Cached for 5 minutes since reports don't need real-time updates
 */
export function useSellerReport(sellerId: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: reportKeys.seller(sellerId, dateRange),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange) {
        params.append('start', dateRange.start)
        params.append('end', dateRange.end)
      }
      const res = await fetch(`/api/reports/seller/${sellerId}?${params}`)
      if (!res.ok) throw new Error('Failed to fetch report')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: !!sellerId,
  })
}

/**
 * Get commission summary for a seller
 * Auto-refreshes every 2 minutes
 */
export function useCommissionSummary(sellerId: string) {
  return useQuery({
    queryKey: reportKeys.commission(sellerId),
    queryFn: async () => {
      const res = await fetch(`/api/reports/commission/${sellerId}`)
      if (!res.ok) throw new Error('Failed to fetch commission')
      return res.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refresh
    refetchOnWindowFocus: true,
    enabled: !!sellerId,
  })
}

/**
 * Get seller's bookings with filters
 */
export function useSellerBookings(sellerId: string, filters?: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.bookings(sellerId, filters),
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.tripId) params.append('tripId', filters.tripId)
      if (filters?.status) params.append('status', filters.status)

      const res = await fetch(`/api/reports/seller/${sellerId}/bookings?${params}`)
      if (!res.ok) throw new Error('Failed to fetch bookings')
      return res.json()
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!sellerId,
  })
}

/**
 * Get earnings breakdown by period (daily, weekly, monthly)
 */
export function useEarningsBreakdown(sellerId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
  return useQuery({
    queryKey: reportKeys.earnings(sellerId, period),
    queryFn: async () => {
      const res = await fetch(`/api/reports/seller/${sellerId}/earnings?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch earnings')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!sellerId,
  })
}

/**
 * Get comprehensive seller summary
 * Includes bookings count, commission earned, pending payments, etc.
 */
export function useSellerSummary(sellerId: string) {
  return useQuery({
    queryKey: reportKeys.summary(sellerId),
    queryFn: async () => {
      const res = await fetch(`/api/reports/seller/${sellerId}/summary`)
      if (!res.ok) throw new Error('Failed to fetch summary')
      return res.json()
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true,
    enabled: !!sellerId,
  })
}

/**
 * Export report to PDF/Excel
 * Returns download URL
 */
export function useExportReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sellerId,
      format,
      dateRange,
    }: {
      sellerId: string
      format: 'pdf' | 'excel'
      dateRange?: { start: string; end: string }
    }) => {
      const params = new URLSearchParams()
      params.append('format', format)
      if (dateRange) {
        params.append('start', dateRange.start)
        params.append('end', dateRange.end)
      }

      const res = await fetch(`/api/reports/seller/${sellerId}/export?${params}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to export report')
      return res.json()
    },
  })
}

/**
 * Prefetch reports for better UX
 * Call this when user is about to view reports page
 */
export function usePrefetchReports(sellerId: string) {
  const queryClient = useQueryClient()

  const prefetchAllReports = () => {
    // Prefetch summary
    queryClient.prefetchQuery({
      queryKey: reportKeys.summary(sellerId),
      queryFn: async () => {
        const res = await fetch(`/api/reports/seller/${sellerId}/summary`)
        return res.json()
      },
    })

    // Prefetch commission
    queryClient.prefetchQuery({
      queryKey: reportKeys.commission(sellerId),
      queryFn: async () => {
        const res = await fetch(`/api/reports/commission/${sellerId}`)
        return res.json()
      },
    })

    // Prefetch bookings
    queryClient.prefetchQuery({
      queryKey: reportKeys.bookings(sellerId),
      queryFn: async () => {
        const res = await fetch(`/api/reports/seller/${sellerId}/bookings`)
        return res.json()
      },
    })
  }

  return { prefetchAllReports }
}
