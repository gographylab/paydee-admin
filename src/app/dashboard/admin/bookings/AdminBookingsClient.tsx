'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '../../../../../database.types'
import BookingCard from './components/BookingCard'
import CreateBookingModal from './components/CreateBookingModal'
import BookingFilters from './components/BookingFilters'
import BookingStats from './components/BookingStats'
import { toast } from 'sonner'
import { showConfirmDialog } from '@/lib/confirm-dialog'
import { useAdminBookings } from '@/hooks/useAdminBookings'

interface BookingWithDetails extends Tables<'bookings'> {
  customers?: {
    full_name: string
    email: string
    phone: string | null
    id_card: string | null
    passport_number: string | null
  }
  trip_schedules?: {
    departure_date: string
    return_date: string
    registration_deadline: string
    available_seats: number
    trips?: {
      title: string
      price_per_person: number
      commission_type: string | null
      commission_value: number
      countries?: {
        name: string
        flag_emoji: string | null
      }
    }
  }
  seller?: {
    id: string
    full_name: string | null
    email: string | null
    referral_code: string | null
    avatar_url: string | null
  }
}

interface Seller {
  id: string
  full_name: string | null
  email: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface TripWithSchedules extends Tables<'trips'> {
  countries?: {
    name: string
    flag_emoji: string | null
  }
  trip_schedules?: Array<{
    id: string
    departure_date: string
    return_date: string
    registration_deadline: string
    available_seats: number
    is_active: boolean | null
  }>
}

interface AdminBookingsClientProps {
  initialBookings: BookingWithDetails[]
  sellers: Seller[]
  trips: TripWithSchedules[]
}

type BookingStatus = 'all' | 'pending' | 'inprogress' | 'approved' | 'rejected' | 'cancelled'

// Memoized component for better performance
const AdminBookingsClient = memo(function AdminBookingsClient({ 
  initialBookings, 
  sellers, 
  trips 
}: AdminBookingsClientProps) {
  // Use the new optimized hook
  const { 
    bookings, 
    loading, 
    error, 
    totalCount,
    currentPage,
    totalPages,
    refreshBookings,
    loadMore,
    hasMore,
    updateBookingInState
  } = useAdminBookings(20) as any // Cast for now due to TypeScript complexity
  
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>(initialBookings)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [sellerFilter, setSellerId] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const supabase = createClient()

  // Initialize with server-side data
  useEffect(() => {
    if (initialBookings.length > 0 && bookings.length === 0) {
      // Use initial data until client-side fetch completes
      setFilteredBookings(initialBookings)
    }
  }, [initialBookings, bookings])

  // Memoized filter function for better performance
  const applyFilters = useCallback(() => {
    refreshBookings({
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
      sellerId: sellerFilter !== 'all' ? sellerFilter : undefined
    })
  }, [searchTerm, statusFilter, paymentStatusFilter, sellerFilter, refreshBookings])

  // Use debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters()
    }, 300) // 300ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [applyFilters])

  // Set filtered bookings when bookings change
  useEffect(() => {
    if (bookings.length > 0) {
      setFilteredBookings(bookings)
    }
  }, [bookings])

