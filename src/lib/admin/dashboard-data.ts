import { createClient } from '@/lib/supabase/server'
import { percentChange } from '@/lib/format'

// ---------- Types ----------

export interface KpiMetric {
  current: number
  previous: number
  /** % change vs previous period, null when no baseline */
  change: number | null
}

export interface DailyPoint {
  /** YYYY-MM-DD */
  date: string
  /** short Thai label e.g. "5 มิ.ย." */
  label: string
  revenue: number
  bookings: number
}

export interface StatusSlice {
  status: string
  label: string
  value: number
  color: string
}

export interface TopSeller {
  id: string
  name: string
  revenue: number
  bookings: number
  commission: number
}

export interface RecentBooking {
  id: string
  customerName: string
  amount: number
  status: string | null
  paymentStatus: string | null
  createdAt: string
}

export interface AdminDashboardData {
  revenue: KpiMetric
  commissionPaid: KpiMetric
  bookings: KpiMetric
  activeSellers: { total: number; newCurrent: number; newPrevious: number; change: number | null }
  pendingSellers: number
  outstanding: number
  coinLiability: number
  trips: { active: number; total: number }
  totalBookingsAllTime: number
  daily: DailyPoint[]
  statusBreakdown: StatusSlice[]
  topSellers: TopSeller[]
  recentBookings: RecentBooking[]
  pendingCommissions: { count: number; amount: number }
}

// ---------- Status presentation (mirrors StatusBadge) ----------

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'รอดำเนินการ', color: '#fe9813' },
  inprogress: { label: 'กำลังดำเนินการ', color: '#176daf' },
  approved: { label: 'ผ่านการยืนยัน', color: '#16a34a' },
  confirmed: { label: 'ยืนยันแล้ว', color: '#16a34a' },
  completed: { label: 'เสร็จสิ้น', color: '#0d9488' },
  rejected: { label: 'แอดมินยกเลิก', color: '#dc2626' },
  cancelled: { label: 'ลูกค้ายกเลิก', color: '#94a3b8' },
}

function statusMeta(status: string | null) {
  if (!status) return { label: 'ไม่ระบุ', color: '#cbd5e1' }
  return STATUS_META[status] ?? { label: status, color: '#cbd5e1' }
}

/** Bookings excluded from revenue / sales aggregations. */
const NON_REVENUE = new Set(['cancelled', 'rejected'])

