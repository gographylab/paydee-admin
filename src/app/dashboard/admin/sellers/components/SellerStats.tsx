interface SellerStatsProps {
  statistics: {
    total: number
    pending: number
    approved: number
    rejected: number
    approvalRate: number
  }
}

export default function SellerStats({ statistics }: SellerStatsProps) {
  const totalSellers = statistics.total || 0
  const percentage = (value: number) => {
    if (!totalSellers) return 0
    const percent = Math.round((value / totalSellers) * 100)
    return Math.min(100, Math.max(0, percent))
  }

  const formatNumber = (value: number) => value.toLocaleString('th-TH')
  const statusBreakdown = [
    {
      label: 'รอ',
      value: statistics.pending,
      color: 'bg-amber-400'
    },
    {
      label: 'ผ่าน',
      value: statistics.approved,
      color: 'bg-emerald-500'
    },
    {
      label: 'ไม่ผ่าน',
      value: statistics.rejected,
      color: 'bg-rose-400'
    }
  ]

  const stats = [
    {
      title: 'Sellers ทั้งหมด',
      value: formatNumber(statistics.total),
      subtitle: 'คน',
      description: 'ภาพรวมทั้งหมด',
      helper: `${percentage(statistics.pending)}% กำลังรอตรวจสอบ`,
      badge: 'Overview',
      accent: 'from-sky-100 via-white to-white',
      badgeColor: 'text-sky-700 bg-sky-100/80',
      iconWrapper: 'bg-sky-50 text-sky-600',
      sectors: statusBreakdown.map((segment) => ({
        ...segment,
        percent: percentage(segment.value)
      })),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      )
    },
    {
      title: 'รออนุมัติ',
      value: formatNumber(statistics.pending),
      subtitle: 'คน',
      description: 'คำขอที่ยังรอตรวจสอบ',
      helper: `${percentage(statistics.pending)}% ของทั้งหมด`,
      badge: 'Pending',
      accent: 'from-amber-100 via-white to-white',
      badgeColor: 'text-amber-700 bg-amber-100/70',
      iconWrapper: 'bg-amber-50 text-amber-600',
      progress: percentage(statistics.pending),
      progressColor: 'bg-amber-400',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'อนุมัติแล้ว',
      value: formatNumber(statistics.approved),
      subtitle: 'คน',
      description: 'ผ่านการคัดเลือกแล้ว',
      helper: `${percentage(statistics.approved)}% ของทั้งหมด`,
      badge: 'Approved',
      accent: 'from-emerald-100 via-white to-white',
      badgeColor: 'text-emerald-700 bg-emerald-100/70',
      iconWrapper: 'bg-emerald-50 text-emerald-600',
      progress: percentage(statistics.approved),
      progressColor: 'bg-emerald-500',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'ไม่ผ่านการอนุมัติ',
      value: formatNumber(statistics.rejected),
      subtitle: 'คน',
      description: 'คำขอที่ถูกปฏิเสธ',
      helper: `${percentage(statistics.rejected)}% ของทั้งหมด`,
      badge: 'Rejected',
      accent: 'from-rose-100 via-white to-white',
      badgeColor: 'text-rose-700 bg-rose-100/70',
      iconWrapper: 'bg-rose-50 text-rose-600',
      progress: percentage(statistics.rejected),
      progressColor: 'bg-rose-400',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2 2 2m-2-2V7m0 13a9 9 0 100-18 9 9 0 000 18z" />
        </svg>
      )
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg"
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {stat.title}
                </p>
                {stat.description && <p className="text-sm text-gray-400">{stat.description}</p>}
              </div>
              {stat.badge && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${stat.badgeColor}`}>
                  {stat.badge}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-3xl font-semibold text-gray-900">{stat.value}</h3>
                </div>
                {stat.subtitle && (
                  <span className="text-xs text-gray-500">{stat.subtitle}</span>
                )}
              </div>
              <div className={`rounded-2xl p-2 ${stat.iconWrapper}`}>
                {stat.icon}
              </div>
            </div>

            {stat.helper && (
              <p className="text-xs text-gray-500">
                {stat.helper}
              </p>
            )}

            {stat.sectors && (
              <div className="space-y-1">
                <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-100">
                  {stat.sectors.map((segment, idx) => (
                    <div
                      key={`${segment.label}-${idx}`}
                      className={`${segment.color} h-full`}
                      style={{ width: `${segment.percent}%` }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-400">
                  {stat.sectors.map((segment, idx) => (
                    <span key={`${segment.label}-label-${idx}`}>
                      {segment.label} {segment.percent}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {typeof stat.progress === 'number' && (
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  <span>Progress</span>
                  <span>{stat.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${stat.progressColor}`}
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
