'use client'

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyPoint } from '@/lib/admin/dashboard-data'
import { formatCompactTHB, formatNumber, formatTHB } from '@/lib/format'

const BLUE = '#176daf'
const AMBER = '#fe9813'

interface TooltipPayloadItem {
  dataKey?: string | number
  value?: number | string
  payload?: DailyPoint
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload
  if (!point) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-700">{point.label}</p>
      <p className="flex items-center gap-2 text-gray-600">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: BLUE }} />
        รายได้ <span className="ml-auto font-semibold tabular-nums text-gray-900">{formatTHB(point.revenue)}</span>
      </p>
      <p className="mt-0.5 flex items-center gap-2 text-gray-600">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: AMBER }} />
        การจอง <span className="ml-auto font-semibold tabular-nums text-gray-900">{formatNumber(point.bookings)}</span>
      </p>
    </div>
  )
}

export default function RevenueChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.28} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          yAxisId="rev"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => formatCompactTHB(v as number)}
        />
        <YAxis yAxisId="bk" orientation="right" hide />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
        <Area
          yAxisId="rev"
          type="monotone"
          dataKey="revenue"
          stroke={BLUE}
          strokeWidth={2.5}
          fill="url(#revFill)"
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          yAxisId="bk"
          type="monotone"
          dataKey="bookings"
          stroke={AMBER}
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 4"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
