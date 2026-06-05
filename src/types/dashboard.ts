// Seller Dashboard Types

export interface DashboardStats {
  totalSales: number
  tripsCount: number
  totalCommission: number
  pendingCommission: number
}

export interface SellerRanking {
  rank: number
  totalSellers: number
  totalSales: number
  nextRankThreshold: number | null
  progressToNextRank: number
}

export interface MonthlySalesData {
  month: string
  monthLabel: string
  sales: number
  commission: number
}

export interface TopSellingTrip {
  tripId: string
  tripTitle: string
  coverImageUrl: string | null
  bookingsCount: number
  totalAmount: number
  commission: number
}

export interface SoldTrip {
  bookingId: string
  tripId: string
  tripTitle: string
  coverImageUrl: string | null
  departureDate: string
  returnDate: string
  customerCount: number
  totalAmount: number
  commissionAmount: number
  commissionStatus: 'pending' | 'paid'
  createdAt: string
}

export interface CommissionGoal {
  current: number
  goal: number
  progress: number
}

// API Response Types
export interface DashboardStatsResponse {
  stats: DashboardStats
  commissionGoal: CommissionGoal
}

export interface MonthlySalesResponse {
  data: MonthlySalesData[]
}

export interface RankingResponse {
  ranking: SellerRanking
}

export interface TopTripsResponse {
  trips: TopSellingTrip[]
}

export interface SoldTripsResponse {
  trips: SoldTrip[]
  totalCount: number
  currentPage: number
  totalPages: number
}

// Period Filter Types
export type PeriodFilter = 'all' | 'week' | 'month'

export type ChartPeriod = 3 | 6 | 12

export type CommissionStatusFilter = 'all' | 'paid' | 'pending'

// Thai month names for chart labels
export const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
] as const

export const PERIOD_LABELS: Record<PeriodFilter, string> = {
  all: 'ทั้งหมด',
  week: 'สัปดาห์นี้',
  month: 'เดือนนี้'
}

export const CHART_PERIOD_LABELS: Record<ChartPeriod, string> = {
  3: '3 เดือน',
  6: '6 เดือน',
  12: '12 เดือน'
}
