interface EmptyStateProps {
  title: string
  description: string
  searchTerm?: string
}

export default function EmptyState({ title, description, searchTerm }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {searchTerm ? (
        <div>
          <p className="text-gray-500 mb-1">ไม่พบผลลัพธ์สำหรับ "{searchTerm}"</p>
          <p className="text-gray-400 text-sm">ลองเปลี่ยนคำค้นหาหรือตรวจสอบการสะกด</p>
        </div>
      ) : (
        <p className="text-gray-500">{description}</p>
      )}
    </div>
  )
}
