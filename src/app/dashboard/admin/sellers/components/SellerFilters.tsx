'use client'

import { useState } from 'react'

interface SellerFiltersProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  registrationStartDate: string
  setRegistrationStartDate: (value: string) => void
  registrationEndDate: string
  setRegistrationEndDate: (value: string) => void
  approvalStartDate: string
  setApprovalStartDate: (value: string) => void
  approvalEndDate: string
  setApprovalEndDate: (value: string) => void
  onRefresh: () => void
  onClearFilters: () => void
  loading: boolean
  resultCount?: number
}

export default function SellerFilters({
  searchTerm,
  setSearchTerm,
  registrationStartDate,
  setRegistrationStartDate,
  registrationEndDate,
  setRegistrationEndDate,
  approvalStartDate,
  setApprovalStartDate,
  approvalEndDate,
  setApprovalEndDate,
  onRefresh,
  onClearFilters,
  loading,
  resultCount
}: SellerFiltersProps) {
  const hasActiveFilters = searchTerm || registrationStartDate || registrationEndDate || approvalStartDate || approvalEndDate

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="space-y-4">
        {/* Search Bar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ค้นหา Seller
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="ชื่อ, อีเมล, รหัสแนะนำ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && resultCount !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              พบ {resultCount} รายการ
            </p>
          )}
        </div>

        {/* Date Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Registration Date Range */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              วันที่สมัคร
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="date"
                  value={registrationStartDate}
                  onChange={(e) => setRegistrationStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="จาก"
                />
                <p className="text-xs text-gray-500 mt-1">จาก</p>
              </div>
              <div>
                <input
                  type="date"
                  value={registrationEndDate}
                  onChange={(e) => setRegistrationEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="ถึง"
                />
                <p className="text-xs text-gray-500 mt-1">ถึง</p>
              </div>
            </div>
          </div>

          {/* Approval Date Range */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              วันที่อนุมัติ
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="date"
                  value={approvalStartDate}
                  onChange={(e) => setApprovalStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="จาก"
                />
                <p className="text-xs text-gray-500 mt-1">จาก</p>
              </div>
              <div>
                <input
                  type="date"
                  value={approvalEndDate}
                  onChange={(e) => setApprovalEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="ถึง"
                />
                <p className="text-xs text-gray-500 mt-1">ถึง</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ใช้ฟิลเตอร์อยู่
                </span>
              </div>
              <button
                onClick={onClearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                ล้างฟิลเตอร์ทั้งหมด
              </button>
            </>
          )}
          {!hasActiveFilters && (
            <div className="text-sm text-gray-500">
              ใช้ฟิลเตอร์เพื่อค้นหา seller ที่ต้องการ
            </div>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
