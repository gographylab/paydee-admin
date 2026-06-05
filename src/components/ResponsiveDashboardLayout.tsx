'use client'

import { useState, useEffect } from 'react'
import DashboardMobileLayout from '@/components/DashboardMobileLayout'
import DashboardDesktopLayout from '@/components/DashboardDesktopLayout'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode
  initialProfile: UserProfile
}

export default function ResponsiveDashboardLayout({ children, initialProfile }: ResponsiveDashboardLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Show loading or fallback during SSR
  if (!isClient) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 w-full flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  // Render appropriate layout based on screen size
  if (isMobile) {
    return (
      <DashboardMobileLayout initialProfile={initialProfile}>
        {children}
      </DashboardMobileLayout>
    )
  }

  return (
    <DashboardDesktopLayout initialProfile={initialProfile}>
      {children}
    </DashboardDesktopLayout>
  )
}