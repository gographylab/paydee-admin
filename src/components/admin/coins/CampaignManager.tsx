'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  GiftIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  AlertCircle,
  TrendingUp,
  Lock,
  Unlock,
  Award
} from 'lucide-react'
import { format } from 'date-fns'
import { LoadingSystem } from '@/components/ui'

interface GamificationCampaign {
  id: string
  title: string
  description: string | null

  // Condition 1
  condition_1_type: string
  condition_1_reward_amount: number
  condition_1_reward_type: 'earning' | 'redeemable'

  // Condition 2
  condition_2_type: string
  condition_2_action: 'unlock' | 'bonus' | 'none'
  condition_2_bonus_amount: number

  start_date: string
  end_date: string
  is_active: boolean
  target_audience: string
  created_at: string

  // Stats (from API)
  total_participants?: number
  total_completed?: number
}

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<GamificationCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<GamificationCampaign | null>(null)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    condition_1_type: 'survey',
    condition_1_reward_amount: 100,
    condition_1_reward_type: 'earning' as 'earning' | 'redeemable',
    condition_2_type: 'first_trip_sold',
    condition_2_action: 'unlock' as 'unlock' | 'bonus' | 'none',
    condition_2_bonus_amount: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    target_audience: 'all'
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/gamification/campaigns')
      if (!response.ok) throw new Error('Failed to fetch campaigns')

      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/admin/gamification/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create campaign')
      }

      setShowCreateModal(false)
      resetForm()
      fetchCampaigns()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return

    setError('')

    try {
      const response = await fetch(`/api/admin/gamification/campaigns/${editingCampaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update campaign')
      }

      setEditingCampaign(null)
      resetForm()
      fetchCampaigns()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const response = await fetch(`/api/admin/gamification/campaigns/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete campaign')

      fetchCampaigns()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const toggleCampaign = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/gamification/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (!response.ok) throw new Error('Failed to update campaign')

      fetchCampaigns()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      condition_1_type: 'survey',
      condition_1_reward_amount: 100,
      condition_1_reward_type: 'earning',
      condition_2_type: 'first_trip_sold',
      condition_2_action: 'unlock',
      condition_2_bonus_amount: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      target_audience: 'all'
    })
  }

  const openEditModal = (campaign: GamificationCampaign) => {
    setFormData({
      title: campaign.title,
      description: campaign.description || '',
      condition_1_type: campaign.condition_1_type,
      condition_1_reward_amount: campaign.condition_1_reward_amount,
      condition_1_reward_type: campaign.condition_1_reward_type,
      condition_2_type: campaign.condition_2_type,
      condition_2_action: campaign.condition_2_action,
      condition_2_bonus_amount: campaign.condition_2_bonus_amount,
      start_date: campaign.start_date.split('T')[0],
      end_date: campaign.end_date.split('T')[0],
      target_audience: campaign.target_audience
    })
    setEditingCampaign(campaign)
  }

  if (loading) return <LoadingSystem />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gamification Campaigns</h2>
          <p className="text-muted-foreground">Create 2-condition challenges with earning/redeemable coins</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Campaigns List */}
      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GiftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700">No campaigns yet</p>
              <p className="text-sm text-muted-foreground">Create your first gamification campaign</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id} className={campaign.is_active ? 'border-green-200' : 'border-gray-200'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{campaign.title}</CardTitle>
                      <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                        {campaign.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditModal(campaign)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleCampaign(campaign.id, campaign.is_active)}
                    >
                      {campaign.is_active ? (
                        <ToggleRightIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeftIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                    >
                      <TrashIcon className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Condition 1 */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold text-sm">Condition 1: {campaign.condition_1_type}</span>
                    </div>
                    <Badge variant="outline" className={
                      campaign.condition_1_reward_type === 'earning'
                        ? 'border-amber-400 text-amber-700'
                        : 'border-green-400 text-green-700'
                    }>
                      +{campaign.condition_1_reward_amount} {campaign.condition_1_reward_type}
                    </Badge>
                  </div>
                </div>

                {/* Condition 2 */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {campaign.condition_2_action === 'unlock' ? (
                        <Unlock className="h-4 w-4 text-blue-600" />
                      ) : campaign.condition_2_action === 'bonus' ? (
                        <Award className="h-4 w-4 text-pink-600" />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="font-semibold text-sm">Condition 2: {campaign.condition_2_type}</span>
                    </div>
                    {campaign.condition_2_action === 'unlock' && (
                      <Badge variant="outline" className="border-blue-400 text-blue-700">
                        Unlock Coins
                      </Badge>
                    )}
                    {campaign.condition_2_action === 'bonus' && (
                      <Badge variant="outline" className="border-pink-400 text-pink-700">
                        +{campaign.condition_2_bonus_amount} Bonus
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats & Dates */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div>
                    <span>
                      {format(new Date(campaign.start_date), 'MMM d, yyyy')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                    </span>
                    <span className="mx-2">•</span>
                    <span>Target: {campaign.target_audience}</span>
                  </div>
                  {(campaign.total_participants || campaign.total_completed) && (
                    <span className="font-semibold text-gray-700">
                      {campaign.total_completed || 0}/{campaign.total_participants || 0} completed
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || !!editingCampaign} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false)
          setEditingCampaign(null)
          resetForm()
          setError('')
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl">{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
            <DialogDescription className="text-base">
              Set up a 2-condition gamification campaign with earning or redeemable coins
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editingCampaign ? handleUpdateCampaign : handleCreateCampaign} className="space-y-5 pt-2">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">Campaign Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Welcome Bonus - Test"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the campaign and what sellers need to do to earn rewards..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Condition 1 Section */}
            <div className="p-4 bg-amber-50/50 border-2 border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">Condition 1: Task to Complete</h3>
                  <p className="text-xs text-gray-600">Define what sellers need to do to earn coins</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Task Type</Label>
                  <Select
                    value={formData.condition_1_type}
                    onValueChange={(value) => setFormData({ ...formData, condition_1_type: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="survey">Survey</SelectItem>
                      <SelectItem value="onboarding_task">Onboarding Task</SelectItem>
                      <SelectItem value="profile_complete">Complete Profile</SelectItem>
                      <SelectItem value="referral">Refer Friend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reward Amount</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={formData.condition_1_reward_amount}
                    onChange={(e) => setFormData({ ...formData, condition_1_reward_amount: parseFloat(e.target.value) })}
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Coin Type</Label>
                  <Select
                    value={formData.condition_1_reward_type}
                    onValueChange={(value: 'earning' | 'redeemable') =>
                      setFormData({ ...formData, condition_1_reward_type: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="earning">Earning Coins</SelectItem>
                      <SelectItem value="redeemable">Redeemable Coins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Condition 2 Section */}
            <div className="p-4 bg-blue-50/50 border-2 border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Unlock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">Condition 2: Unlock Trigger</h3>
                  <p className="text-xs text-gray-600">Define when the coins become available or bonus is applied</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Trigger Type</Label>
                  <Select
                    value={formData.condition_2_type}
                    onValueChange={(value) => setFormData({ ...formData, condition_2_type: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_trip_sold">First Trip Sold</SelectItem>
                      <SelectItem value="trip_count">Trip Count</SelectItem>
                      <SelectItem value="sales_amount">Sales Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Action</Label>
                  <Select
                    value={formData.condition_2_action}
                    onValueChange={(value: 'unlock' | 'bonus' | 'none') =>
                      setFormData({ ...formData, condition_2_action: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlock">Unlock Coins</SelectItem>
                      <SelectItem value="bonus">Give Bonus</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.condition_2_action === 'bonus' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Bonus Amount</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={formData.condition_2_bonus_amount}
                      onChange={(e) => setFormData({ ...formData, condition_2_bonus_amount: parseFloat(e.target.value) })}
                      className="h-10"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Dates & Targeting Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Campaign Duration & Audience</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-medium">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-sm font-medium">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Target Audience</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sellers</SelectItem>
                      <SelectItem value="new_sellers">New Sellers</SelectItem>
                      <SelectItem value="specific_sellers">Specific Sellers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="pt-4 border-t gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingCampaign(null)
                  resetForm()
                  setError('')
                }}
                className="h-10 px-6"
              >
                Cancel
              </Button>
              <Button type="submit" className="h-10 px-6">
                {editingCampaign ? 'Update' : 'Create'} Campaign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
