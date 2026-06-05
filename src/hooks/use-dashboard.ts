import { useQueries, useQuery } from '@tanstack/react-query'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  bookingsStats: () => [...dashboardKeys.stats(), 'bookings'] as const,
  revenueStats: () => [...dashboardKeys.stats(), 'revenue'] as const,
  sellersStats: () => [...dashboardKeys.stats(), 'sellers'] as const,
  tripsStats: () => [...dashboardKeys.stats(), 'trips'] as const,
  coinStats: () => [...dashboardKeys.stats(), 'coins'] as const,
}

/**
 * Hook for fetching all dashboard stats in parallel
 * This significantly improves performance by loading all widgets simultaneously
 */
export function useDashboardData() {
  const results = useQueries({
    queries: [
      {
        queryKey: dashboardKeys.bookingsStats(),
        queryFn: async () => {
          const res = await fetch('/api/admin/bookings/stats')
          if (!res.ok) throw new Error('Failed to fetch bookings stats')
          return res.json()
        },
        staleTime: 60000, // 1 minute
        refetchOnWindowFocus: true,
      },
      {
        queryKey: dashboardKeys.revenueStats(),
        queryFn: async () => {
          const res = await fetch('/api/admin/revenue/stats')
          if (!res.ok) throw new Error('Failed to fetch revenue stats')
          return res.json()
        },
        staleTime: 60000,
        refetchOnWindowFocus: true,
      },
      {
        queryKey: dashboardKeys.sellersStats(),
        queryFn: async () => {
          const res = await fetch('/api/admin/sellers/stats')
          if (!res.ok) throw new Error('Failed to fetch sellers stats')
          return res.json()
        },
        staleTime: 60000,
        refetchOnWindowFocus: true,
      },
      {
        queryKey: dashboardKeys.tripsStats(),
        queryFn: async () => {
          const res = await fetch('/api/admin/trips/stats')
          if (!res.ok) throw new Error('Failed to fetch trips stats')
          return res.json()
        },
        staleTime: 60000,
        refetchOnWindowFocus: true,
      },
    ],
  })

  return {
    bookingsStats: results[0].data,
    revenueStats: results[1].data,
    sellersStats: results[2].data,
    tripsStats: results[3].data,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    isFetching: results.some((r) => r.isFetching),
    errors: results.map((r) => r.error).filter(Boolean),
  }
}

/**
 * Hook for auto-refreshing dashboard stats
 * Use this for real-time dashboard updates
 */
export function useLiveDashboardStats(refreshInterval = 30000) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'live'],
    queryFn: async () => {
      const [bookings, revenue, sellers, trips] = await Promise.all([
        fetch('/api/admin/bookings/stats').then((r) => r.json()),
        fetch('/api/admin/revenue/stats').then((r) => r.json()),
        fetch('/api/admin/sellers/stats').then((r) => r.json()),
        fetch('/api/admin/trips/stats').then((r) => r.json()),
      ])

      return { bookings, revenue, sellers, trips }
    },
    staleTime: refreshInterval,
    refetchInterval: refreshInterval, // Auto-refresh
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook for individual stat queries (if needed)
 */
export function useBookingsStats() {
  return useQuery({
    queryKey: dashboardKeys.bookingsStats(),
    queryFn: async () => {
      const res = await fetch('/api/admin/bookings/stats')
      if (!res.ok) throw new Error('Failed to fetch bookings stats')
      return res.json()
    },
    staleTime: 60000,
  })
}

export function useRevenueStats() {
  return useQuery({
    queryKey: dashboardKeys.revenueStats(),
    queryFn: async () => {
      const res = await fetch('/api/admin/revenue/stats')
      if (!res.ok) throw new Error('Failed to fetch revenue stats')
      return res.json()
    },
    staleTime: 60000,
  })
}

export function useSellersStats() {
  return useQuery({
    queryKey: dashboardKeys.sellersStats(),
    queryFn: async () => {
      const res = await fetch('/api/admin/sellers/stats')
      if (!res.ok) throw new Error('Failed to fetch sellers stats')
      return res.json()
    },
    staleTime: 60000,
  })
}

export function useTripsStats() {
  return useQuery({
    queryKey: dashboardKeys.tripsStats(),
    queryFn: async () => {
      const res = await fetch('/api/admin/trips/stats')
      if (!res.ok) throw new Error('Failed to fetch trips stats')
      return res.json()
    },
    staleTime: 60000,
  })
}
