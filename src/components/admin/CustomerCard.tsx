import StatusBadge from '../ui/StatusBadge'
import StatusSelector from '../ui/StatusSelector'
import { formatDate, formatPrice } from '@/utils/bookingUtils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Mail, Phone, Calendar, UserCheck } from 'lucide-react'

interface CustomerCardProps {
  customer: {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    created_at: string | null
    referred_by_code: string | null
    bookings?: {
      id: string
      status: string | null
      total_amount: number
      created_at: string | null
      trips?: {
        title: string
      } | null
    }[]
  }
  onStatusUpdate: (bookingId: string, newStatus: string) => void
  updatingStatus: string | null
}

export default function CustomerCard({ 
  customer, 
  onStatusUpdate, 
  updatingStatus 
}: CustomerCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{customer.full_name}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>เข้าร่วม {customer.created_at && formatDate(customer.created_at)}</span>
                </div>
                {customer.referred_by_code && (
                  <Badge variant="secondary" className="text-xs">
                    <UserCheck className="w-3 h-3 mr-1" />
                    แนะนำโดย: {customer.referred_by_code}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">ข้อมูลติดต่อ</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{customer.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Bookings Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">การจองทริป</h4>
            {customer.bookings && customer.bookings.length > 0 ? (
              <div className="space-y-3">
                {customer.bookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 text-sm">{booking.trips?.title}</h5>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                          <span>{booking.created_at && formatDate(booking.created_at)}</span>
                          <span className="font-medium text-gray-700">{formatPrice(booking.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Management */}
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">สถานะ:</span>
                        <StatusBadge status={booking.status} />
                      </div>
                      
                      {/* Status Selector */}
                      <StatusSelector
                        currentStatus={booking.status}
                        bookingId={booking.id}
                        onStatusChange={onStatusUpdate}
                        isLoading={updatingStatus === booking.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm font-medium">ยังไม่มีการจอง</p>
                <p className="text-muted-foreground/70 text-xs">รอลูกค้าจองทริป</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
