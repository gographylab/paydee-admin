interface SeatIndicatorProps {
  availableSeats: number | null | undefined
  totalSeats?: number | null
  loading?: boolean
  className?: string
  textColor?: string
}

export default function SeatIndicator({ 
  availableSeats, 
  totalSeats,
  loading = false,
  className = '',
  textColor = 'text-white'
}: SeatIndicatorProps) {
  // Handle null/undefined values
  const seats = availableSeats ?? 0
  const total = totalSeats ?? 0
  
  const getIndicatorColor = () => {
    if (loading || availableSeats === null || availableSeats === undefined) return 'bg-gray-500'
    
    const percentage = total > 0 ? (seats / total) * 100 : (seats > 0 ? 50 : 0)
    
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 20) return 'bg-primary-yellow'
    if (percentage > 0) return 'bg-red-500'
    return 'bg-gray-500'
  }

  const displaySeats = loading || availableSeats === null || availableSeats === undefined ? '...' : seats

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getIndicatorColor()} ${loading ? 'animate-pulse' : ''}`} />
      <span className={`text-lg font-semibold ${textColor}`}>
        {displaySeats} ที่นั่งเหลือ
      </span>
    </div>
  )
}
