interface StatusSelectorProps {
  currentStatus: string | null
  bookingId: string
  onStatusChange: (bookingId: string, newStatus: string) => void
  isLoading?: boolean
  className?: string
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'inprogress', label: 'กำลังดำเนินการ' },
  { value: 'approved', label: 'ผ่านการยืนยัน' },
  { value: 'rejected', label: 'แอดมินยกเลิก' },
  { value: 'cancelled', label: 'ลูกค้าายกเลิก' }
] as const

export default function StatusSelector({
  currentStatus,
  bookingId,
  onStatusChange,
  isLoading = false,
  className = ''
}: StatusSelectorProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <select
        value={currentStatus || 'pending'}
        onChange={(e) => onStatusChange(bookingId, e.target.value)}
        disabled={isLoading}
        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue transition-colors disabled:opacity-50 cursor-pointer"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {isLoading && (
        <div className="w-4 h-4 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  )
}
