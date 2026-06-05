'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Preload and warm up routes for instant navigation
export default function InstantNavigator() {
  const router = useRouter()
  
  useEffect(() => {
    // Force clear any stale cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister())
      })
    }
    
    // Aggressive route prefetching
    const routes = [
      '/dashboard/admin',
      '/dashboard/admin/sellers',
      '/dashboard/admin/trips',
      '/dashboard/admin/bookings',
      '/dashboard/admin/customers',
      '/dashboard/admin/coins',
      '/dashboard/admin/partners'
    ]
    
    // Immediate prefetch without delay
    routes.forEach(route => {
      router.prefetch(route)
    })
    
    // Also prefetch on hover/focus events for instant feel
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href^="/dashboard"]')
      if (link instanceof HTMLAnchorElement) {
        const href = link.getAttribute('href')
        if (href) {
          router.prefetch(href)
        }
      }
    }
    
    // Add hover prefetching
    document.addEventListener('mouseenter', handleMouseEnter, true)
    
    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true)
    }
  }, [router])
  
  return null
}