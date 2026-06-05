import Link from 'next/link'
import { Trophy } from 'lucide-react'
import type { TopSeller } from '@/lib/admin/dashboard-data'
import { formatNumber, formatTHB } from '@/lib/format'

const RANK_COLORS = ['bg-amber-400', 'bg-slate-300', 'bg-orange-300']

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export default function TopSellers({ sellers }: { sellers: TopSeller[] }) {
  const max = sellers[0]?.revenue || 1

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <Trophy className="h-4 w-4 text-amber-500" />
          Top Sellers
          <span className="text-xs font-normal text-gray-400">(30 วัน)</span>
        </h2>
        <Link href="/dashboard/admin/sellers" className="text-xs font-medium text-primary-blue hover:underline">
          ดูทั้งหมด
        </Link>
      </div>

      {sellers.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">ยังไม่มียอดขายในช่วงนี้</p>
      ) : (
        <ul className="space-y-4">
          {sellers.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-primary-blue">
                  {initials(s.name)}
                </div>
                <span
                  className={`absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                    RANK_COLORS[i] ?? 'bg-gray-300'
                  }`}
                >
                  {i + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">{formatTHB(s.revenue)}</p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-secondary-blue to-primary-blue"
                    style={{ width: `${Math.max(6, (s.revenue / max) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {formatNumber(s.bookings)} การจอง · คอม {formatTHB(s.commission)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
