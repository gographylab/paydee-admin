'use client'

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { LayoutGrid, PlaneTakeoff, Users, UserCircle, LogOut, CoinsIcon, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import SidebarButton from '@/components/ui/SidebarButton'
import AdminRoutePrefetcher from '@/components/AdminRoutePrefetcher'
import Image from 'next/image'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface NavigationItem {
  icon: React.ReactElement
  label: string
  href: string
  isActive: boolean
}

interface SidebarProps {
  className?: string
  initialProfile?: UserProfile
}

const Sidebar = memo(function Sidebar({ className, initialProfile }: SidebarProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile || null)
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, role, status, referral_code, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }, [supabase])

  useEffect(() => {
    if (!initialProfile) {
      fetchUserProfile()
    }
  }, [initialProfile, fetchUserProfile])

  const handleLogout = useCallback(async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
    setLoading(false)
  }, [supabase, router])

  const isDashboardActive = useMemo(() =>
    pathname === '/dashboard/admin', [pathname]
  )

  const isTripsActive = useMemo(() =>
    pathname.includes('/dashboard/admin/trips') && pathname !== '/dashboard/admin/trips/create',
    [pathname]
  )

  // Admin navigation items
  const navigationItems: NavigationItem[] = useMemo(() => [
    {
      icon: <LayoutGrid size={18} />,
      label: 'Dashboard',
      href: '/dashboard/admin',
      isActive: isDashboardActive
    },
    {
      icon: <PlaneTakeoff size={18} />,
      label: 'จัดการทริป',
      href: '/dashboard/admin/trips',
      isActive: isTripsActive
    },
    {
      icon: <Building2 size={18} />,
      label: 'Partners',
      href: '/dashboard/admin/partners',
      isActive: pathname.includes('/dashboard/admin/partners')
    },
    {
      icon: <Users size={18} />,
      label: 'ผู้ขาย',
      href: '/dashboard/admin/sellers',
      isActive: pathname === '/dashboard/admin/sellers'
    },
    {
      icon: <Users size={18} />,
      label: 'การจอง',
      href: '/dashboard/admin/bookings',
      isActive: pathname === '/dashboard/admin/bookings'
    },
    {
      icon: <Users size={18} />,
      label: 'ลูกค้า',
      href: '/dashboard/admin/customers',
      isActive: pathname === '/dashboard/admin/customers'
    },
    {
      icon: <CoinsIcon size={18} />,
      label: 'Coins Management',
      href: '/dashboard/admin/coins',
      isActive: pathname === '/dashboard/admin/coins'
    }
  ], [pathname, isDashboardActive, isTripsActive])

  if (!userProfile) {
    return (
      <div className={`hidden md:flex h-screen w-80 bg-white shadow-lg flex-col ${className || ''}`}>
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`hidden md:flex fixed left-0 top-0 h-screen w-80 bg-white shadow-lg flex-col z-20 ${className || ''}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <a
            href="/dashboard/admin"
            className="flex items-center gap-3 group"
          >
            <Image
              src="/images/paydeeLOGO.svg"
              alt="Paydee"
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xl text-gray-600 truncate">Admin Panel</p>
            </div>
          </a>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-gray-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {userProfile.full_name || 'Admin User'}
            </h3>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item, index) => (
          <SidebarButton
            key={`nav-${item.href}-${index}`}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={item.isActive}
            prefetch={true}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-gray-100">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-lg font-medium transition-all duration-75 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut size={18} />
          <span className="text-left">
            {loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
          </span>
        </button>
      </div>

      <AdminRoutePrefetcher />
    </div>
  )
})

export default Sidebar
