'use client'

import { ReactNode } from 'react'

interface MobilePageWrapperProps {
  children: ReactNode
  className?: string
  withPadding?: boolean
}

export default function MobilePageWrapper({
  children,
  className = '',
  withPadding = true
}: MobilePageWrapperProps) {
  return (
    <div className={`
      w-full
      min-h-screen
      ${className}
    `}>
      <div className="w-full max-w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}