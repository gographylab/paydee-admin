'use client'

import React, { Suspense } from 'react'

// Lazy load the actual Sidebar component
const Sidebar = React.lazy(() => import('./Sidebar'))

// Loading skeleton component with shimmer effect
function SidebarSkeleton({ userRole }: { userRole?: string | null }) {
  const isAdmin = userRole === 'admin'
  
  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
      
      <div className="flex flex-col justify-between bg-white border-r border-gray-200 min-h-screen w-64">
        <div className="p-6 flex-1">
          {/* Logo Skeleton */}
          <div className="mb-8 flex items-center flex-col">
            <div className="w-16 h-8 shimmer rounded mb-2"></div>
            <div className="w-28 h-5 shimmer rounded"></div>
          </div>

          {/* Navigation Skeleton */}
          <nav className="space-y-2">
            {[1, 2, 3, ...(isAdmin ? [4] : [])].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg">
                <div className="w-5 h-5 shimmer rounded"></div>
                <div 
                  className="shimmer rounded h-4"
                  style={{ width: `${80 + Math.random() * 40}px` }}
                ></div>
              </div>
            ))}
          </nav>
        </div>

        {/* Verification Button Skeleton - Only for sellers or when role is unknown */}
        {userRole !== 'admin' && (
          <div className="px-6 mb-6">
            <div className="w-full h-16 shimmer rounded-xl border-2 border-gray-200 flex items-center gap-3 px-4">
              <div className="w-5 h-5 bg-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="w-20 h-4 bg-gray-300 rounded mb-1"></div>
                <div className="w-16 h-3 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Skeleton */}
        <div className="p-4 border-t border-gray-200">
          {/* User info skeleton - Only for sellers or when role is unknown */}
          {userRole !== 'admin' && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 shimmer rounded-full"></div>
              <div className="flex-1">
                <div className="w-24 h-4 shimmer rounded mb-1"></div>
                <div className="w-20 h-3 shimmer rounded"></div>
              </div>
            </div>
          )}
          
          <div className="w-full h-10 shimmer rounded-lg flex items-center justify-center">
            <div className="w-6 h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    </>
  )
}

// Simple error fallback
function SidebarError() {
  return (
    <div className="flex flex-col justify-center items-center bg-white border-r border-gray-200 min-h-screen w-64 p-6">
      <div className="text-red-500 text-center">
        <p className="text-sm">เกิดข้อผิดพลาดในการโหลด Sidebar</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-xs text-blue-600 underline"
        >
          รีเฟรชหน้า
        </button>
      </div>
    </div>
  )
}

interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  status: string | null
  referral_code: string | null
  avatar_url: string | null
}

interface SidebarLazyProps {
  className?: string
  initialProfile?: UserProfile
}

export default function SidebarLazy({ className, initialProfile }: SidebarLazyProps) {
  const userRole = initialProfile?.role ?? undefined;
  
  return (
    <Suspense fallback={<SidebarSkeleton userRole={userRole} />}>
      <Sidebar className={className} initialProfile={initialProfile} />
    </Suspense>
  )
}
