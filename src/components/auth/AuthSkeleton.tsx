'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6 sm:p-8 will-change-auto">
          <div className="text-center">
            <Skeleton className="mx-auto h-14 w-14 rounded-full mb-4 sm:h-16 sm:w-16 flex-shrink-0" />
            <Skeleton className="h-6 w-32 mx-auto mb-2 sm:h-7 sm:w-40" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-lg sm:h-11" />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white">
                  <Skeleton className="h-4 w-8" />
                </span>
              </div>
            </div>

            <Skeleton className="h-12 w-full rounded-lg sm:h-11" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(AuthSkeleton)