interface Seller {
  id: string
  full_name: string | null
  email: string | null
  referral_code: string | null
}

interface BookingFiltersProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: any) => void
  paymentStatusFilter: string
  setPaymentStatusFilter: (value: string) => void
  sellerFilter: string
  setSellerId: (value: string) => void
  dateFilter: string
  setDateFilter: (value: string) => void
  sellers: Seller[]
  onRefresh: () => void
  loading: boolean
}

export default function BookingFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  paymentStatusFilter,
  setPaymentStatusFilter,
  sellerFilter,
  setSellerId,
  dateFilter,
  setDateFilter,
  sellers,
  onRefresh,
  loading
}: BookingFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ค้นหา
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="ชื่อลูกค้า, อีเมล, ทริป..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สถานะการจอง
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">รออนุมัติ</option>
            <option value="inprogress">กำลังดำเนินการ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สถานะการชำระ
          </label>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">รอชำระ</option>
            <option value="deposit_paid">จ่ายมัดจำแล้ว</option>
            <option value="fully_paid">จ่ายครบแล้ว</option>
            <option value="cancelled">ยกเลิกชำระ</option>
          </select>
        </div>

        {/* Seller Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seller
          </label>
          <select
            value={sellerFilter}
            onChange={(e) => setSellerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">ทั้งหมด</option>
            <option value="none">ไม่มี Seller</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.full_name || seller.email}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ช่วงเวลา
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">ทั้งหมด</option>
            <option value="today">วันนี้</option>
            <option value="week">7 วันที่แล้ว</option>
            <option value="month">30 วันที่แล้ว</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          ใช้ตัวกรองเพื่อค้นหาการจองที่ต้องการ
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          รีเฟรช
        </button>
      </div>
    </div>
  )
}
