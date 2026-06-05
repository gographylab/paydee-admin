'use client'

import { Suspense } from 'react'

function AdminStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Simple stats component
function AdminStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Sellers</h3>
        <p className="text-2xl font-bold text-gray-900">--</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Trips</h3>
        <p className="text-2xl font-bold text-gray-900">--</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
        <p className="text-2xl font-bold text-gray-900">--</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
        <p className="text-2xl font-bold text-gray-900">--</p>
      </div>
    </div>
  )
}

// Simple recent activity component
function AdminRecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <p className="text-sm text-gray-600">No recent activity</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">ภาพรวมการจัดการระบบ</p>
      </div>

      <Suspense fallback={<AdminStatsSkeleton />}>
        <AdminStats />
      </Suspense>

      <Suspense fallback={<div className="bg-white rounded-lg shadow p-6 animate-pulse h-96"></div>}>
        <AdminRecentActivity />
      </Suspense>
    </div>
  )
}