import { Tables } from '../../../../../../database.types'

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
  }
}

interface BookingStatsProps {
  bookings: BookingWithDetails[]
}

export default function BookingStats({ bookings }: BookingStatsProps) {
  // Debug: ดู status ของ bookings ทั้งหมด
  console.log('Bookings status:', bookings.map(b => ({ id: b.id, status: b.status, total_amount: b.total_amount, commission_amount: b.commission_amount })))

  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const approvedBookings = bookings.filter(b => b.status === 'approved').length
  const rejectedBookings = bookings.filter(b => b.status === 'rejected').length
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length
  const inProgressBookings = bookings.filter(b => b.status === 'inprogress').length

  // คำนวณยอดขายจาก bookings ที่มีการชำระเงินแล้วเท่านั้น
  const totalRevenue = bookings
    .filter(b => ['approved', 'confirmed'].includes(b.status || '') && 
                 ['deposit_paid', 'fully_paid'].includes(b.payment_status || ''))
    .reduce((sum, b) => sum + (b.total_amount || 0), 0)

  // คำนวณคอมมิชชั่นจาก bookings ที่มีการชำระเงินแล้วเท่านั้น  
  const totalCommission = bookings
    .filter(b => ['approved', 'confirmed'].includes(b.status || '') && 
                 ['deposit_paid', 'fully_paid'].includes(b.payment_status || ''))
    .reduce((sum, b) => sum + (b.commission_amount || 0), 0)

  console.log('Revenue calculation:', {
    filteredBookings: bookings.filter(b => ['approved', 'confirmed'].includes(b.status || '') && 
                                           ['deposit_paid', 'fully_paid'].includes(b.payment_status || '')),
    totalRevenue,
    totalCommission
  })

  const stats = [
    {
      title: 'การจองทั้งหมด',
      value: totalBookings.toLocaleString(),
      subtitle: 'รายการ',
      icon: (
        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'รออนุมัติ',
      value: pendingBookings.toLocaleString(),
      subtitle: 'รายการ',
      icon: (
        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'อนุมัติแล้ว',
      value: approvedBookings.toLocaleString(),
      subtitle: 'รายการ',
      icon: (
        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'กำลังดำเนินการ',
      value: inProgressBookings.toLocaleString(),
      subtitle: 'รายการ',
      icon: (
        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
    {
      title: 'ยอดขายรวม',
      value: totalRevenue > 0 ? `฿${totalRevenue.toLocaleString()}` : '฿0',
      subtitle: 'บาท (จากการชำระเงิน)',
      icon: (
        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'คอมมิชชั่นรวม',
      value: totalCommission > 0 ? `฿${totalCommission.toLocaleString()}` : '฿0',
      subtitle: 'บาท (จากการชำระเงิน)',
      icon: (
        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
