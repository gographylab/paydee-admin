'use client'

import React from 'react'

interface ErrorSystemProps {
  variant?: 'fullscreen' | 'banner' | 'inline' | 'card'
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  showIcon?: boolean
  className?: string
}

export default function ErrorSystem({ 
  variant = 'fullscreen',
  title = 'เกิดข้อผิดพลาด',
  message = 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
  action,
  showIcon = true,
  className = ''
}: ErrorSystemProps) {

  const RetryButton = () => {
    if (!action) return null
    
    return (
      <button
        onClick={action.onClick}
        className="mt-4 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue transition-colors duration-200"
      >
        {action.label}
      </button>
    )
  }

  if (variant === 'fullscreen') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center max-w-md mx-auto p-6">
          {showIcon && <div className="text-6xl mb-4">😔</div>}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-600 mb-4">{message}</p>
          <RetryButton />
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          {showIcon && (
            <svg className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">{title}</h3>
            <p className="text-sm text-red-700 mt-1">{message}</p>
            {action && (
              <button
                onClick={action.onClick}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center text-red-600 ${className}`}>
        {showIcon && (
          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        <span className="text-sm">{message}</span>
        {action && (
          <button
            onClick={action.onClick}
            className="ml-2 text-sm underline hover:text-red-700"
          >
            {action.label}
          </button>
        )}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        {showIcon && (
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <RetryButton />
      </div>
    )
  }

  return null
}