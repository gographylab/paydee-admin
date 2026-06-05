import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Customer {
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
    trip_schedule_id: string | null
    created_at: string | null
    trips?: {
      title: string
    } | null
  }[]
}

export function useCustomersAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const supabase = createClient()

  const calculateStats = () => {
    const totalCustomers = customers.length
    const totalBookings = customers.reduce((sum, c) => sum + (c.bookings?.length || 0), 0)
    const pendingBookings = customers.reduce((sum, c) => sum + (c.bookings?.filter((b: any) => b.status === 'pending').length || 0), 0)
    const approvedBookings = customers.reduce((sum, c) => sum + (c.bookings?.filter((b: any) => b.status === 'approved').length || 0), 0)
    const inprogressBookings = customers.reduce((sum, c) => sum + (c.bookings?.filter((b: any) => b.status === 'inprogress').length || 0), 0)
    const rejectedBookings = customers.reduce((sum, c) => sum + (c.bookings?.filter((b: any) => b.status === 'rejected').length || 0), 0)
    const cancelledBookings = customers.reduce((sum, c) => sum + (c.bookings?.filter((b: any) => b.status === 'cancelled').length || 0), 0)
    
    // คำนวณสถิติเพิ่มเติม
    const customersWithBookings = customers.filter(c => c.bookings && c.bookings.length > 0).length
    const avgBookingsPerCustomer = totalCustomers > 0 ? Math.round((totalBookings / totalCustomers) * 10) / 10 : 0
    
    return { 
      totalCustomers, 
      totalBookings, 
      pendingBookings, 
      approvedBookings,
      inprogressBookings,
      rejectedBookings,
      cancelledBookings,
      customersWithBookings,
      avgBookingsPerCustomer
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          bookings (
            id,
            status,
            total_amount,
            trip_schedule_id,
            created_at,
            trip_schedules (
              trips (
                title
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Flatten the nested data
      const formattedCustomers = data.map(customer => ({
        ...customer,
        bookings: customer.bookings?.map(booking => ({
          ...booking,
          trips: booking.trip_schedules?.trips
        }))
      }))

      setCustomers(formattedCustomers)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId)
    try {
      console.log('Updating booking:', bookingId, 'to status:', newStatus)
      
      // Try using API route
      const response = await fetch('/api/admin/bookings/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status: newStatus
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update booking status')
      }

      const result = await response.json()
      console.log('Update successful:', result)
      
      // Refresh customer data
      await fetchCustomers()
      
      // Show success message
      console.log(`อัปเดตสถานะการจองเป็น "${newStatus}" เรียบร้อยแล้ว`)
      
    } catch (error: any) {
      console.error('Error updating booking status:', error)
      
      // Fallback: try direct supabase update
      try {
        console.log('Trying direct supabase update...')
        const { data, error: supabaseError } = await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', bookingId)
          .select()

        if (supabaseError) {
          throw supabaseError
        }

        console.log('Direct supabase update successful:', data)
        await fetchCustomers()
        
      } catch (fallbackError: any) {
        console.error('Fallback update also failed:', fallbackError)
        
        // Show user-friendly error message
        const errorMessage = fallbackError?.message || error?.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
        toast.error(`เกิดข้อผิดพลาด: ${errorMessage}`)
      }
      
    } finally {
      setUpdatingStatus(null)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  return {
    customers: filteredCustomers,
    loading,
    searchTerm,
    setSearchTerm,
    updatingStatus,
    updateBookingStatus,
    calculateStats,
    refetch: fetchCustomers
  }
}
