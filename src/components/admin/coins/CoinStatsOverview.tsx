'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CoinsIcon, TrendingUp, TrendingDown, Users, GiftIcon, AlertCircle } from 'lucide-react'
import { LoadingSystem, ErrorSystem } from '@/components/ui'

interface CoinStats {
  total_distributed: number
  total_redeemed: number
  current_balance: number
  total_earning_balance: number
  total_redeemable_balance: number
  pending_redemptions: {
    count: number
    coins: number
    cash: number
  }
  approved_redemptions: {
    count: number
    coins: number
    cash: number
  }
  active_campaigns: number
  sellers_with_coins: number
}

export function CoinStatsOverview() {
  const [stats, setStats] = useState<CoinStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/coins/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSystem />
  if (error) return <ErrorSystem message={error} />
  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Clean Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earning Balance */}
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">Earning</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Earning Coins</h3>
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-bold text-gray-900">
                {(stats.total_earning_balance || 0).toLocaleString()}
              </p>
              <span className="text-sm font-medium text-gray-500">coins</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">รอปลดล็อกในระบบ</p>
          </div>
        </div>

        {/* Total Redeemable Balance */}
        <div className="bg-white rounded-lg shadow-sm border border-green-200 hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CoinsIcon className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">Redeemable</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Redeemable Coins</h3>
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-bold text-gray-900">
                {(stats.total_redeemable_balance || 0).toLocaleString()}
              </p>
              <span className="text-sm font-medium text-gray-500">coins</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">พร้อมแลกได้</p>
          </div>
        </div>

        {/* Total Redeemed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingDown className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">Redeemed</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Redeemed</h3>
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-bold text-gray-900">
                {stats.total_redeemed.toLocaleString()}
              </p>
              <span className="text-sm font-medium text-gray-500">coins</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">แลกเป็นเงินสดแล้ว</p>
          </div>
        </div>

        {/* Active Sellers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">Sellers</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Sellers</h3>
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-bold text-gray-900">
                {stats.sellers_with_coins.toLocaleString()}
              </p>
              <span className="text-sm font-medium text-gray-500">คน</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">ผู้ขายที่มี Coins</p>
          </div>
        </div>
      </div>

      {/* Clean Redemption Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Redemptions */}
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Pending Redemptions</h3>
                <p className="text-xs text-gray-500">รอการอนุมัติ</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">คำขอทั้งหมด</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {stats.pending_redemptions.count}
                </span>
                <span className="text-sm text-gray-500">คำขอ</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Coins</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.pending_redemptions.coins.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Cash (฿)</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.pending_redemptions.cash.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Approved Redemptions */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CoinsIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Approved Redemptions</h3>
                <p className="text-xs text-gray-500">รอการจ่ายเงิน</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">คำขอที่อนุมัติ</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {stats.approved_redemptions.count}
                </span>
                <span className="text-sm text-gray-500">คำขอ</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Coins</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.approved_redemptions.coins.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Cash (฿)</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.approved_redemptions.cash.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Active Campaigns */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 rounded-lg">
                <GiftIcon className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active Campaigns</h3>
                <p className="text-sm text-gray-500">แคมเปญที่กำลังดำเนินการ</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1.5">
                <p className="text-4xl font-bold text-gray-900">
                  {stats.active_campaigns}
                </p>
                <span className="text-lg font-medium text-gray-500">แคมเปญ</span>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded mt-1 inline-block">Currently Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
