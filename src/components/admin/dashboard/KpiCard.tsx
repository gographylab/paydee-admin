import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Accent = 'blue' | 'amber' | 'green' | 'violet'

const ACCENT: Record<Accent, { iconBg: string; icon: string; bar: string }> = {
  blue: { iconBg: 'bg-blue-50', icon: 'text-primary-blue', bar: 'bg-primary-blue' },
  amber: { iconBg: 'bg-amber-50', icon: 'text-amber-600', bar: 'bg-primary-yellow' },
  green: { iconBg: 'bg-green-50', icon: 'text-green-600', bar: 'bg-green-500' },
  violet: { iconBg: 'bg-violet-50', icon: 'text-violet-600', bar: 'bg-violet-500' },
}

interface KpiCardProps {
  title: string
  value: string
  icon: React.ReactNode
  accent: Accent
  /** % change vs previous period; null hides the trend pill */
  change?: number | null
  subtitle?: string
}

export default function KpiCard({ title, value, icon, accent, change, subtitle }: KpiCardProps) {
  const a = ACCENT[accent]
  const hasTrend = change !== null && change !== undefined
  const up = (change ?? 0) >= 0

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <span className={cn('absolute inset-x-0 top-0 h-1', a.bar)} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', a.iconBg, a.icon)}>
          {icon}
        </div>
        {hasTrend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold tabular-nums',
              change === 0
                ? 'bg-gray-100 text-gray-500'
                : up
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600',
            )}
          >
            {change === 0 ? (
              <Minus className="h-3 w-3" />
            ) : up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(change ?? 0).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 tabular-nums sm:text-3xl">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}
