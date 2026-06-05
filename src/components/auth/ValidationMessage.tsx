'use client'

import React from 'react'

interface ValidationMessageProps {
  message?: string
  type?: 'error' | 'success' | 'info'
  className?: string
}

const ValidationMessage = React.memo(function ValidationMessage({ 
  message, 
  type = 'error', 
  className = '' 
}: ValidationMessageProps) {
  if (!message) return null

  const typeClasses = {
    error: 'text-red-600 bg-red-50 border-red-200',
    success: 'text-green-600 bg-green-50 border-green-200',
    info: 'text-primary-blue bg-blue-50 border-secondary-blue'
  }

  const icons = {
    error: (
      <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div 
      className={`flex items-start p-2 text-xs rounded-lg border ${typeClasses[type]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <span className="mr-2 mt-0.5">
        {icons[type]}
      </span>
      <span className="leading-relaxed">{message}</span>
    </div>
  )
})

export default ValidationMessage