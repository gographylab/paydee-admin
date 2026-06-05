'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { StatusSlice } from '@/lib/admin/dashboard-data'
import { formatNumber } from '@/lib/format'

interface TooltipItem {
  payload?: StatusSlice
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload?.length) return null
  const slice = payload[0]?.payload
  if (!slice) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="flex items-center gap-2 font-medium text-gray-700">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: slice.color }} />
        {slice.label}
        <span className="ml-auto font-semibold tabular-nums text-gray-900">{formatNumber(slice.value)}</span>
      </p>
    </div>
  )
}

export default function BookingStatusDonut({ data }: { data: StatusSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center text-center text-sm text-gray-400">
        ยังไม่มีการจองในช่วง 30 วัน
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((s) => (
                <Cell key={s.status} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-gray-900">{formatNumber(total)}</span>
          <span className="text-xs text-gray-400">การจอง</span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-1 gap-2">
        {data.map((s) => (
          <li key={s.status} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-gray-900">{formatNumber(s.value)}</span>
            <span className="w-10 text-right text-xs tabular-nums text-gray-400">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
