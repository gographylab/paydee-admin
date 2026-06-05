import { memo, useCallback } from 'react'
import Link from 'next/link'
import TripImage from '@/components/TripImage'
import { Trip } from '@/types/admin'

interface TripRowProps {
  trip: Trip
  onDelete: (tripId: string, tripTitle: string) => Promise<void>
  onToggleStatus: (tripId: string, currentStatus: boolean) => Promise<void>
  deletingId: string | null
  togglingId: string | null
}

const TripRow = memo(function TripRow({
  trip,
  onDelete,
  onToggleStatus,
  deletingId,
  togglingId
}: TripRowProps) {
  const handleDelete = useCallback(() => {
    onDelete(trip.id, trip.title)
  }, [trip.id, trip.title, onDelete])

  const handleToggleStatus = useCallback(() => {
    onToggleStatus(trip.id, trip.is_active || false)
  }, [trip.id, trip.is_active, onToggleStatus])

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="h-16 w-16 flex-shrink-0">
            <TripImage
              src={trip.cover_image_url || ''}
              alt={trip.title}
              className="h-16 w-16 rounded-lg object-cover"
              priority={false}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {trip.title}
            </div>
            <div className="text-sm text-gray-500">
              {trip.countries?.name} • {trip.duration_days}D{trip.duration_nights}N
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        ฿{trip.price_per_person?.toLocaleString()}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          trip.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {trip.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {trip.trip_schedules?.length || 0} รอบ
      </td>
      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
        <Link
          href={`/dashboard/admin/trips/${trip.id}`}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ดู
        </Link>
        <Link
          href={`/dashboard/admin/trips/${trip.id}/edit`}
          className="text-blue-600 hover:text-blue-900"
        >
          แก้ไข
        </Link>
        <button
          onClick={handleToggleStatus}
          disabled={togglingId === trip.id}
          className={`${
            trip.is_active 
              ? 'text-red-600 hover:text-red-900' 
              : 'text-green-600 hover:text-green-900'
          } disabled:opacity-50`}
        >
          {togglingId === trip.id ? '...' : (trip.is_active ? 'ปิด' : 'เปิด')}
        </button>
        <button
          onClick={handleDelete}
          disabled={deletingId === trip.id}
          className="text-red-600 hover:text-red-900 disabled:opacity-50"
        >
          {deletingId === trip.id ? '...' : 'ลบ'}
        </button>
      </td>
    </tr>
  )
})

export default TripRow