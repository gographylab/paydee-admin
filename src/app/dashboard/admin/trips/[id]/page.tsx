import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TripImage from '@/components/TripImage'
import { Trip, TripSchedule } from '@/types/admin'


interface Booking {
  id: string
  booking_date: string | null
  total_amount: number
  commission_amount: number
  status: string | null
  customers?: {
    full_name: string
    email: string
  }
  seller?: {
    full_name: string | null
    email: string | null
  }
}

export default async function TripDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id: tripId } = await params

  // Get trip details with country
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(`
      *,
      countries (
        name,
        flag_emoji
      )
    `)
    .eq('id', tripId)
    .single()

  // Get trip schedules
  const { data: schedules, error: schedulesError } = await supabase
    .from('trip_schedules')
    .select('*')
    .eq('trip_id', tripId)
    .order('departure_date', { ascending: true })

  // Get bookings for this trip through schedules
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      customers (
        full_name,
        email
      ),
      trip_schedules!inner (
        id,
        trip_id
      )
    `)
    .eq('trip_schedules.trip_id', tripId)
    .order('booking_date', { ascending: false })

  if (tripError || !trip) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">ไม่พบข้อมูลทริป</p>
        </div>
      </div>
    )
  }

  const typedTrip = trip as Trip
  const typedSchedules = (schedules || []) as TripSchedule[]
  const typedBookings = (bookings || []) as Booking[]

  // Calculate statistics
  const totalBookings = typedBookings.length
  const totalRevenue = typedBookings.reduce((sum, booking) => sum + booking.total_amount, 0)
  const totalCommission = typedBookings.reduce((sum, booking) => sum + booking.commission_amount, 0)
  const activeSchedules = typedSchedules.filter(s => s.is_active).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/dashboard/admin/trips"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">กลับสู่รายการทริป</span>
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{typedTrip.title}</h1>
              <p className="text-lg text-gray-600">รายละเอียดและข้อมูลทริป</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/dashboard/admin/trips/edit/${tripId}`}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors duration-200 flex items-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                แก้ไขทริป
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Trip Image */}
          {typedTrip.cover_image_url && (
            <div className="xl:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <TripImage
                  src={typedTrip.cover_image_url}
                  alt={typedTrip.title}
                  className="w-full h-64 lg:h-80 object-cover"
                />
              </div>
            </div>
          )}

          {/* Trip Details */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">ข้อมูลทริป</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">ประเทศปลายทาง</h3>
                    <div className="flex items-center gap-3">
                      {(typedTrip.countries as any)?.flag_emoji && (
                        <span className="text-2xl">
                          {(typedTrip.countries as any).flag_emoji}
                        </span>
                      )}
                      <span className="text-lg font-medium text-gray-900">
                        {(typedTrip.countries as any)?.name || 'ไม่ระบุ'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">ระยะเวลาและวันเดินทาง</h3>
                    <div className="space-y-3">
                      {typedSchedules && typedSchedules.length > 0 ? (
                        typedSchedules.map((schedule, index) => {
                          const departure = new Date(schedule.departure_date)
                          const returnDate = new Date(schedule.return_date)
                          
                          // คำนวณจำนวนวัน: return_date - departure_date + 1
                          const diffTime = returnDate.getTime() - departure.getTime()
                          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
                          const nights = Math.max(0, diffDays - 1)
                          
                          // Format dates
                          const departureFormatted = departure.toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                          const returnFormatted = returnDate.toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                          const deadlineFormatted = new Date(schedule.registration_deadline).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                          
                          return (
                            <div key={schedule.id} className="bg-gray-50 px-4 py-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">รอบที่ {index + 1}</span>
                                <span className="text-lg font-medium text-gray-900">
                                  {diffDays} วัน {nights} คืน
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600">📅</span>
                                  <span>ปิดรับสมัคร: {deadlineFormatted}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-emerald-600">🛫</span>
                                  <span>ออกเดินทาง: {departureFormatted}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-orange-600">🛬</span>
                                  <span>วันกลับ: {returnFormatted}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-lg font-medium text-gray-400">
                          ยังไม่มีกำหนดการ
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">ราคาต่อคน</h3>
                    <p className="text-2xl font-bold text-emerald-600">
                      ฿{Number(typedTrip.price_per_person).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">จำนวนที่นั่ง</h3>
                    <div className="space-y-2">
                      {typedSchedules && typedSchedules.length > 0 ? (
                        typedSchedules.map((schedule, index) => (
                          <div key={schedule.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                            <span className="text-sm text-gray-600">รอบที่ {index + 1}</span>
                            <span className="text-lg font-medium text-gray-900">
                              {schedule.available_seats} ที่นั่ง
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-lg font-medium text-gray-400">
                          ยังไม่มีกำหนดการ
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">ค่าคอมมิชชั่น</h3>
                    <p className="text-lg font-medium text-gray-900">
                      {typedTrip.commission_value}
                      {typedTrip.commission_type === 'percentage' ? '%' : ' บาท'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">สถานะ</h3>
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      typedTrip.is_active 
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {typedTrip.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>
                </div>
              </div>

              {typedTrip.description && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">รายละเอียดทริป</h3>
                  <p className="text-gray-900 leading-relaxed">{typedTrip.description}</p>
                </div>
              )}

              {typedTrip.file_link && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">เอกสารประกอบ</h3>
                  <a 
                    href={typedTrip.file_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 hover:text-red-800 transition-colors duration-200 font-medium"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    ดาวน์โหลดเอกสาร PDF
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Schedules Section */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">ตารางเวลา</h2>

              {typedSchedules.length > 0 ? (
                <div className="space-y-4">
                  {typedSchedules.map((schedule) => (
                    <div key={schedule.id} className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">วันเดินทาง</p>
                          <p className="text-gray-900 font-medium">
                            {new Date(schedule.departure_date).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">วันกลับ</p>
                          <p className="text-gray-900 font-medium">
                            {new Date(schedule.return_date).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">ปิดรับสมัคร</p>
                          <p className="text-gray-900 font-medium">
                            {new Date(schedule.registration_deadline).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <p className="text-sm font-medium text-gray-500">ที่นั่งว่าง</p>
                            <p className="text-lg font-bold text-emerald-600">{schedule.available_seats} คน</p>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            schedule.is_active 
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {schedule.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4M8 7h8M8 7v4m0 0h8m-8 0v4h8V11" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีตารางเวลา</h3>
                  <p className="text-gray-500">กรุณาเพิ่มตารางเวลาสำหรับทริปนี้</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings Section */}
          {typedBookings.length > 0 && (
            <div className="xl:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">การจองล่าสุด</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-6 font-medium text-gray-500">ลูกค้า</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500">วันจอง</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500">ยอดรวม</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500">คอมมิชชั่น</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {typedBookings.slice(0, 10).map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-medium text-gray-900">
                                {(booking.customers as any)?.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {(booking.customers as any)?.email}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-900">
                            {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('th-TH') : '-'}
                          </td>
                          <td className="py-4 px-6 font-medium text-gray-900">
                            ฿{booking.total_amount.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 font-medium text-emerald-600">
                            ฿{booking.commission_amount.toLocaleString()}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : booking.status === 'pending'
                                ? 'bg-primary-yellow-light text-primary-yellow'
                                : booking.status === 'inprogress'
                                ? 'bg-primary-blue-light text-primary-blue'
                                : booking.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : booking.status === 'cancelled'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status === 'approved' ? 'ผ่านการยืนยัน' : 
                               booking.status === 'pending' ? 'รอดำเนินการ' : 
                               booking.status === 'inprogress' ? 'กำลังดำเนินการ' :
                               booking.status === 'rejected' ? 'แอดมินยกเลิก' :
                               booking.status === 'cancelled' ? 'ลูกค้าายกเลิก' : booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
