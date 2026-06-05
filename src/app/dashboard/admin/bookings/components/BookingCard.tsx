import { useState, useEffect } from 'react'
import { Tables } from '../../../../../../database.types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import PaymentModal from '@/components/admin/PaymentModal'
import { 
  Edit, 
  Phone, 
  PlaneTakeoff, 
  PlaneLanding, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle,
  Mail,
  User,
  MapPin,
  Trash2
} from 'lucide-react'

interface BookingWithDetails extends Tables<'bookings'> {
  customers?: {
    full_name: string
    email: string
    phone: string | null
    id_card: string | null
    passport_number: string | null
  }
  trip_schedules?: {
    departure_date: string
    return_date: string
    registration_deadline: string
    available_seats: number
    trips?: {
      title: string
      price_per_person: number
      commission_type: string | null
      commission_value: number
      countries?: {
        name: string
        flag_emoji: string | null
      }
    }
  }
  seller?: {
    id: string
    full_name: string | null
    email: string | null
    referral_code: string | null
    avatar_url: string | null
  }
  commission_payments?: {
    id: string
    payment_type: string
    amount: number
    status: string | null
    paid_at: string | null
  }[]
}

interface Seller {
  id: string
  full_name: string | null
  email: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface BookingCardProps {
  booking: BookingWithDetails
  onStatusUpdate: (bookingId: string, status: string) => Promise<void>
  onPaymentStatusUpdate: (bookingId: string, paymentStatus: string) => Promise<void>
  onSellerUpdate?: (bookingId: string) => Promise<void>
  onRefresh?: (bookingId: string) => Promise<void>
  onDelete?: (bookingId: string) => Promise<void>
  sellers: Seller[]
}

export default function BookingCard({ booking, onStatusUpdate, onPaymentStatusUpdate, onSellerUpdate, onRefresh, onDelete, sellers }: BookingCardProps) {
  const [updating, setUpdating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [editingSeller, setEditingSeller] = useState(false)
  const [selectedSellerId, setSelectedSellerId] = useState(booking.seller_id || '')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [commissionAmount, setCommissionAmount] = useState(0)
  const [paymentType, setPaymentType] = useState<'partial' | 'full'>('partial')

  // Update selectedSellerId when booking.seller_id changes
  useEffect(() => {
    setSelectedSellerId(booking.seller_id || '')
  }, [booking.seller_id])

  // Use commission payments from booking data instead of fetching separately
  const commissionPayments = booking.commission_payments || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate commission amount
  const calculateCommission = (paymentType: 'partial' | 'full') => {
    if (!booking.trip_schedules?.trips) return 0
    
    const trip = booking.trip_schedules.trips
    const totalAmount = booking.total_amount
    let commissionRate = 0
    
    if (trip.commission_type === 'percentage') {
      commissionRate = trip.commission_value / 100
    } else {
      // Fixed amount commission
      return paymentType === 'partial' ? trip.commission_value * 0.5 : trip.commission_value * 0.5
    }
    
    const totalCommission = totalAmount * commissionRate
    return paymentType === 'partial' ? totalCommission * 0.5 : totalCommission * 0.5
  }

  const getStatusBadge = (status: string | null) => {
    const statusConfig = {
      pending: { label: 'รออนุมัติ', variant: 'secondary' as const },
      inprogress: { label: 'กำลังดำเนินการ', variant: 'default' as const },
      approved: { label: 'อนุมัติแล้ว', variant: 'default' as const },
      rejected: { label: 'ปฏิเสธ', variant: 'destructive' as const },
      cancelled: { label: 'ยกเลิก', variant: 'outline' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant={config.variant} className={cn(
        status === 'approved' && 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50/80',
        status === 'pending' && 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50/80',
        status === 'inprogress' && 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50/80'
      )}>
        {config.label}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (paymentStatus: string | null) => {
    const statusConfig = {
      pending: { label: 'รอชำระ', variant: 'secondary' as const, icon: Clock },
      partial: { label: 'จ่ายมัดจำแล้ว', variant: 'default' as const, icon: DollarSign },
      completed: { label: 'จ่ายครบแล้ว', variant: 'default' as const, icon: CheckCircle },
      refunded: { label: 'ยกเลิก ', variant: 'destructive' as const, icon: XCircle }
    }

    const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className={cn(
        'gap-1.5',
        paymentStatus === 'pending' && 'bg-primary-yellow-light text-primary-yellow border-secondary-yellow hover:bg-primary-yellow-light',
        paymentStatus === 'partial' && 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50/80',
        paymentStatus === 'completed' && 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50/80',
        paymentStatus === 'refunded' && 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50/80'
      )}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getCommissionStatusBadge = (status: string | null) => {
    const statusConfig = {
      pending: { label: 'รอจ่าย', variant: 'secondary' as const },
      paid: { label: 'จ่ายแล้ว', variant: 'default' as const },
      cancelled: { label: 'ยกเลิก', variant: 'destructive' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant={config.variant} className={cn(
        'text-xs',
        status === 'pending' && 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50/80',
        status === 'paid' && 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50/80'
      )}>
        {config.label}
      </Badge>
    )
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      await onStatusUpdate(booking.id, newStatus)
      toast.success('อัพเดทสถานะการจองสำเร็จ')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะการจอง')
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentStatusChange = async (newPaymentStatus: string) => {
    // Check if this update requires commission payment and seller exists
    if ((newPaymentStatus === 'partial' || newPaymentStatus === 'completed') && booking.seller) {
      const type = newPaymentStatus === 'partial' ? 'partial' : 'full'
      const amount = calculateCommission(type)
      
      setPaymentType(type)
      setCommissionAmount(amount)
      setShowPaymentModal(true)
      return
    }

    // Regular payment status update without commission
    setUpdating(true)
    try {
      await onPaymentStatusUpdate(booking.id, newPaymentStatus)
      toast.success('อัพเดทสถานะการชำระเงินสำเร็จ')
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะการชำระเงิน')
    } finally {
      setUpdating(false)
    }
  }

  const handleSellerUpdate = async () => {
    try {
      const response = await fetch('/api/admin/bookings/update-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          sellerId: selectedSellerId || null,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update seller')
      }

      setEditingSeller(false)
      toast.success('อัพเดท Seller สำเร็จ')
      
      // Use callback to update state instead of full page reload
      if (onSellerUpdate) {
        await onSellerUpdate(booking.id)
      } else {
        // Fallback to page reload if callback not provided
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating seller:', error)
      toast.error('เกิดข้อผิดพลาดในการอัพเดท Seller')
    }
  }

  const trip = booking.trip_schedules?.trips
  const customer = booking.customers
  const seller = booking.seller

  return (
    <>
      <Card className="transition-colors hover:shadow-md">
      <CardHeader className="pb-4">
        {/* Trip Title and Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-gray-900">
              {trip?.title || 'ไม่พบข้อมูลทริป'}
            </h3>
            {trip?.countries?.flag_emoji && (
              <span className="text-base">{trip.countries.flag_emoji}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(booking.status)}
            {getPaymentStatusBadge(booking.payment_status)}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(booking.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="ลบการจอง"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Customer Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              ลูกค้า
            </h4>
            <div>
              <p className="font-medium text-gray-900">{customer?.full_name || 'ไม่พบข้อมูล'}</p>
              <p className="text-sm text-gray-600">{customer?.email || 'ไม่ระบุ'}</p>
              {customer?.phone && (
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </p>
              )}
            </div>
          </div>

          {/* Trip Schedule */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h4 className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              กำหนดการ
            </h4>
            {booking.trip_schedules && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <PlaneTakeoff className="w-4 h-4 text-green-600" />
                  <span className="font-medium">วันเดินทาง:</span> 
                  {new Date(booking.trip_schedules.departure_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <PlaneLanding className="w-4 h-4 text-green-600" />
                  <span className="font-medium">วันกลับ:</span> 
                  {new Date(booking.trip_schedules.return_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  จองเมื่อ: {booking.created_at ? new Date(booking.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ'}
                </p>
              </div>
            )}
          </div>

          {/* Price Info */}
          <div className="p-4 bg-primary-yellow-light rounded-lg border border-secondary-yellow">
            <h4 className="text-sm font-medium text-primary-yellow mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              ยอดเงิน
            </h4>
            <div className="space-y-1">
              <p className="text-xl font-semibold text-gray-900">฿{booking.total_amount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">คอมมิชชั่น: ฿{booking.commission_amount.toLocaleString()}</p>
              {booking.deposit_amount && (
                <p className="text-sm text-blue-600">มัดจำ: ฿{booking.deposit_amount.toLocaleString()}</p>
              )}
              {booking.remaining_amount && (
                <p className="text-sm text-primary-yellow">คงเหลือ: ฿{booking.remaining_amount.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seller Section */}
        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {seller?.avatar_url ? (
                <img 
                  src={seller.avatar_url} 
                  alt={seller.full_name || 'Seller'}
                  className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="h-8 w-8 bg-purple-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-purple-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Seller
                </p>
                {seller ? (
                  <p className="text-sm text-gray-900 font-medium">
                    {seller.id.slice(-5)} - {seller.full_name || seller.email}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">ไม่มี Seller</p>
                )}
              </div>
            </div>
            <Button
              onClick={() => setEditingSeller(!editingSeller)}
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
            >
              <Edit className="w-4 h-4 mr-1" />
              แก้ไข
            </Button>
          </div>

          {/* Edit Seller */}
          {editingSeller && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              <h4 className="text-sm font-medium text-purple-900 mb-3">แก้ไข Seller</h4>
              <div className="flex items-center gap-3">
                <Select value={selectedSellerId || ""} onValueChange={(value) => setSelectedSellerId(value)}>
                  <SelectTrigger className="flex-1 bg-white border-gray-300">
                    <SelectValue placeholder="เลือก Seller" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id} className="hover:bg-gray-50">
                        {seller.id.slice(-5)} - {seller.full_name || seller.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSellerUpdate} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  บันทึก
                </Button>
                <Button
                  onClick={() => {
                    setEditingSeller(false)
                    setSelectedSellerId(booking.seller_id || '')
                  }}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Commission Flow Info */}
        {seller && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <h4 className="font-medium text-gray-900 text-base flex items-center mb-3">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              💰 การจ่ายค่าคอมมิชชั่น
            </h4>
            {commissionPayments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {commissionPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.payment_type === 'partial_commission' ? 'ค่าคอมมิชชั่นครึ่งแรก (50%)' : 
                         payment.payment_type === 'final_commission' ? 'ค่าคอมมิชชั่นครึ่งหลัง (50%)' : 
                         payment.payment_type === 'direct' ? 'ค่าคอมมิชชั่นโดยตรง' : 
                         payment.payment_type === 'referral' ? 'ค่าคอมมิชชั่นแนะนำ' : 
                         'ค่าคอมมิชชั่น (' + payment.payment_type + ')'}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">฿{payment.amount.toLocaleString()}</p>
                      {payment.paid_at && (
                        <p className="text-xs text-gray-500">จ่ายเมื่อ: {new Date(payment.paid_at).toLocaleDateString('th-TH')}</p>
                      )}
                    </div>
                    <div>
                      {getCommissionStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">ยังไม่มีการจ่ายค่าคอมมิชชั่น</p>
                <p className="text-xs text-gray-400 mt-1">
                  ค่าคอมมิชชั่นจะถูกสร้างเมื่อลูกค้าชำระเงิน
                </p>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Actions */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">การจัดการสถานะ</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment Status Control */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">สถานะการชำระ:</p>
              <Select 
                value={booking.payment_status || 'pending'}
                onValueChange={handlePaymentStatusChange}
                disabled={updating}
              >
                <SelectTrigger className="w-full bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg z-50">
                  <SelectItem value="pending" className="hover:bg-gray-50">รอชำระ</SelectItem>
                  <SelectItem value="partial" className="hover:bg-gray-50">จ่ายมัดจำแล้ว</SelectItem>
                  <SelectItem value="completed" className="hover:bg-gray-50">จ่ายครบแล้ว</SelectItem>
                  <SelectItem value="refunded" className="hover:bg-gray-50">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Booking Status Control */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">สถานะการจอง:</p>
              <div className="flex items-center gap-2">
                <Select 
                  value={booking.status || 'pending'}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger className="flex-1 bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg z-50">
                    <SelectItem value="pending" className="hover:bg-gray-50">รออนุมัติ</SelectItem>
                    <SelectItem value="inprogress" className="hover:bg-gray-50">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="approved" className="hover:bg-gray-50">อนุมัติแล้ว</SelectItem>
                    <SelectItem value="rejected" className="hover:bg-gray-50">ปฏิเสธ</SelectItem>
                    <SelectItem value="cancelled" className="hover:bg-gray-50">ยกเลิก</SelectItem>
                  </SelectContent>
                </Select>

                {updating && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Payment Modal - only render if seller exists */}
    {booking.seller && (
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        seller={booking.seller}
        commissionAmount={commissionAmount}
        bookingId={booking.id}
        paymentType={paymentType}
        onPaymentComplete={async () => {
          console.log('Payment completed, refreshing booking data...')
          // Call parent refresh function to reload data
          if (onRefresh) {
            await onRefresh(booking.id)
          }
          // Also trigger a state update
          setShowPaymentModal(false)
          toast.success('บันทึกการจ่ายค่าคอมมิชชั่นเรียบร้อยแล้ว')
        }}
      />
    )}
    </>
  )
}
