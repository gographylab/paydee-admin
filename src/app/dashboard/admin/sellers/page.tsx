'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import SellerDetailsModal from '@/components/SellerDetailsModal'
import SellerStats from './components/SellerStats'
import SellerFilters from './components/SellerFilters'
import { MdOutlineMail } from "react-icons/md";
import { IoCallOutline } from "react-icons/io5";
import { LuTag } from "react-icons/lu";
import { toast } from 'sonner';

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: 'pending' | 'approved' | 'rejected' | null
  commission_goal: number | null
  referral_code: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string | null
  updated_at: string | null
  email: string | null // Email from auth.users via RPC
  id_card_url: string | null
  avatar_url: string | null
  document_url: string | null
  documents_urls: string[] | null
  id_card_uploaded_at: string | null
  avatar_uploaded_at: string | null
  document_uploaded_at: string | null
}

export default function SellersManagement() {
  const [sellers, setSellers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [error, setError] = useState('')

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [registrationStartDate, setRegistrationStartDate] = useState('')
  const [registrationEndDate, setRegistrationEndDate] = useState('')
  const [approvalStartDate, setApprovalStartDate] = useState('')
  const [approvalEndDate, setApprovalEndDate] = useState('')
  const [profileCompletenessFilter, setProfileCompletenessFilter] = useState<'all' | 'complete' | 'incomplete'>('all')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // Statistics state
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvalRate: 0
  })

  // Modal states
  const [selectedSeller, setSelectedSeller] = useState<UserProfile | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when filters change
      fetchSellers()
    }, 300) // Debounce 300ms

    return () => clearTimeout(timer)
  }, [filter, searchTerm, registrationStartDate, registrationEndDate, approvalStartDate, approvalEndDate, itemsPerPage, profileCompletenessFilter])

  // Fetch when page changes
  useEffect(() => {
    fetchSellers()
  }, [currentPage])

  const fetchSellers = async () => {
    try {
      setLoading(true)
      setError('')

      // Build query parameters
      const params = new URLSearchParams()
      params.append('status', filter)
      params.append('limit', itemsPerPage.toString())
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString())
      if (searchTerm) params.append('search', searchTerm)
      if (registrationStartDate) params.append('registrationStartDate', registrationStartDate)
      if (registrationEndDate) params.append('registrationEndDate', registrationEndDate)
      if (approvalStartDate) params.append('approvalStartDate', approvalStartDate)
      if (approvalEndDate) params.append('approvalEndDate', approvalEndDate)

      // Use API route instead of RPC
      const response = await fetch(`/api/admin/sellers?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล')
        return
      }

      let filteredSellers = result.data || []

      // Client-side filter for profile completeness (only for pending status)
      if (filter === 'pending' && profileCompletenessFilter !== 'all') {
        filteredSellers = filteredSellers.filter((seller: UserProfile) => {
          const isComplete = seller.full_name && seller.phone
          return profileCompletenessFilter === 'complete' ? isComplete : !isComplete
        })
      }

      setSellers(filteredSellers)
      setStatistics(result.statistics || statistics)
      setTotalItems(result.pagination?.total || 0)
    } catch (err) {
      console.error('Fetch Error:', err)
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setRegistrationStartDate('')
    setRegistrationEndDate('')
    setApprovalStartDate('')
    setApprovalEndDate('')
    setProfileCompletenessFilter('all')
    setCurrentPage(1)
  }

  // Reset profile completeness filter when switching tabs
  useEffect(() => {
    setProfileCompletenessFilter('all')
  }, [filter])

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Calculate filtered statistics for display
  const getFilteredStatistics = () => {
    if (filter === 'pending' && profileCompletenessFilter !== 'all') {
      const filteredCount = sellers.length
      return {
        ...statistics,
        pending: filteredCount
      }
    }
    return statistics
  }

  const displayStatistics = getFilteredStatistics()

  const handleStatusChange = async (sellerId: string, newStatus: 'approved' | 'rejected') => {
    setActionLoading(sellerId)
    setError('')

    try {
      // Check if seller has complete profile before approving
      if (newStatus === 'approved') {
        const seller = sellers.find(s => s.id === sellerId)
        if (!seller?.full_name || !seller?.phone) {
          setError('ไม่สามารถอนุมัติได้: Seller ยังกรอกข้อมูลไม่ครบถ้วน (ชื่อ-นามสกุล และเบอร์โทรศัพท์)')
          setActionLoading(null)
          return
        }
      }

      // Use API route instead of direct Supabase call
      const response = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          reason: `Admin updated status to ${newStatus}`
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ')
      } else {
        // Refresh the list
        await fetchSellers()
        
        // Show success message
        toast.success(`${newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} seller สำเร็จ`)
      }
    } catch (err: any) {
      console.error('Status update error:', err)
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ API')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-primary-yellow',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    
    const statusText = {
      pending: 'รอการอนุมัติ',
      approved: 'อนุมัติแล้ว',
      rejected: 'ถูกปฏิเสธ'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    )
  }

  const openDetailsModal = (seller: UserProfile) => {
    setSelectedSeller(seller)
    setIsDetailsModalOpen(true)
  }

  const closeDetailsModal = () => {
    setSelectedSeller(null)
    setIsDetailsModalOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">จัดการ Sellers</h1>
        <p className="mt-1 text-sm text-gray-500">
          จัดการและอนุมัติ seller ที่สมัครเข้าระบบ
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Statistics Dashboard */}
      <SellerStats statistics={statistics} />

      {/* Filters */}
      <SellerFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        registrationStartDate={registrationStartDate}
        setRegistrationStartDate={setRegistrationStartDate}
        registrationEndDate={registrationEndDate}
        setRegistrationEndDate={setRegistrationEndDate}
        approvalStartDate={approvalStartDate}
        setApprovalStartDate={setApprovalStartDate}
        approvalEndDate={approvalEndDate}
        setApprovalEndDate={setApprovalEndDate}
        onRefresh={fetchSellers}
        onClearFilters={handleClearFilters}
        loading={loading}
        resultCount={sellers.length}
      />

      {/* Filter tabs */}
      <div className="flex items-center justify-between">
        <nav className="flex space-x-8">
          {[
            { key: 'all', label: 'ทั้งหมด', count: displayStatistics.total },
            { key: 'pending', label: 'รอการอนุมัติ', count: displayStatistics.pending },
            { key: 'approved', label: 'อนุมัติแล้ว', count: displayStatistics.approved },
            { key: 'rejected', label: 'ถูกปฏิเสธ', count: displayStatistics.rejected }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
                filter === tab.key
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>

        {/* Profile Completeness Filter - Only show for pending tab */}
        {filter === 'pending' && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue"
            >
              <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {profileCompletenessFilter === 'all' && 'ทั้งหมด'}
              {profileCompletenessFilter === 'complete' && 'ข้อมูลครบ'}
              {profileCompletenessFilter === 'incomplete' && 'ข้อมูลไม่ครบ'}
              <svg className="ml-2 h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <>
                {/* Overlay to close dropdown when clicking outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />

                <div className="absolute right-0 z-20 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu">
                    <button
                      onClick={() => {
                        setProfileCompletenessFilter('all')
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                        profileCompletenessFilter === 'all'
                          ? 'bg-primary-blue text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => {
                        setProfileCompletenessFilter('complete')
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                        profileCompletenessFilter === 'complete'
                          ? 'bg-primary-blue text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="mr-3 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      ข้อมูลครบถ้วน
                    </button>
                    <button
                      onClick={() => {
                        setProfileCompletenessFilter('incomplete')
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                        profileCompletenessFilter === 'incomplete'
                          ? 'bg-primary-blue text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="mr-3 h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      ข้อมูลไม่ครบถ้วน
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sellers List */}
      {loading ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mb-4"></div>
            <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {sellers.length > 0 ? (
            <ul className="divide-y divide-gray-200">
            {sellers.map((seller) => {
              const isProfileComplete = seller.full_name && seller.phone
              const canApprove = isProfileComplete && seller.status === 'pending'
              
              return (
              <li key={seller.id}>
                <div className={`px-4 py-4 sm:px-6 ${!isProfileComplete ? 'bg-gray-50 border-l-4 border-primary-yellow' : ''}`}>
                  {!isProfileComplete && (
                    <div className="mb-3 flex items-center">
                      <svg className="h-5 w-5 text-primary-yellow mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-primary-yellow font-medium">
                        ข้อมูลไม่ครบถ้วน - ไม่สามารถอนุมัติได้
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className={`text-sm font-medium truncate ${isProfileComplete ? 'text-primary-blue' : 'text-gray-500'}`}>
                          {seller.full_name || 'ยังไม่กรอกชื่อ'}
                        </p>
                        <div className="ml-4">
                          {seller.status && getStatusBadge(seller.status)}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                        <div className={`flex items-center text-sm ${seller.email ? 'text-gray-500' : 'text-primary-yellow'}`}>
                         <MdOutlineMail className='mr-2 text-xl text-gray-400'/>
                          {seller.email || 'ไม่มีอีเมล'}
                        </div>
                        <div className={`flex items-center text-sm ${seller.phone ? 'text-gray-500' : 'text-primary-yellow'}`}>
                          <IoCallOutline className='mr-2 text-xl text-gray-400'/>
                          {seller.phone || 'ยังไม่กรอกเบอร์โทร'}
                        </div>
                        {seller.referral_code && (
                          <div className="flex items-center text-sm text-gray-500">
                            <LuTag className='mr-2 text-xl text-gray-400'/>
                            Referral: {seller.referral_code}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        สมัครเมื่อ: {seller.created_at ? new Date(seller.created_at).toLocaleDateString('th-TH') : 'ไม่มีข้อมูล'}
                        {seller.approved_at && (
                          <span className="ml-4">
                            {seller.status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}เมื่อ: {new Date(seller.approved_at).toLocaleDateString('th-TH')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex space-x-2">
                      {/* Details button - always visible */}
                      <button
                        onClick={() => openDetailsModal(seller)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        ดูรายละเอียด
                      </button>

                      {seller.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(seller.id, 'approved')}
                            disabled={!canApprove || actionLoading === seller.id}
                            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              canApprove 
                                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                : 'bg-gray-400 cursor-not-allowed'
                            }`}
                            title={!canApprove ? 'ต้องกรอกข้อมูลครบก่อนอนุมัติ' : 'อนุมัติ seller'}
                          >
                            {actionLoading === seller.id ? (
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleStatusChange(seller.id, 'rejected')}
                            disabled={actionLoading === seller.id}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === seller.id ? (
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            ปฏิเสธ
                          </button>
                        </>
                      )}
                      {seller.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(seller.id, 'rejected')}
                          disabled={actionLoading === seller.id}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ปฏิเสธ
                        </button>
                      )}
                      {seller.status === 'rejected' && (
                        <button
                          onClick={() => handleStatusChange(seller.id, 'approved')}
                          disabled={!canApprove || actionLoading === seller.id}
                          className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                            canApprove 
                              ? 'text-gray-700 bg-white hover:bg-gray-50'
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          อนุมัติ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
              )
            })}
          </ul>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มี Seller</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'ยังไม่มี seller ที่สมัครสมาชิก' : `ไม่มี seller ที่มีสถานะ ${filter}`}
            </p>
          </div>
        )}
        </div>
      )}

      {/* Pagination */}
      {!loading && sellers.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-700">
                แสดง <span className="font-medium">{startItem}</span> ถึง <span className="font-medium">{endItem}</span> จาก{' '}
                <span className="font-medium">{totalItems}</span> รายการ
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                  แสดงต่อหน้า:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="border-gray-300 rounded-md text-sm focus:ring-primary-blue focus:border-primary-blue"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNumber
                          ? 'z-10 bg-primary-blue border-primary-blue text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Seller Details Modal */}
      <SellerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        seller={selectedSeller}
      />
    </div>
  )
}
