'use client'

import { useState } from 'react'

interface SellerDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  seller: {
    id: string
    full_name: string | null
    phone: string | null
    email: string | null
    status: string | null
    referral_code: string | null
    created_at: string | null
    approved_at: string | null
    id_card_url: string | null
    avatar_url: string | null
    document_url: string | null
    documents_urls: string[] | null
    id_card_uploaded_at: string | null
    avatar_uploaded_at: string | null
    document_uploaded_at: string | null
  } | null
}

export default function SellerDetailsModal({ isOpen, onClose, seller }: SellerDetailsModalProps) {
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null)

  if (!isOpen || !seller) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'ไม่มีข้อมูล'
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอการอนุมัติ'
      case 'approved': return 'อนุมัติแล้ว'
      case 'rejected': return 'ถูกปฏิเสธ'
      default: return 'ไม่ทราบสถานะ'
    }
  }

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                รายละเอียด Seller
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                ID: {seller.id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  ข้อมูลส่วนตัว
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">สถานะ</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(seller.status || '')}`}>
                        {getStatusText(seller.status || '')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">ชื่อ-นามสกุล</label>
                    <p className="text-gray-900 mt-1">{seller.full_name || 'ไม่มีข้อมูล'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">อีเมล</label>
                    <p className="text-gray-900 mt-1">{seller.email || 'ไม่มีข้อมูล'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">เบอร์โทรศัพท์</label>
                    <p className="text-gray-900 mt-1">{seller.phone || 'ไม่มีข้อมูล'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">รหัสแนะนำ (Referral Code)</label>
                    <p className="text-gray-900 mt-1 font-mono text-lg">
                      {seller.referral_code || 'ไม่มีข้อมูล'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  ประวัติการสมัคร
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">วันที่สมัคร</label>
                    <p className="text-gray-900 mt-1">{formatDate(seller.created_at)}</p>
                  </div>

                  {seller.approved_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        วันที่{seller.status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}
                      </label>
                      <p className="text-gray-900 mt-1">{formatDate(seller.approved_at)}</p>
                    </div>
                  )}

                  {seller.id_card_uploaded_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">อัปโหลดบัตรประชาชน</label>
                      <p className="text-gray-900 mt-1">{formatDate(seller.id_card_uploaded_at)}</p>
                    </div>
                  )}

                  {seller.avatar_uploaded_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">อัปโหลดรูปโปรไฟล์</label>
                      <p className="text-gray-900 mt-1">{formatDate(seller.avatar_uploaded_at)}</p>
                    </div>
                  )}

                  {seller.document_uploaded_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">อัปโหลดเอกสาร</label>
                      <p className="text-gray-900 mt-1">{formatDate(seller.document_uploaded_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Files Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                ไฟล์และเอกสาร
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ID Card */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">บัตรประชาชน</label>
                  {seller.id_card_url ? (
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setActiveImageModal(seller.id_card_url)}
                    >
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 aspect-[3/2]">
                        <img
                          src={seller.id_card_url}
                          alt="ID Card"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center pointer-events-none">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-sm mt-2">ไม่มีไฟล์</p>
                    </div>
                  )}
                </div>

                {/* Profile Image */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">รูปโปรไฟล์</label>
                  {seller.avatar_url ? (
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setActiveImageModal(seller.avatar_url)}
                    >
                      <div className="border-2 border-gray-200 rounded-full overflow-hidden bg-gray-50 aspect-square">
                        <img
                          src={seller.avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-full flex items-center justify-center pointer-events-none">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-full aspect-square flex items-center justify-center">
                      <div className="text-center">
                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-gray-500 text-xs mt-1">ไม่มีรูป</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">เอกสารประกอบ</label>
                  <div className="space-y-2">
                    {seller.document_url && (
                      <a 
                        href={seller.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="h-8 w-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">เอกสาร PDF</p>
                          <p className="text-xs text-gray-500">คลิกเพื่อดูเอกสาร</p>
                        </div>
                        <svg className="h-4 w-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}

                    {seller.documents_urls && seller.documents_urls.length > 0 && 
                      seller.documents_urls.map((docUrl, index) => (
                        <a 
                          key={index}
                          href={docUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-8 w-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">เอกสาร {index + 1}</p>
                            <p className="text-xs text-gray-500">คลิกเพื่อดูเอกสาร</p>
                          </div>
                          <svg className="h-4 w-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))
                    }

                    {!seller.document_url && (!seller.documents_urls || seller.documents_urls.length === 0) && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 text-xs mt-2">ไม่มีเอกสาร</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {activeImageModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60]"
          onClick={() => setActiveImageModal(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={activeImageModal}
              alt="Enlarged view"
              className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  )
}
