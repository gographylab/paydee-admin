'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, { memo, useCallback, useMemo, useTransition } from 'react'
import { LayoutGrid, PlaneTakeoff, Users, CoinsIcon, CalendarCheck } from 'lucide-react'

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
}

const NavButton = memo(function NavButton({
  item,
  onNavigate
}: {
  item: NavItem
  onNavigate: (href: string) => void
}) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onNavigate(item.href)
  }, [item.href, onNavigate])

  return (
    <button
      onClick={handleClick}
      className="relative flex items-center justify-center py-2 px-1 transition-all duration-300 active:scale-95"
    >
      {item.active ? (
        <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-gradient-to-r from-[#2c6ba8] to-[#4a8fcf] shadow-lg shadow-blue-500/30 animate-in zoom-in-95 duration-300 text-white [&>svg]:w-5 [&>svg]:h-5 [&>svg]:flex-shrink-0">
          {item.icon}
          <span className="text-xs font-semibold whitespace-nowrap">
            {item.label}
          </span>
        </div>
      ) : (
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

// Admin-only app: mirror the Sidebar's main sections (Partners/Customers stay sidebar-only)
const MobileBottomNav = memo(function MobileBottomNav({ userProfile }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [, startTransition] = useTransition()

  const handleNavigate = useCallback((href: string) => {
    if (pathname === href) return

    startTransition(() => {
      router.push(href)
    })
  }, [pathname, router])

  const navItems = useMemo((): NavItem[] => [
    {
      icon: <LayoutGrid className="w-5 h-5" />,
      label: 'Dashboard',
      href: '/dashboard/admin',
      active: pathname === '/dashboard/admin'
    },
    {
      icon: <CalendarCheck className="w-5 h-5" />,
      label: 'การจอง',
      href: '/dashboard/admin/bookings',
      active: pathname.startsWith('/dashboard/admin/bookings')
    },
    {
      icon: <PlaneTakeoff className="w-5 h-5" />,
      label: 'ทริป',
      href: '/dashboard/admin/trips',
      active: pathname.startsWith('/dashboard/admin/trips')
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'ผู้ขาย',
      href: '/dashboard/admin/sellers',
      active: pathname.startsWith('/dashboard/admin/sellers')
    },
    {
      icon: <CoinsIcon className="w-5 h-5" />,
      label: 'Coins',
      href: '/dashboard/admin/coins',
      active: pathname.startsWith('/dashboard/admin/coins')
    }
  ], [pathname])

  if (userProfile?.role !== 'admin') {
    return null
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav">
      <div className="absolute inset-0 bg-white border-t border-gray-200 shadow-lg" />

      <div className="relative grid grid-cols-5 h-20 pb-safe px-2">
        {navItems.map(item => (
          <NavButton key={item.href} item={item} onNavigate={handleNavigate} />
        ))}
      </div>
    </div>
  )
})

export default MobileBottomNav
