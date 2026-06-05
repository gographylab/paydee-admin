'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminRoutePrefetcherProps {
  userRole?: string | null
}

// Prefetch admin routes for better performance
export default function AdminRoutePrefetcher({ userRole }: AdminRoutePrefetcherProps) {
  const router = useRouter()
  
  useEffect(() => {
    if (userRole === 'admin') {
      // Prefetch common admin routes immediately  
      const adminRoutes = [
        '/dashboard/admin',
        '/dashboard/admin/sellers', 
        '/dashboard/admin/trips',
        '/dashboard/admin/bookings',
        '/dashboard/admin/customers'
      ]
      
      // Immediate prefetch without any delay
      adminRoutes.forEach(route => {
        router.prefetch(route)
      })
      
      // Also prefetch API routes that admin pages use
      const apiRoutes = [
        '/api/admin/trips',
        '/api/admin/sellers', 
        '/api/admin/bookings'
      ]
      
      // Prefetch API routes after a short delay
      setTimeout(() => {
        apiRoutes.forEach(route => {
          fetch(route, { method: 'HEAD' }).catch(() => {})
        })
      }, 50)
      
    } else if (userRole === 'seller') {
      // Prefetch seller routes immediately
      const sellerRoutes = [
        '/dashboard',
        '/dashboard/trips',
        '/dashboard/reports'
      ]
      
      // Immediate prefetch without delay
      sellerRoutes.forEach(route => {
        router.prefetch(route)
      })
    }
  }, [userRole, router])
  
  return null
}