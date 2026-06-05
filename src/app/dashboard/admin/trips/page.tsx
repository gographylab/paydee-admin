'use client'

import Link from 'next/link'
import { useState, useMemo, useCallback } from 'react'
import { useAdminTrips } from '@/hooks/useAdminTrips'
import TripImage from '@/components/TripImage'
import { showConfirmDialog } from '@/lib/confirm-dialog'
import { Pagination } from '@/components/ui/Pagination'
import { Building2 } from 'lucide-react'
import Image from 'next/image'

export default function AdminTripsPage() {
  const {
    trips,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    deleteTrip,
    toggleTripStatus
  } = useAdminTrips(6) // 6 trips per page
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = useCallback(async (tripId: string, tripTitle: string) => {
    const confirmed = await showConfirmDialog({
      title: 'ลบทริป',
      description: `คุณแน่ใจหรือไม่ที่จะลบทริป "${tripTitle}"?`,
      confirmText: 'ลบ',
      variant: 'destructive'
    })
    
    if (confirmed) {
      setDeletingId(tripId)
      try {
        await deleteTrip(tripId)
      } finally {
        setDeletingId(null)
      }
    }
  }, [deleteTrip])

  const handleToggleStatus = useCallback(async (tripId: string, currentStatus: boolean) => {
    setTogglingId(tripId)
    try {
      await toggleTripStatus(tripId, !currentStatus)
    } finally {
      setTogglingId(null)
    }
  }, [toggleTripStatus])

  // Memoize skeleton items to prevent re-renders
  const skeletonItems = useMemo(() => 
    Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
    )), []
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {skeletonItems}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">เกิดข้อผิดพลาดในการโหลดข้อมูล: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-end lg:items-start gap-6">
            <Link
              href="/dashboard/admin/trips/create"
              className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              สร้างทริปใหม่
            </Link>
          </div>
        </div>

        {trips && trips.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {trips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Trip Image */}
                {trip.cover_image_url && (
                  <div className="aspect-video relative">
                    <TripImage
                      src={trip.cover_image_url}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Partner Badge - Bottom Right */}
                    {(trip as any).partners && (
                      <div className="absolute bottom-2 right-2">
                        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-full">
                          {(trip as any).partners.logo_url ? (
                            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image
                                src={(trip as any).partners.logo_url}
                                alt={(trip as any).partners.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <Building2 size={12} className="text-gray-500" />
                            </div>
                          )}
                          <span className="text-xs font-medium text-white whitespace-nowrap">
                            {(trip as any).partners.name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6">
                  {/* Trip Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2 min-h-[3.5rem] flex items-start">
                        {trip.title}
                      </h3>
                      <div className="flex items-center gap-2 ml-3">
                        <label className="relative inline-block w-12 h-7 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={trip.is_active === true}
                            onChange={() => handleToggleStatus(trip.id, trip.is_active === true)}
                            disabled={togglingId === trip.id}
                            className="opacity-0 w-0 h-0"
                          />
                          <span className={`
                            absolute top-0 left-0 right-0 bottom-0 
                            rounded-full transition-all duration-400 ease-in-out cursor-pointer
                            ${trip.is_active === true ? 'bg-emerald-500' : 'bg-gray-300'}
                            ${togglingId === trip.id ? 'opacity-70' : ''}
                            before:content-[''] before:absolute before:h-5 before:w-5 
                            before:left-1 before:bottom-1 before:bg-white 
                            before:rounded-full before:transition-all before:duration-400 before:ease-in-out
                            ${trip.is_active === true ? 'before:translate-x-5' : 'before:translate-x-0'}
                            hover:shadow-md focus:shadow-lg focus:outline-none
                          `}>
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      {(trip.countries as any)?.flag_emoji && (
                        <span className="text-lg">
                          {(trip.countries as any).flag_emoji}
                        </span>
                      )}
                      <span className="text-gray-700 font-medium">
                        {(trip.countries as any)?.name || 'ไม่ระบุ'}
                      </span>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">ระยะเวลา</span>
                      <span className="text-gray-900 font-medium">
                        {(() => {
                          if (!trip.trip_schedules || trip.trip_schedules.length === 0) return '- วัน - คืน'

                          // ใช้ schedule แรกในการคำนวณระยะเวลา
                          const schedule = trip.trip_schedules[0]
                          const departure = new Date(schedule.departure_date)
                          const returnDate = new Date(schedule.return_date)

                          // คำนวณจำนวนวัน: return_date - departure_date + 1
                          const diffTime = returnDate.getTime() - departure.getTime()
                          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
                          const nights = Math.max(0, diffDays - 1)

                          return `${diffDays} วัน ${nights} คืน`
                        })()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">ราคา</span>
                      <span className="text-gray-900 font-medium text-base">
                        ฿{Number(trip.price_per_person).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">จำนวนที่นั่ง</span>
                      <span className="text-gray-900 font-medium">
                        {trip.trip_schedules && trip.trip_schedules.length > 0
                          ? Math.max(...trip.trip_schedules.map(s => s.available_seats))
                          : 0
                        } คน
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">สถานะ</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        trip.is_active === true
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trip.is_active === true ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/admin/trips/${trip.id}`}
                      className="flex-1 text-center bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors text-sm"
                    >
                      ดูรายละเอียด
                    </Link>
                    <Link
                      href={`/dashboard/admin/trips/edit/${trip.id}`}
                      className="flex-1 text-center bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors text-sm"
                    >
                      แก้ไข
                    </Link>
                    <button
                      onClick={() => handleDelete(trip.id, trip.title)}
                      disabled={deletingId === trip.id}
                      className="bg-red-100 text-red-700 py-2 px-4 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {deletingId === trip.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        'ลบ'
                      )}
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={pageSize}
                totalItems={totalCount}
              />
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีทริปในระบบ</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              เริ่มต้นสร้างทริปแรกของคุณเพื่อเริ่มต้นการจัดการและขายทริป
            </p>
            <Link
              href="/dashboard/admin/trips/create"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              สร้างทริปแรกของคุณ
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