  // Memoized update functions for better performance
  const updateBookingStatus = useCallback(async (bookingId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/bookings/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update booking status')
      }

      // Update only the specific booking instead of refreshing all
      await updateBookingInState(bookingId)
    } catch (error) {
      console.error('Error updating booking status:', error)
      toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะการจอง')
    }
  }, [updateBookingInState])

  const updatePaymentStatus = useCallback(async (bookingId: string, paymentStatus: string) => {
    try {
      const response = await fetch('/api/admin/bookings/update-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          paymentStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update payment status')
      }

      // Update only the specific booking instead of refreshing all
      await updateBookingInState(bookingId)
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะการชำระเงิน: ' + (error as Error).message)
    }
  }, [updateBookingInState])

  // New function to update commission payments without full refresh
  const updateCommissionInState = useCallback(async (bookingId: string) => {
    await updateBookingInState(bookingId)
  }, [updateBookingInState])

  // Function to delete booking
  const deleteBooking = useCallback(async (bookingId: string) => {
    const confirmed = await showConfirmDialog({
      title: 'ยืนยันการลบ',
      description: 'คุณแน่ใจหรือไม่ที่จะลบการจองนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'destructive'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete booking')
      }

      // Refresh bookings to remove deleted item
      await refreshBookings()
      
      toast.success('ลบการจองเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error('เกิดข้อผิดพลาดในการลบการจอง: ' + (error as Error).message)
    }
  }, [refreshBookings])

  const handleBookingCreated = useCallback(() => {
    setShowCreateModal(false)
    refreshBookings()
  }, [refreshBookings])

  const fixCommissions = useCallback(async () => {
    const confirmed = await showConfirmDialog({
      title: 'สร้าง commission payments สำหรับ booking ที่ยังไม่มี?',
      description: 'การดำเนินการนี้จะสร้าง commission payments ให้กับ booking ทั้งหมดที่มี seller แต่ยังไม่มี commission payments',
      confirmText: 'สร้าง',
      variant: 'default'
    })
    
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch('/api/admin/bookings/fix-commissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fix commissions')
      }

      const result = await response.json()
      toast.success(`สำเร็จ! สร้าง commission payments สำหรับ ${result.created} booking`)
      
      if (result.errors && result.errors.length > 0) {
        console.error('Commission errors:', result.errors)
        toast.warning(`มีข้อผิดพลาดบางส่วน: ${result.errors.length} รายการ`)
      }

      // Refresh bookings to see the changes
      await refreshBookings()
    } catch (error) {
      console.error('Error fixing commissions:', error)
      toast.error('เกิดข้อผิดพลาดในการสร้าง commission payments')
    }
  }, [refreshBookings])

  // Memoized components for better performance
  const memoizedStats = useMemo(() => (
    <BookingStats bookings={filteredBookings} />
  ), [filteredBookings])

  const memoizedFilters = useMemo(() => (
    <BookingFilters
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      paymentStatusFilter={paymentStatusFilter}
      setPaymentStatusFilter={setPaymentStatusFilter}
      sellerFilter={sellerFilter}
      setSellerId={setSellerId}
      dateFilter={dateFilter}
      setDateFilter={setDateFilter}
      sellers={sellers}
      onRefresh={() => refreshBookings()}
      loading={loading}
    />
  ), [searchTerm, statusFilter, paymentStatusFilter, sellerFilter, dateFilter, sellers, loading, refreshBookings])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">จัดการการจอง</h1>
            <p className="mt-1 text-gray-600">
              สร้าง แก้ไข และจัดการการจองทั้งหมดในระบบ
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fixCommissions}
              className="inline-flex items-center px-4 py-2 border border-secondary-yellow rounded-lg shadow-sm text-sm font-medium text-primary-yellow bg-primary-yellow-light hover:bg-primary-yellow-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-yellow transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Fix Commission Payments
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              สร้างการจองใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {memoizedStats}

      {/* Filters */}
      {memoizedFilters}

      {/* Bookings List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600">เกิดข้อผิดพลาด: {error}</p>
            <button 
              onClick={() => refreshBookings()}
              className="mt-2 text-primary-blue hover:text-secondary-blue"
            >
              ลองใหม่
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-900">ไม่พบการจอง</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              ลองปรับเปลี่ยนตัวกรองการค้นหา หรือสร้างการจองใหม่
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {bookings.map((booking: BookingWithDetails) => (
              <div key={booking.id} className="bg-gray-50 rounded-lg border border-gray-200">
                <BookingCard
                  booking={booking}
                  onStatusUpdate={updateBookingStatus}
                  onPaymentStatusUpdate={updatePaymentStatus}
                  onSellerUpdate={updateBookingInState}
                  onRefresh={updateCommissionInState}
                  onDelete={deleteBooking}
                  sellers={sellers}
                />
              </div>
            ))}

            {/* Load More Button */}
            {bookings.length > 0 && hasMore && (
              <div className="pt-4 border-t border-gray-200 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      โหลดเพิ่มเติม
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  แสดง {bookings.length} จาก {totalCount} รายการ ({currentPage}/{totalPages} หน้า)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <CreateBookingModal
          onClose={() => setShowCreateModal(false)}
          onBookingCreated={handleBookingCreated}
          sellers={sellers}
          trips={trips}
        />
      )}
    </div>
  )
})

export default AdminBookingsClient
