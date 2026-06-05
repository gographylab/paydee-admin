import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import type { RecentBooking } from '@/lib/admin/dashboard-data'
import { formatThaiDate, formatTHB } from '@/lib/format'

export default function RecentBookings({ bookings }: { bookings: RecentBooking[] }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">การจองล่าสุด</h2>
        <Link href="/dashboard/admin/bookings" className="text-xs font-medium text-primary-blue hover:underline">
          ดูทั้งหมด
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">ยังไม่มีการจอง</p>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[460px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400">
                <th className="px-1 pb-2 font-medium">ลูกค้า</th>
                <th className="px-1 pb-2 font-medium">สถานะ</th>
                <th className="px-1 pb-2 text-right font-medium">ยอด</th>
                <th className="px-1 pb-2 text-right font-medium">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="max-w-[160px] truncate px-1 py-2.5 font-medium text-gray-800">{b.customerName}</td>
                  <td className="px-1 py-2.5">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-1 py-2.5 text-right font-semibold tabular-nums text-gray-900">
                    {formatTHB(b.amount)}
                  </td>
                  <td className="whitespace-nowrap px-1 py-2.5 text-right text-xs text-gray-400">
                    {formatThaiDate(b.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
