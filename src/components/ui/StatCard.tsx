interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  colorClass: string
  className?: string
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function StatCard({
  title,
  value,
  icon,
  colorClass,
  className = '',
  description,
  trend
}: StatCardProps) {
  const getBackgroundColor = (colorClass: string) => {
    if (colorClass.includes('blue')) return 'bg-blue-50'
    if (colorClass.includes('green')) return 'bg-green-50'
    if (colorClass.includes('amber') || colorClass.includes('yellow')) return 'bg-amber-50'
    if (colorClass.includes('red')) return 'bg-red-50'
    if (colorClass.includes('purple')) return 'bg-purple-50'
    return 'bg-gray-50'
  }

  const getIconColor = (colorClass: string) => {
    if (colorClass.includes('blue')) return 'text-primary-blue'
    if (colorClass.includes('green')) return 'text-green-600'
    if (colorClass.includes('amber') || colorClass.includes('yellow')) return 'text-amber-600'
    if (colorClass.includes('red')) return 'text-red-600'
    if (colorClass.includes('purple')) return 'text-purple-600'
    return 'text-gray-600'
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-12 h-12 ${getBackgroundColor(colorClass)} rounded-xl flex items-center justify-center`}>
              <div className={getIconColor(colorClass)}>
                {icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <div className="flex items-baseline space-x-2">
                <p className={`text-3xl font-bold ${colorClass}`}>
                  {value.toLocaleString()}
                </p>
                {trend && (
                  <div className={`flex items-center text-xs font-medium ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trend.isPositive ? (
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {Math.abs(trend.value)}%
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
