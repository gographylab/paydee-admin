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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BanknoteIcon, CheckCircle, XCircle, Clock, AlertCircle, CoinsIcon, ChevronDown, Check, Building2, User, Calendar, ArrowUpRight, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { LoadingSystem } from '@/components/ui'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

interface Redemption {
  id: string
  seller_id: string
  coin_amount: number
  cash_amount: number
  conversion_rate: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  requested_at: string
  approved_at: string | null
  paid_at: string | null
  rejection_reason: string | null
  notes: string | null
  seller: {
    id: string
    full_name: string | null
    email: string | null
  } | null
  bank_account: {
    bank_name: string
    account_number: string
    account_name: string
  }
  approver: {
    full_name: string | null
    email: string | null
  } | null
}

export function RedemptionRequests() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRedemptions()
  }, [statusFilter])

  const stats = {
    pending: redemptions.filter(r => r.status === 'pending').length,
    approved: redemptions.filter(r => r.status === 'approved').length,
    totalPending: redemptions.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.cash_amount, 0),
  }

  const fetchRedemptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/coins/redemptions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch redemptions')

      const data = await response.json()
      setRedemptions(data.redemptions)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openActionModal = (redemption: Redemption) => {
    setSelectedRedemption(redemption)
    setShowActionModal(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: {
        variant: 'secondary',
        icon: Clock,
        className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800'
      },
      approved: {
        variant: 'default',
        icon: CheckCircle,
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
      },
      rejected: {
        variant: 'destructive',
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
      },
      paid: {
        variant: 'outline',
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
      }
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={`capitalize ${config.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  if (loading) return <LoadingSystem />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Redemption Requests</h2>
            <p className="text-muted-foreground mt-1">Review and process coin redemption requests</p>
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="outline" className="w-full sm:w-[200px] justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>{statusFilter === 'all' ? 'All statuses' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] bg-white dark:bg-gray-950 rounded-md shadow-lg border border-gray-200 dark:border-gray-800 p-1 z-50"
                sideOffset={5}
              >
                {[
                  { value: 'all', label: 'All statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'paid', label: 'Paid' },
                ].map((status) => (
                  <DropdownMenu.Item
                    key={status.value}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    onSelect={() => setStatusFilter(status.value)}
                  >
                    <Check className={`mr-2 h-4 w-4 ${statusFilter === status.value ? 'opacity-100' : 'opacity-0'}`} />
                    {status.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-white dark:from-orange-950/20 dark:to-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">{stats.pending}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg flex items-center justify-center">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Awaiting Payment</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{stats.approved}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/20 dark:to-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Pending (THB)</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">฿{stats.totalPending.toLocaleString()}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg flex items-center justify-center">
                  <BanknoteIcon className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Redemptions List */}
      <div className="space-y-4">
        {redemptions.map((redemption) => (
          <Card key={redemption.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200 dark:hover:border-blue-800">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left Section - Seller Info & Details */}
                <div className="flex-1 space-y-5">
                  {/* Seller Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 shadow-md flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                          {redemption.seller?.full_name || redemption.seller?.email || 'Unknown Seller'}
                        </h3>
                        {redemption.seller?.full_name && redemption.seller?.email && (
                          <p className="text-sm text-muted-foreground">{redemption.seller?.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="lg:hidden">
                      {getStatusBadge(redemption.status)}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Coins */}
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-xl border border-yellow-200 dark:border-yellow-900 shadow-sm">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 shadow flex items-center justify-center flex-shrink-0">
                        <CoinsIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Coins</p>
                        <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                          {redemption.coin_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Cash */}
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-900 shadow-sm">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow flex items-center justify-center flex-shrink-0">
                        <BanknoteIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Cash</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          ฿{redemption.cash_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Bank */}
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-500 to-slate-600 shadow flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Bank</p>
                        <p className="font-bold text-sm truncate text-gray-900 dark:text-gray-100">{redemption.bank_account.bank_name}</p>
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {redemption.bank_account.account_number}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 shadow flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Requested</p>
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                          {format(new Date(redemption.requested_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {format(new Date(redemption.requested_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {redemption.rejection_reason && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Rejection reason:</span> {redemption.rejection_reason}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Right Section - Status & Action */}
                <div className="flex lg:flex-col items-center gap-4 lg:min-w-[160px]">
                  <div className="hidden lg:block">
                    {getStatusBadge(redemption.status)}
                  </div>
                  {redemption.status === 'pending' && (
                    <Button
                      onClick={() => openActionModal(redemption)}
                      className="w-full lg:w-full gap-2 shadow-md hover:shadow-lg transition-shadow"
                      size="lg"
                    >
                      Review
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  )}
                  {redemption.status === 'approved' && (
                    <Button
                      onClick={() => openActionModal(redemption)}
                      variant="outline"
                      className="w-full lg:w-full gap-2 border-2 shadow-md hover:shadow-lg transition-shadow"
                      size="lg"
                    >
                      Mark as Paid
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {redemptions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <BanknoteIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">No redemption requests</h3>
                <p className="text-muted-foreground text-sm">
                  {statusFilter === 'all'
                    ? 'There are no redemption requests at the moment'
                    : `No ${statusFilter} redemption requests found`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Modal */}
      {showActionModal && selectedRedemption && (
        <ActionModal
          redemption={selectedRedemption}
          onClose={() => {
            setShowActionModal(false)
            setSelectedRedemption(null)
          }}
          onSuccess={() => {
            setShowActionModal(false)
            setSelectedRedemption(null)
            fetchRedemptions()
          }}
        />
      )}
    </div>
  )
}

function ActionModal({
  redemption,
  onClose,
  onSuccess
}: {
  redemption: Redemption
  onClose: () => void
  onSuccess: () => void
}) {
  const [action, setAction] = useState<'approve' | 'reject' | 'paid'>('approve')
  const [rejectionReason, setRejectionReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (action === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/coins/redemptions/${redemption.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'paid',
          rejection_reason: action === 'reject' ? rejectionReason : undefined,
          notes: notes || undefined
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update redemption')

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isPending = redemption.status === 'pending'

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-white dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle className="text-xl">Process Redemption Request</DialogTitle>
          <DialogDescription>
            Review and take action on this coin redemption request
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Redemption Details */}
          <div className="space-y-3">
            {/* Seller Info */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seller</p>
                <p className="font-semibold">{redemption.seller?.full_name || redemption.seller?.email || 'Unknown Seller'}</p>
                {redemption.seller?.full_name && redemption.seller?.email && (
                  <p className="text-xs text-muted-foreground">{redemption.seller?.email}</p>
                )}
              </div>
            </div>

            {/* Amount Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900">
                <div className="flex items-center gap-2 mb-2">
                  <CoinsIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                  <p className="text-xs font-medium text-muted-foreground">Coins</p>
                </div>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                  {redemption.coin_amount.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
                <div className="flex items-center gap-2 mb-2">
                  <BanknoteIcon className="h-4 w-4 text-green-600 dark:text-green-500" />
                  <p className="text-xs font-medium text-muted-foreground">Cash (THB)</p>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  ฿{redemption.cash_amount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Bank Details */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Bank Account</p>
                  <p className="font-semibold">{redemption.bank_account.bank_name}</p>
                  <p className="text-sm text-muted-foreground">{redemption.bank_account.account_number}</p>
                  <p className="text-sm text-muted-foreground">{redemption.bank_account.account_name}</p>
                </div>
              </div>
            </div>
          </div>

          {isPending ? (
            <>
              {/* Action Selection */}
              <div className="space-y-2">
                <Label>Action *</Label>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {action === 'approve' ? 'Approve' : 'Reject'}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="w-[--radix-dropdown-menu-trigger-width] bg-white dark:bg-gray-950 rounded-md shadow-lg border border-gray-200 dark:border-gray-800 p-1 z-50"
                      sideOffset={5}
                    >
                      {[
                        { value: 'approve', label: 'Approve' },
                        { value: 'reject', label: 'Reject' }
                      ].map((actionOption) => (
                        <DropdownMenu.Item
                          key={actionOption.value}
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                          onSelect={() => setAction(actionOption.value as 'approve' | 'reject')}
                        >
                          <Check className={`mr-2 h-4 w-4 ${action === actionOption.value ? 'opacity-100' : 'opacity-0'}`} />
                          {actionOption.label}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>

              {/* Rejection Reason */}
              {action === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejection_reason">Rejection Reason *</Label>
                  <Textarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label>Action</Label>
              <p className="text-sm text-muted-foreground">
                Mark this approved redemption as paid
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : isPending ? (action === 'approve' ? 'Approve' : 'Reject') : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
