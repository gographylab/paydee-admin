import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  DashboardStatsResponse,
  MonthlySalesResponse,
  RankingResponse,
  TopTripsResponse,
  SoldTripsResponse,
  PeriodFilter,
  ChartPeriod,
  CommissionStatusFilter
} from '@/types/dashboard'

export const sellerDashboardKeys = {
  all: ['seller-dashboard'] as const,
  stats: (period: PeriodFilter) => [...sellerDashboardKeys.all, 'stats', period] as const,
  monthlySales: (months: ChartPeriod) => [...sellerDashboardKeys.all, 'monthly-sales', months] as const,
  ranking: (period: PeriodFilter) => [...sellerDashboardKeys.all, 'ranking', period] as const,
  topTrips: (period: PeriodFilter) => [...sellerDashboardKeys.all, 'top-trips', period] as const,
  soldTrips: (period: PeriodFilter, commissionStatus: CommissionStatusFilter, page: number) =>
    [...sellerDashboardKeys.all, 'sold-trips', period, commissionStatus, page] as const,
}

/**
 * Fetch dashboard stats (total sales, trips count, commission, etc.)
 */
export function useSellerDashboardStats(period: PeriodFilter = 'all') {
  return useQuery({
    queryKey: sellerDashboardKeys.stats(period),
    queryFn: async (): Promise<DashboardStatsResponse> => {
      const res = await fetch(`/api/seller/dashboard/stats?period=${period}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch dashboard stats')
      }
      return res.json()
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Fetch monthly sales data for chart
 */
export function useMonthlySales(months: ChartPeriod = 6) {
  return useQuery({
    queryKey: sellerDashboardKeys.monthlySales(months),
    queryFn: async (): Promise<MonthlySalesResponse> => {
      const res = await fetch(`/api/seller/dashboard/monthly-sales?months=${months}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch monthly sales')
      }
      return res.json()
    },
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: true,
  })
}

/**
 * Fetch seller ranking among all sellers
 */
export function useSellerRanking(period: PeriodFilter = 'all') {
  return useQuery({
    queryKey: sellerDashboardKeys.ranking(period),
    queryFn: async (): Promise<RankingResponse> => {
      const res = await fetch(`/api/seller/dashboard/ranking?period=${period}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch ranking')
      }
      return res.json()
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
  })
}

/**
 * Fetch top selling trips
 */
export function useTopSellingTrips(period: PeriodFilter = 'all', limit: number = 3) {
  return useQuery({
    queryKey: sellerDashboardKeys.topTrips(period),
    queryFn: async (): Promise<TopTripsResponse> => {
      const res = await fetch(`/api/seller/dashboard/top-trips?period=${period}&limit=${limit}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch top trips')
      }
      return res.json()
    },
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: true,
  })
}

/**
 * Fetch sold trips table data with pagination
 */
export function useSoldTrips(
  period: PeriodFilter = 'all',
  commissionStatus: CommissionStatusFilter = 'all',
  page: number = 1,
  pageSize: number = 10
) {
  return useQuery({
    queryKey: sellerDashboardKeys.soldTrips(period, commissionStatus, page),
    queryFn: async (): Promise<SoldTripsResponse> => {
      const params = new URLSearchParams({
        period,
        commissionStatus,
        page: page.toString(),
        pageSize: pageSize.toString()
      })
      const res = await fetch(`/api/seller/dashboard/sold-trips?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch sold trips')
      }
      return res.json()
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Update commission goal mutation
 */
export function useUpdateCommissionGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (goal: number) => {
      const res = await fetch('/api/seller/dashboard/stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission_goal: goal })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update commission goal')
      }
      return res.json()
    },
    onSuccess: () => {
      // Invalidate all dashboard stats to refetch
      queryClient.invalidateQueries({ queryKey: sellerDashboardKeys.all })
    }
  })
}

/**
 * Hook for fetching all dashboard data in parallel
 */
export function useSellerDashboard(period: PeriodFilter = 'all', chartMonths: ChartPeriod = 6) {
  const stats = useSellerDashboardStats(period)
  const monthlySales = useMonthlySales(chartMonths)
  const ranking = useSellerRanking(period)
  const topTrips = useTopSellingTrips(period)

  return {
    stats: stats.data,
    monthlySales: monthlySales.data,
    ranking: ranking.data,
    topTrips: topTrips.data,
    isLoading: stats.isLoading || monthlySales.isLoading || ranking.isLoading || topTrips.isLoading,
    isError: stats.isError || monthlySales.isError || ranking.isError || topTrips.isError,
    isFetching: stats.isFetching || monthlySales.isFetching || ranking.isFetching || topTrips.isFetching,
    errors: [stats.error, monthlySales.error, ranking.error, topTrips.error].filter(Boolean),
    refetch: () => {
      stats.refetch()
      monthlySales.refetch()
      ranking.refetch()
      topTrips.refetch()
    }
  }
}
