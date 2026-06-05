'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { FiX, FiCheck, FiCreditCard, FiUser, FiDollarSign } from 'react-icons/fi'

interface BankAccount {
  id: string
  bank_name: string
  account_number: string
  account_name: string
  branch: string | null
  is_primary: boolean
}

interface Seller {
  id: string
  full_name: string | null
  email: string | null
  referral_code: string | null
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  seller: Seller
  commissionAmount: number
  bookingId: string
  paymentType: 'partial' | 'full'
  onPaymentComplete: () => void
}

export default function PaymentModal({
  isOpen,
  onClose,
  seller,
  commissionAmount,
  bookingId,
  paymentType,
  onPaymentComplete
}: PaymentModalProps) {
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const fetchBankAccount = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('seller_id', seller.id)
        .eq('is_primary', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      setBankAccount(data)
    } catch (err: any) {
      setError('ไม่สามารถดึงข้อมูลบัญชีธนาคารได้')
      console.error('Error fetching bank account:', err)
    } finally {
      setLoading(false)
    }
  }, [seller.id, supabase])

  // Fetch bank account when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBankAccount()
    }
  }, [isOpen, fetchBankAccount])

  const handlePayment = async () => {
    try {
      setPaying(true)
      setError('')

      // Call admin API endpoint instead of direct database update
      const response = await fetch(`/api/admin/commission-payments/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentType
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถอัปเดตสถานะการจ่ายเงินได้')
      }

      onPaymentComplete()
      onClose()
    } catch (err: any) {
      setError('ไม่สามารถอัพเดทสถานะการจ่ายเงินได้: ' + err.message)
    } finally {
      setPaying(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">จ่ายค่าคอมมิชชั่น</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FiUser className="w-5 h-5 mr-2" />
                ข้อมูล Seller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">ชื่อ:</span>
                <span className="font-medium">{seller.full_name || 'ไม่ระบุ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">อีเมล:</span>
                <span className="font-medium">{seller.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">รหัสแนะนำ:</span>
                <span className="font-medium">{seller.referral_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-medium">{seller.id.slice(-8)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Commission Amount */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FiDollarSign className="w-5 h-5 mr-2" />
                จำนวนเงินค่าคอมมิชชั่น
                <Badge variant="outline" className="ml-2">
                  {paymentType === 'partial' ? 'ครึ่งแรก (50%)' : 'ครึ่งหลัง (50%)'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ฿{commissionAmount.toLocaleString()}
                </div>
                <p className="text-gray-500 text-sm mt-1">บาท</p>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FiCreditCard className="w-5 h-5 mr-2" />
                ข้อมูลบัญชีธนาคาร
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 text-sm mt-2">กำลังโหลดข้อมูลบัญชี...</p>
                </div>
              ) : bankAccount ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ธนาคาร:</span>
                    <span className="font-medium">{bankAccount.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">เลขที่บัญชี:</span>
                    <span className="font-medium">{bankAccount.account_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ชื่อบัญชี:</span>
                    <span className="font-medium">{bankAccount.account_name}</span>
                  </div>
                  {bankAccount.branch && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">สาขา:</span>
                      <span className="font-medium">{bankAccount.branch}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FiX className="w-12 h-12 text-red-400 mx-auto mb-2" />
                  <p className="text-red-600 font-medium">ไม่พบข้อมูลบัญชีธนาคาร</p>
                  <p className="text-gray-500 text-sm">Seller ยังไม่ได้เพิ่มข้อมูลบัญชีธนาคาร</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={paying}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!bankAccount || paying}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {paying ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังดำเนินการ...
                </div>
              ) : (
                <div className="flex items-center">
                  <FiCheck className="w-4 h-4 mr-2" />
                  ยืนยันการจ่ายเงิน
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}