'use client'

import Image from 'next/image'
import { useState } from 'react'

interface TripImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

// Check if URL is from Supabase storage (skip Next.js optimization to avoid timeout)
const isSupabaseUrl = (url: string): boolean => {
  return url.includes('supabase.co/storage')
}

export default function TripImage({ src, alt, className, priority = false }: TripImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Use unoptimized for Supabase URLs to avoid Next.js image optimization timeout
  const shouldSkipOptimization = isSupabaseUrl(src)

  if (imageError) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center`}>
        <span className="text-6xl">🌍</span>
      </div>
    )
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized={shouldSkipOptimization}
        className="object-cover transition-opacity duration-300"
        style={{ opacity: isLoading ? 0 : 1 }}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onLoad={() => setIsLoading(false)}
        onError={() => setImageError(true)}
      />
    </div>
  )
}