// ---------- Helpers ----------

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function thaiDayLabel(d: Date): string {
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

type BookingRow = {
  id: string
  total_amount: number | null
  remaining_amount: number | null
  commission_amount: number | null
  status: string | null
  payment_status: string | null
  created_at: string
  seller_id: string | null
}

// ---------- Main loader ----------

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient()

  const now = new Date()
  const DAY = 24 * 60 * 60 * 1000
  const last30Start = new Date(now.getTime() - 30 * DAY)
  const prev30Start = new Date(now.getTime() - 60 * DAY)

  const [
    sellersRes,
    bookingsWindowRes,
    recentRes,
    commissionsRes,
    coinsRes,
    totalBookingsRes,
    totalTripsRes,
    activeTripsRes,
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, full_name, status, created_at')
      .eq('role', 'seller'),
    supabase
      .from('bookings')
      .select('id, total_amount, remaining_amount, commission_amount, status, payment_status, created_at, seller_id')
      .gte('created_at', prev30Start.toISOString()),
    supabase
      .from('bookings')
      .select('id, total_amount, status, payment_status, created_at, customers(full_name)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('commission_payments')
      .select('amount, status, paid_at, created_at'),
    supabase
      .from('seller_coins')
      .select('redeemable_balance, locked_balance'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('trips').select('*', { count: 'exact', head: true }),
    supabase.from('trips').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const sellers = sellersRes.data ?? []
  const bookingsWindow = (bookingsWindowRes.data ?? []) as BookingRow[]
  const commissions = commissionsRes.data ?? []
  const coins = coinsRes.data ?? []

  // ----- Seller name map + counts -----
  const sellerNameById = new Map<string, string>()
  let approvedSellers = 0
  let pendingSellers = 0
  let newSellersCurrent = 0
  let newSellersPrevious = 0
  for (const s of sellers) {
    sellerNameById.set(s.id, s.full_name || 'ไม่ทราบชื่อ')
    if (s.status === 'approved') approvedSellers++
    if (s.status === 'pending') pendingSellers++
    if (s.created_at) {
      const t = new Date(s.created_at).getTime()
      if (t >= last30Start.getTime()) newSellersCurrent++
      else if (t >= prev30Start.getTime()) newSellersPrevious++
    }
  }

  // ----- Booking-derived metrics (split current vs previous 30d window) -----
  let revCurrent = 0
  let revPrevious = 0
  let bookCurrent = 0
  let bookPrevious = 0
  let outstanding = 0

  const dailyMap = new Map<string, { revenue: number; bookings: number }>()
  // seed 30 days so the chart has a continuous x-axis
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY)
    dailyMap.set(dayKey(d), { revenue: 0, bookings: 0 })
  }

  const statusCount = new Map<string, number>()
  const sellerAgg = new Map<string, { revenue: number; bookings: number; commission: number }>()

  for (const b of bookingsWindow) {
    const created = new Date(b.created_at)
    const isCurrent = created.getTime() >= last30Start.getTime()
    const amount = Number(b.total_amount ?? 0)
    const isRevenue = !NON_REVENUE.has(b.status ?? '')

    if (isCurrent) {
      bookCurrent++
      if (isRevenue) revCurrent += amount
      // status donut counts the current window
      const sk = b.status ?? 'unknown'
      statusCount.set(sk, (statusCount.get(sk) ?? 0) + 1)
      // daily series
      const key = dayKey(created)
      const cell = dailyMap.get(key)
      if (cell) {
        cell.bookings++
        if (isRevenue) cell.revenue += amount
      }
      // outstanding (active, current window)
      if (isRevenue) outstanding += Number(b.remaining_amount ?? 0)
      // top sellers (current window)
      if (isRevenue && b.seller_id) {
        const agg = sellerAgg.get(b.seller_id) ?? { revenue: 0, bookings: 0, commission: 0 }
        agg.revenue += amount
        agg.bookings++
        agg.commission += Number(b.commission_amount ?? 0)
        sellerAgg.set(b.seller_id, agg)
      }
    } else {
      bookPrevious++
      if (isRevenue) revPrevious += amount
    }
  }

  const daily: DailyPoint[] = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date,
    label: thaiDayLabel(new Date(date)),
    revenue: Math.round(v.revenue),
    bookings: v.bookings,
  }))

  const statusBreakdown: StatusSlice[] = Array.from(statusCount.entries())
    .map(([status, value]) => ({ status, value, ...statusMeta(status) }))
    .sort((a, b) => b.value - a.value)

  const topSellers: TopSeller[] = Array.from(sellerAgg.entries())
    .map(([id, agg]) => ({
      id,
      name: sellerNameById.get(id) ?? 'ไม่ทราบชื่อ',
      revenue: Math.round(agg.revenue),
      bookings: agg.bookings,
      commission: Math.round(agg.commission),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // ----- Commission metrics -----
  let commCurrent = 0
  let commPrevious = 0
  let pendingCommCount = 0
  let pendingCommAmount = 0
  for (const c of commissions) {
    const amount = Number(c.amount ?? 0)
    const isPaid = c.status === 'paid'
    if (isPaid) {
      const when = new Date((c.paid_at as string) || c.created_at || now.toISOString())
      if (when.getTime() >= last30Start.getTime()) commCurrent += amount
      else if (when.getTime() >= prev30Start.getTime()) commPrevious += amount
    } else {
      pendingCommCount++
      pendingCommAmount += amount
    }
  }

  // ----- Coin liability -----
  const coinLiability = coins.reduce(
    (sum, c) => sum + Number(c.redeemable_balance ?? 0) + Number(c.locked_balance ?? 0),
    0,
  )

  // ----- Recent bookings -----
  const recentBookings: RecentBooking[] = (recentRes.data ?? []).map((r) => {
    const cust = r.customers as { full_name: string | null } | { full_name: string | null }[] | null
    const customerName = Array.isArray(cust)
      ? cust[0]?.full_name ?? 'ลูกค้า'
      : cust?.full_name ?? 'ลูกค้า'
    return {
      id: r.id,
      customerName,
      amount: Number(r.total_amount ?? 0),
      status: r.status,
      paymentStatus: r.payment_status,
      createdAt: r.created_at ?? new Date().toISOString(),
    }
  })

  return {
    revenue: { current: revCurrent, previous: revPrevious, change: percentChange(revCurrent, revPrevious) },
    commissionPaid: {
      current: commCurrent,
      previous: commPrevious,
      change: percentChange(commCurrent, commPrevious),
    },
    bookings: { current: bookCurrent, previous: bookPrevious, change: percentChange(bookCurrent, bookPrevious) },
    activeSellers: {
      total: approvedSellers,
      newCurrent: newSellersCurrent,
      newPrevious: newSellersPrevious,
      change: percentChange(newSellersCurrent, newSellersPrevious),
    },
    pendingSellers,
    outstanding: Math.round(outstanding),
    coinLiability: Math.round(coinLiability),
    trips: { active: activeTripsRes.count ?? 0, total: totalTripsRes.count ?? 0 },
    totalBookingsAllTime: totalBookingsRes.count ?? 0,
    daily,
    statusBreakdown,
    topSellers,
    recentBookings,
    pendingCommissions: { count: pendingCommCount, amount: Math.round(pendingCommAmount) },
  }
}
