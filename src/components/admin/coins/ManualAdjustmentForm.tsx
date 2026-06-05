'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CoinsIcon, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Seller {
  id: string
  full_name: string | null
  email: string | null
}

export function ManualAdjustmentForm() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSeller, setSelectedSeller] = useState('')
  const [amount, setAmount] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add')
  const [description, setDescription] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchSellers()
  }, [])

  const fetchSellers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('role', 'seller')
        .eq('status', 'approved')
        .order('full_name')

      if (error) throw error
      setSellers(data || [])
    } catch (err: any) {
      console.error('Error fetching sellers:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const coinAmount = parseFloat(amount)

    if (!coinAmount || coinAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!selectedSeller) {
      setError('Please select a seller')
      return
    }

    if (!description.trim()) {
      setError('Please provide a description')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/coins/manual-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: selectedSeller,
          amount: adjustmentType === 'add' ? coinAmount : -coinAmount,
          description: description.trim(),
          reason: reason.trim() || undefined
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to adjust coins')

      setSuccess(true)

      // Reset form
      setSelectedSeller('')
      setAmount('')
      setDescription('')
      setReason('')
      setAdjustmentType('add')

      setTimeout(() => setSuccess(false), 5000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Manual Coin Adjustment</h2>
        <p className="text-muted-foreground">
          Manually add or deduct coins from seller accounts
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Adjust Seller Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seller Selection */}
            <div className="space-y-2">
              <Label htmlFor="seller">Seller *</Label>
              <Select value={selectedSeller} onValueChange={setSelectedSeller} required>
                <SelectTrigger id="seller">
                  <SelectValue placeholder="Select a seller" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.full_name || seller.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>Adjustment Type *</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={adjustmentType === 'add' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('add')}
                  className="w-full"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Add Coins
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === 'deduct' ? 'destructive' : 'outline'}
                  onClick={() => setAdjustmentType('deduct')}
                  className="w-full"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Deduct Coins
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter coin amount"
                required
              />
              {amount && parseFloat(amount) > 0 && (
                <p className="text-sm text-muted-foreground">
                  {adjustmentType === 'add' ? 'Adding' : 'Deducting'} {parseFloat(amount).toLocaleString()} coins
                  {adjustmentType === 'add' ? ' to' : ' from'} seller account
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Bonus for excellent performance in Q1"
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be visible to the seller in their transaction history
              </p>
            </div>

            {/* Internal Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Internal Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Internal notes for admin reference only"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                This is for internal admin use only and won't be shown to the seller
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                <AlertDescription className="text-green-600 dark:text-green-500">
                  Coins adjusted successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !selectedSeller || !amount || !description}
              className="w-full"
              size="lg"
            >
              <CoinsIcon className="h-5 w-5 mr-2" />
              {loading ? 'Processing...' : `${adjustmentType === 'add' ? 'Add' : 'Deduct'} Coins`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Warning */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Manual adjustments will be logged in the seller's transaction history.
          This action cannot be undone, so please verify all details before submitting.
        </AlertDescription>
      </Alert>
    </div>
  )
}
