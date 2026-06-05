import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  ClipboardList,
  Clock,
  Coins,
  MapPin,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAdminDashboardData } from '@/lib/admin/dashboard-data'
import { formatCompactTHB, formatNumber, formatTHB } from '@/lib/format'
import KpiCard from '@/components/admin/dashboard/KpiCard'
import RevenueChart from '@/components/admin/dashboard/RevenueChart'
import BookingStatusDonut from '@/components/admin/dashboard/BookingStatusDonut'
import TopSellers from '@/components/admin/dashboard/TopSellers'
import RecentBookings from '@/components/admin/dashboard/RecentBookings'

export const dynamic = 'force-dynamic'

// ----- small presentational helpers (server) -----

function MiniStat({
  icon,
  label,
  value,
  tone,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: 'amber' | 'rose' | 'violet' | 'blue'
  href?: string
}) {
  const tones = {
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
    violet: 'text-violet-600 bg-violet-50',
    blue: 'text-primary-blue bg-blue-50',
  } as const
  const inner = (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-500">{label}</p>
        <p className="text-lg font-bold tabular-nums text-gray-900">{value}</p>
      </div>
      {href && <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-300" />}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

const QUICK_ACTIONS = [
  { href: '/dashboard/admin/sellers', label: 'จัดการ Sellers', desc: 'อนุมัติ / ปฏิเสธ', icon: Users },
  { href: '/dashboard/admin/bookings', label: 'จัดการการจอง', desc: 'สร้างและติดตาม', icon: ClipboardList },
  { href: '/dashboard/admin/trips', label: 'จัดการ Trips', desc: 'ทริปทั้งหมด', icon: MapPin },
  { href: '/dashboard/admin/coins', label: 'ระบบ Coins', desc: 'แคมเปญ & แลกรับ', icon: Coins },
]

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const d = await getAdminDashboardData()

  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-full bg-gray-50/60 p-4 sm:p-6">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">ภาพรวมระบบ</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            ยินดีต้อนรับ, <span className="font-medium text-gray-700">{profile.full_name}</span>
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm">
          <CalendarCheck className="h-3.5 w-3.5 text-primary-blue" />
          {today}
          <span className="text-gray-300">·</span>
          <span className="text-gray-400">ข้อมูล 30 วันล่าสุด</span>
        </div>
      </header>

      {/* Alerts */}
      {(d.pendingSellers > 0 || d.pendingCommissions.count > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {d.pendingSellers > 0 && (
            <Link
              href="/dashboard/admin/sellers"
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100/70"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-800">
                มี Seller <span className="font-bold">{formatNumber(d.pendingSellers)}</span> คนรอการอนุมัติ
              </p>
              <ArrowRight className="ml-auto h-4 w-4 text-amber-500" />
            </Link>
          )}
          {d.pendingCommissions.count > 0 && (
            <Link
              href="/dashboard/admin/bookings"
              className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 transition-colors hover:bg-blue-100/70"
            >
              <Wallet className="h-5 w-5 shrink-0 text-primary-blue" />
              <p className="text-sm text-blue-900">
                คอมมิชชั่นค้างจ่าย <span className="font-bold">{formatNumber(d.pendingCommissions.count)}</span> รายการ ·{' '}
                {formatTHB(d.pendingCommissions.amount)}
              </p>
              <ArrowRight className="ml-auto h-4 w-4 text-primary-blue" />
            </Link>
          )}
        </div>
      )}

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="รายได้รวม (GMV)"
          value={formatCompactTHB(d.revenue.current)}
          change={d.revenue.change}
          accent="blue"
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="ยอดจอง 30 วันล่าสุด"
        />
        <KpiCard
          title="คอมมิชชั่นที่จ่าย"
          value={formatCompactTHB(d.commissionPaid.current)}
          change={d.commissionPaid.change}
          accent="amber"
          icon={<BadgeDollarSign className="h-5 w-5" />}
          subtitle="จ่ายแล้วใน 30 วัน"
        />
        <KpiCard
          title="การจอง"
          value={formatNumber(d.bookings.current)}
          change={d.bookings.change}
          accent="green"
          icon={<ClipboardList className="h-5 w-5" />}
          subtitle={`ทั้งหมด ${formatNumber(d.totalBookingsAllTime)} รายการ`}
        />
        <KpiCard
          title="Sellers ที่ใช้งาน"
          value={formatNumber(d.activeSellers.total)}
          change={d.activeSellers.change}
          accent="violet"
          icon={<Users className="h-5 w-5" />}
          subtitle={`+${formatNumber(d.activeSellers.newCurrent)} ใหม่ใน 30 วัน`}
        />
      </div>

      {/* Secondary stats */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          icon={<Clock className="h-5 w-5" />}
          label="รอการอนุมัติ"
          value={`${formatNumber(d.pendingSellers)} คน`}
          tone="amber"
          href="/dashboard/admin/sellers"
        />
        <MiniStat
          icon={<Wallet className="h-5 w-5" />}
          label="ยอดค้างชำระ"
          value={formatTHB(d.outstanding)}
          tone="rose"
        />
        <MiniStat
          icon={<Coins className="h-5 w-5" />}
          label="Coin คงค้าง (liability)"
          value={`${formatNumber(d.coinLiability)} coins`}
          tone="violet"
          href="/dashboard/admin/coins"
        />
        <MiniStat
          icon={<MapPin className="h-5 w-5" />}
          label="ทริปเปิดขาย"
          value={`${formatNumber(d.trips.active)} / ${formatNumber(d.trips.total)}`}
          tone="blue"
          href="/dashboard/admin/trips"
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">รายได้รายวัน</h2>
              <p className="text-xs text-gray-400">30 วันล่าสุด · รายได้ (พื้นที่) เทียบจำนวนการจอง (เส้น)</p>
            </div>
            <div className="hidden items-center gap-4 text-xs text-gray-500 sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary-blue" /> รายได้
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-full bg-primary-yellow" /> การจอง
              </span>
            </div>
          </div>
          <RevenueChart data={d.daily} />
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">สถานะการจอง</h2>
          <BookingStatusDonut data={d.statusBreakdown} />
        </section>
      </div>

      {/* Lists */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TopSellers sellers={d.topSellers} />
        </div>
        <div className="lg:col-span-2">
          <RecentBookings bookings={d.recentBookings} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">เมนูด่วน</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon
            return (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-primary-blue/30 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary-blue transition-colors group-hover:bg-primary-blue group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{a.label}</p>
                  <p className="truncate text-xs text-gray-400">{a.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
