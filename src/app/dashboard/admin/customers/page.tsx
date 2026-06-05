'use client'
import { useState } from 'react'

// Hooks
import { useCustomersAdmin } from '@/hooks/useCustomersAdmin'

// Components
import StatCard from '@/components/ui/StatCard'
import CustomerCard from '@/components/admin/CustomerCard'
import EmptyState from '@/components/ui/EmptyState'

export default function CustomersPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'inprogress' | 'rejected' | 'cancelled'>('all')
  
  const {
    customers,
    loading,
    searchTerm,
    setSearchTerm,
    updatingStatus,
    updateBookingStatus,
    calculateStats
  } = useCustomersAdmin()

  const stats = calculateStats()

  // Filter customers based on selected status
  const filteredCustomers = customers.filter(customer => {
    if (activeFilter === 'all') return true
    return customer.bookings?.some((booking: any) => booking.status === activeFilter)
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      {/* Clean Professional Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการลูกค้าและการจอง</h1>
              <p className="text-gray-600 text-lg">จัดการข้อมูลลูกค้า อนุมัติการจอง และติดตามสถานะการจอง</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-gray-50 rounded-lg px-6 py-4 border border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                  <p className="text-sm text-gray-600 font-medium">ลูกค้าทั้งหมด</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Status Filter Tabs - Clean & Professional */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 inline-flex shadow-sm">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'all'
                ? 'bg-blue-50 text-primary-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            ทั้งหมด ({stats.totalCustomers})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'pending'
                ? 'bg-amber-50 text-amber-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            รอดำเนินการ ({stats.pendingBookings})
          </button>
          <button
            onClick={() => setActiveFilter('inprogress')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'inprogress'
                ? 'bg-blue-50 text-primary-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            กำลังดำเนินการ ({stats.inprogressBookings})
          </button>
          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'approved'
                ? 'bg-green-50 text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            อนุมัติแล้ว ({stats.approvedBookings})
          </button>
          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'rejected'
                ? 'bg-red-50 text-red-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            ถูกปฏิเสธ ({stats.rejectedBookings})
          </button>
          <button
            onClick={() => setActiveFilter('cancelled')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'cancelled'
                ? 'bg-gray-50 text-gray-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            ยกเลิกแล้ว ({stats.cancelledBookings})
          </button>
        </div>

        {/* Summary Statistics - Clean Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ลูกค้าที่แสดงผล</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredCustomers.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg className="w-6 h-6 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">การจองที่เลือก</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeFilter === 'all' 
                    ? stats.totalBookings 
                    : activeFilter === 'pending' ? stats.pendingBookings
                    : activeFilter === 'inprogress' ? stats.inprogressBookings
                    : activeFilter === 'approved' ? stats.approvedBookings
                    : activeFilter === 'rejected' ? stats.rejectedBookings
                    : stats.cancelledBookings
                  }
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                activeFilter === 'all' ? 'bg-gray-50' :
                activeFilter === 'pending' ? 'bg-amber-50' :
                activeFilter === 'inprogress' ? 'bg-blue-50' :
                activeFilter === 'approved' ? 'bg-green-50' :
                activeFilter === 'rejected' ? 'bg-red-50' :
                'bg-gray-50'
              }`}>
                <svg className={`w-6 h-6 ${
                  activeFilter === 'all' ? 'text-gray-600' :
                  activeFilter === 'pending' ? 'text-amber-600' :
                  activeFilter === 'inprogress' ? 'text-primary-blue' :
                  activeFilter === 'approved' ? 'text-green-600' :
                  activeFilter === 'rejected' ? 'text-red-600' :
                  'text-gray-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H9.5" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">อัตราการมีการจอง</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalCustomers > 0 ? Math.round((stats.customersWithBookings / stats.totalCustomers) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div> */}

        {/* Clean Search Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeFilter === 'all' ? 'ลูกค้าทั้งหมด' :
               activeFilter === 'pending' ? 'ลูกค้าที่มีการจองรอดำเนินการ' :
               activeFilter === 'inprogress' ? 'ลูกค้าที่มีการจองกำลังดำเนินการ' :
               activeFilter === 'approved' ? 'ลูกค้าที่มีการจองอนุมัติแล้ว' :
               activeFilter === 'rejected' ? 'ลูกค้าที่มีการจองถูกปฏิเสธ' :
               'ลูกค้าที่มีการจองยกเลิกแล้ว'}
            </h2>
            <div className="text-sm text-gray-500">
              แสดงผล {filteredCustomers.length} จาก {stats.totalCustomers} ลูกค้า
            </div>
          </div>
          <div className="relative max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทรศัพท์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl  outline-none transition-all text-gray-900 placeholder-gray-500 shadow-sm"
            />
          </div>
        </div>

        {/* Customer Cards */}
        <div className="space-y-6">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onStatusUpdate={updateBookingStatus}
              updatingStatus={updatingStatus}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredCustomers.length === 0 && (
          <EmptyState
            title={
              activeFilter === 'all' 
                ? "ไม่พบข้อมูลลูกค้า" 
                : `ไม่พบลูกค้าที่มีการจอง${
                    activeFilter === 'pending' ? 'รอดำเนินการ' :
                    activeFilter === 'inprogress' ? 'กำลังดำเนินการ' :
                    activeFilter === 'approved' ? 'อนุมัติแล้ว' :
                    activeFilter === 'rejected' ? 'ถูกปฏิเสธ' :
                    activeFilter === 'cancelled' ? 'ยกเลิกแล้ว' : ''
                  }`
            }
            description={
              activeFilter === 'all'
                ? "ยังไม่มีลูกค้าในระบบ"
                : "ลองเปลี่ยน filter หรือค้นหาด้วยคำอื่น"
            }
            searchTerm={searchTerm || undefined}
          />
        )}
      </div>
    </div>
  )
}
