'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
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

interface DashboardLayoutProps {
  children: React.ReactNode
  initialProfile: UserProfile
}

export default function DashboardLayout({ children, initialProfile }: DashboardLayoutProps) {
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
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar initialProfile={currentProfile} />

      {/* Main Content */}
      <main className="flex-1 w-full md:py-6  md:px-6 lg:px-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userProfile={currentProfile} />

    </div>
  )
}