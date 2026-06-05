'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
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

interface DashboardDesktopLayoutProps {
  children: React.ReactNode
  initialProfile: UserProfile
}

export default function DashboardDesktopLayout({ children, initialProfile }: DashboardDesktopLayoutProps) {
  const [currentProfile, setCurrentProfile] = useState(initialProfile)

  // Enable background sync for sellers to detect admin updates
  useBackgroundSync({
    enabled: true,
    interval: 30000, // เช็คทุก 30 วินาที
    userRole: initialProfile?.role
  })

  useEffect(() => {
    const handleProfileUpdate = () => {
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [])

  return (
    <div className="flex h-screen ">
      {/* Desktop Sidebar */}
      <Sidebar initialProfile={currentProfile} />

      {/* Main Content - Desktop optimized */}
      <main className="flex-1 w-full py-6 px-6 lg:px-8 ml-80">
        {children}
      </main>

    </div>
  )
}