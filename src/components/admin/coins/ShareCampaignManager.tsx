'use client'

import { useState, useEffect, useCallback } from 'react'
import { Share2, Plus, MousePointerClick, Coins, Users, TrendingUp, Trophy, Loader2, X } from 'lucide-react'

interface ShareStats {
  summary: {
    total_clicks: number
    total_coins_awarded: number
    unique_sellers: number
    unique_trips: number
  }
  top_sellers: {
    seller_id: string
    full_name: string
    clicks: number
    coins_earned: number
  }[]
  campaigns: {
    id: string
    title: string
    target_trip_id: string | null
    coin_amount: number
    conditions: Record<string, unknown> | null
    start_date: string
    end_date: string
    is_active: boolean
  }[]
}

interface Trip {
  id: string
  title: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ShareCampaignManager() {
  const [stats, setStats] = useState<ShareStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/share/stats')
      const data = await res.json()
      if (!data.error) setStats(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!stats) {
    return <p className="text-center text-gray-500 py-8">ไม่สามารถโหลดข้อมูลได้</p>
  }

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: MousePointerClick, label: 'Total Clicks', value: stats.summary.total_clicks, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Coins, label: 'Coins Awarded', value: stats.summary.total_coins_awarded, color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: Users, label: 'Active Sellers', value: stats.summary.unique_sellers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: TrendingUp, label: 'Trips Shared', value: stats.summary.unique_trips, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Top sellers */}
      {stats.top_sellers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Top Sharers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">#</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Seller</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Clicks</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Coins Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.top_sellers.map((seller, i) => (
                  <tr key={seller.seller_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{seller.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right tabular-nums">{seller.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-amber-600 text-right tabular-nums">{seller.coins_earned.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Share Campaigns</h3>
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              // Fetch trips for the form
              fetch('/api/admin/trips?pageSize=100')
                .then(res => res.json())
                .then(data => setTrips(data.trips || []))
                .catch(() => {})
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>

        {stats.campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Share2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-medium">No share campaigns yet</p>
            <p className="text-sm text-gray-400 mt-1">Create one to incentivize sellers to share trips</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.campaigns.map(campaign => (
              <div key={campaign.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(campaign.start_date)} — {formatDate(campaign.end_date)}
                    </p>
                    {campaign.conditions && (() => {
                      const conds = campaign.conditions as Record<string, unknown>
                      return (
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          {conds.coins_per_click != null && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{String(conds.coins_per_click)} coin/click</span>
                          )}
                          {conds.max_coins_per_seller != null && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Max: {String(conds.max_coins_per_seller)}</span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${campaign.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {campaign.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create campaign modal */}
      {showForm && (
        <CreateShareCampaignModal
          trips={trips}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            fetchStats()
          }}
        />
      )}
    </div>
  )
}

// ─── Create Campaign Modal ──────────────────────────────────────────────────

function CreateShareCampaignModal({
  trips,
  onClose,
  onCreated,
}: {
  trips: Trip[]
  onClose: () => void
  onCreated: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    target_trip_id: '',
    coins_per_click: 1,
    milestone_bonuses: '{"50": 20, "100": 50, "500": 200}',
    max_coins_per_seller: 1000,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let milestones = {}
      try {
        milestones = JSON.parse(form.milestone_bonuses)
      } catch {
        alert('Invalid milestone JSON format')
        setSaving(false)
        return
      }

      const res = await fetch('/api/admin/coins/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          campaign_type: 'share_clicks',
          coin_amount: form.coins_per_click,
          target_trip_id: form.target_trip_id || null,
          start_date: new Date(form.start_date).toISOString(),
          end_date: new Date(form.end_date).toISOString(),
          conditions: {
            coins_per_click: form.coins_per_click,
            milestone_bonuses: milestones,
            max_coins_per_seller: form.max_coins_per_seller,
          },
        }),
      })

      if (res.ok) {
        onCreated()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create campaign')
      }
    } catch {
      alert('Error creating campaign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Create Share Campaign</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Share & Earn: Japan Trips"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Trip (optional)</label>
            <select
              value={form.target_trip_id}
              onChange={e => setForm(f => ({ ...f, target_trip_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All trips (no specific target)</option>
              {trips.map(trip => (
                <option key={trip.id} value={trip.id}>{trip.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coins per Click *</label>
              <input
                type="number"
                required
                min={1}
                value={form.coins_per_click}
                onChange={e => setForm(f => ({ ...f, coins_per_click: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Coins/Seller *</label>
              <input
                type="number"
                required
                min={1}
                value={form.max_coins_per_seller}
                onChange={e => setForm(f => ({ ...f, max_coins_per_seller: parseInt(e.target.value) || 1000 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Bonuses (JSON)</label>
            <textarea
              value={form.milestone_bonuses}
              onChange={e => setForm(f => ({ ...f, milestone_bonuses: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder='{"50": 20, "100": 50}'
            />
            <p className="text-xs text-gray-400 mt-1">Format: {`{"clicks": bonus_coins}`}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
