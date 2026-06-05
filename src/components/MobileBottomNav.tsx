'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import React, { memo, useCallback, useMemo, useTransition } from 'react'
import { LayoutGrid, PlaneTakeoff, Users, UserCircle, CoinsIcon, Trophy } from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface NavItem {
  icon: React.ReactElement
  label: string
  href: string
  active: boolean
  disabled?: boolean
  isProfile?: boolean
  needsAction?: boolean
}

// Get verification status info (memoized function outside component)
const getVerificationStatus = (userProfile: UserProfile | null) => {
  if (!userProfile) return { status: 'unknown', needsAction: false }

  const hasBasicInfo = userProfile.full_name && userProfile.phone

  // If no basic info, needs verification
  if (!hasBasicInfo) {
    return { status: 'needs_verification', needsAction: true }
  }

  // If approved, no action needed
  if (userProfile.status === 'approved') {
    return { status: 'approved', needsAction: false }
  }

  // If pending, no immediate action needed
  if (userProfile.status === 'pending') {
    return { status: 'pending', needsAction: false }
  }

  // If rejected or any other status, needs action
  return { status: 'needs_verification', needsAction: true }
}

// Memoized navigation button component
const NavButton = memo(function NavButton({ 
  item, 
  index, 
  onNavigate 
}: { 
  item: NavItem
  index: number 
  onNavigate: (href: string) => void 
}) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onNavigate(item.href)
  }, [item.href, onNavigate])

  if (item.disabled) {
    return (
      <div
        key={index}
        className="flex items-center justify-center text-gray-300 cursor-not-allowed py-2"
      >
        <div className="w-12 h-12 flex items-center justify-center opacity-40 [&>svg]:w-6 [&>svg]:h-6">
          {item.icon}
        </div>
      </div>
    )
  }

  if (item.isProfile) {
    return (
      <button
        key={index}
        onClick={handleClick}
        className={`relative flex items-center justify-center py-2 px-1 transition-all duration-300 active:scale-95 ${
          item.needsAction && !item.active ? 'text-red-500' : ''
        }`}
      >
        {item.active ? (
          /* Active Pill with Icon + Label */
          <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-gradient-to-r from-[#2c6ba8] to-[#4a8fcf] shadow-lg shadow-blue-500/30 animate-in zoom-in-95 duration-300 text-white [&>svg]:w-5 [&>svg]:h-5 [&>svg]:flex-shrink-0">
            {item.icon}
            <span className="text-xs font-semibold whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ) : (
          /* Inactive - Icon Only */
          <div className={`w-12 h-12 flex items-center justify-center transition-transform duration-200 hover:scale-110 [&>svg]:w-6 [&>svg]:h-6 ${
            item.needsAction ? 'text-red-500' : 'text-gray-400'
          }`}>
            {item.icon}
          </div>
        )}
      </button>
    )
  }

  return (
    <button
      key={index}
      onClick={handleClick}
      className="relative flex items-center justify-center py-2 px-1 transition-all duration-300 active:scale-95"
    >
      {item.active ? (
        /* Active Pill with Icon + Label */
        <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-gradient-to-r from-[#2c6ba8] to-[#4a8fcf] shadow-lg shadow-blue-500/30 animate-in zoom-in-95 duration-300 text-white [&>svg]:w-5 [&>svg]:h-5 [&>svg]:flex-shrink-0">
          {item.icon}
          <span className="text-xs font-semibold whitespace-nowrap">
            {item.label}
          </span>
        </div>
      ) : (
        /* Inactive - Icon Only */
        <div className="w-12 h-12 flex items-center justify-center transition-transform duration-200 hover:scale-110 text-gray-400 [&>svg]:w-6 [&>svg]:h-6">
          {item.icon}
        </div>
      )}
    </button>
  )
})

interface MobileBottomNavProps {
  userProfile: UserProfile | null
}

const MobileBottomNav = memo(function MobileBottomNav({ userProfile: initialUserProfile }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [userProfile, setUserProfile] = React.useState(initialUserProfile)

  // Update local state when props change
  React.useEffect(() => {
    setUserProfile(initialUserProfile)
  }, [initialUserProfile])

  // Listen for profile updates
  React.useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('Profile updated, refreshing mobile nav data...')
      // Force re-render by updating the state with a new object reference
      setUserProfile(prev => prev ? { ...prev } : null)
    }

    // Listen for custom profile update events
    window.addEventListener('profileUpdated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [])

  // Don't show for admin users
  if (userProfile?.role === 'admin') {
    return null
  }

  // Memoize verification info to prevent recalculation
  const verificationInfo = useMemo(() => 
    getVerificationStatus(userProfile), 
    [userProfile?.full_name, userProfile?.phone, userProfile?.status]
  )

  // Fast navigation with startTransition
  const handleNavigate = useCallback((href: string) => {
    if (pathname === href) return // Don't navigate if already on page
    
    startTransition(() => {
      router.push(href)
    })
  }, [pathname, router])

  // Memoize navigation items to prevent recreation on every render
  const navItems = useMemo((): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        icon: <LayoutGrid className="w-5 h-5" />,
        label: 'Dashboard',
        href: '/dashboard',
        active: pathname === '/dashboard'
      },
      {
        icon: <PlaneTakeoff className="w-5 h-5" />,
        label: 'Trips',
        href: '/dashboard/trips',
        active: pathname.includes('/dashboard/trips')
      },
      {
        icon: <CoinsIcon className="w-5 h-5" />,
        label: 'Coins',
        href: '/dashboard/coins',
        active: pathname === '/dashboard/coins'
      },
      {
        icon: <Users className="w-5 h-5" />,
        label: 'รายงาน',
        href: '/dashboard/reports',
        active: pathname === '/dashboard/reports',
        disabled: userProfile?.status !== 'approved'
      },
      {
        icon: <Trophy className="w-5 h-5" />,
        label: 'อันดับ',
        href: '/dashboard/rank',
        active: pathname === '/dashboard/rank'
      }
    ]

    // Profile item - only for sellers (not admin)
    if (userProfile?.role !== 'admin') {
      // Seller: Profile with verification status
      baseItems.push({
        icon: verificationInfo.needsAction ? (
          <div className="relative">
            <UserCircle className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          </div>
        ) : (
          <UserCircle className="w-5 h-5" />
        ),
        label: verificationInfo.needsAction ? 'ยืนยันตัวตน' : 'โปรไฟล์',
        href: '/dashboard/profile',
        active: pathname === '/dashboard/profile',
        isProfile: true,
        needsAction: verificationInfo.needsAction
      })
    }

    return baseItems
  }, [pathname, userProfile?.status, userProfile?.role, verificationInfo.needsAction])

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav">
      {/* Simple White Background */}
      <div className="absolute inset-0 bg-white border-t border-gray-200 shadow-lg" />

      {/* Navigation Items */}
      <div className={`relative grid ${userProfile?.role === 'admin' ? 'grid-cols-3' : 'grid-cols-6'} h-20 pb-safe px-2`}>
        {navItems.map((item, index) => (
          <NavButton
            key={`nav-${index}-${item.href}`}
            item={item}
            index={index}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </div>
  )
})

export default MobileBottomNav