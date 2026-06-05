'use client'

import { useState, useEffect } from 'react'
import MobileBottomNav from '@/components/MobileBottomNav'
import { useBackgroundSync } from '@/hooks/useBackgroundSync'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface DashboardMobileLayoutProps {
  children: React.ReactNode
  initialProfile: UserProfile
}

export default function DashboardMobileLayout({ children, initialProfile }: DashboardMobileLayoutProps) {
  const [currentProfile, setCurrentProfile] = useState(initialProfile)

  // Enable background sync for sellers to detect admin updates
  useBackgroundSync({
    enabled: true,
    interval: 30000, // เช็คทุก 30 วินาที
    userRole: initialProfile?.role
  })

  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('DashboardMobileLayout: Profile updated, refreshing layout...')
      // Force a page refresh to get the latest data from server
      setTimeout(() => {
        window.location.reload()
      }, 1000) // Wait 1 second for database to update
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [])

  return (
    <div className="flex flex-col  bg-gray-50 ">
      {/* Main Content - Mobile optimized */}
      <main className="flex-1 w-full">
        <div className="min-h-full pb-20">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Fixed positioning */}
      <div className="relative">
        <MobileBottomNav userProfile={currentProfile} />
      </div>

      {/* Mobile-specific modals or overlays can be added here */}
      {/* Note: ProfileCompletionModal is currently desktop-only */}
    </div>
  )
}