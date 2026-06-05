'use client'

import React from 'react'

interface LoadingSystemProps {
  variant?: 'spinner' | 'skeleton' | 'grid' | 'dashboard' | 'minimal'
  message?: string
  count?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingSystem({ 
  variant = 'spinner', 
  message = "กำลังโหลด...", 
  count = 6,
  className = '',
  size = 'md'
}: LoadingSystemProps) {
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-32 w-32'
  }

  if (variant === 'spinner') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full border-b-2 border-primary-blue mx-auto ${sizeClasses[size]}`}></div>
          {message && <p className="mt-4 text-gray-600">{message}</p>}
        </div>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className={`animate-spin rounded-full border-b-2 border-primary-blue ${sizeClasses.sm}`}></div>
      </div>
    )
  }

  if (variant === 'skeleton') {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'dashboard') {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          
          {/* Chart Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* Table/List */}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}