'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseApiRequestOptions {
  enabled?: boolean
  refetchOnMount?: boolean
  cacheTime?: number
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

interface UseApiRequestReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: (newData: T) => void
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export function useApiRequest<T = any>(
  url: string | null,
  options: UseApiRequestOptions = {}
): UseApiRequestReturn<T> {
  const {
    enabled = true,
    refetchOnMount = true,
    cacheTime = 30000, // 30 seconds
    onSuccess,
    onError
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return

    // Check cache first
    const cacheKey = url
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      setData(cached.data)
      onSuccess?.(cached.data)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: cacheTime
      })

      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [url, enabled, cacheTime, onSuccess, onError])

  const mutate = useCallback((newData: T) => {
    setData(newData)
    // Update cache if it exists
    if (url) {
      const cacheKey = url
      const cached = cache.get(cacheKey)
      if (cached) {
        cache.set(cacheKey, {
          ...cached,
          data: newData
        })
      }
    }
  }, [url])

  useEffect(() => {
    if (refetchOnMount && enabled) {
      fetchData()
    }
  }, [fetchData, refetchOnMount, enabled])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate
  }
}

// Specialized hook for POST requests
export function useApiMutation<TData = any, TVariables = any>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (
    url: string,
    variables: TVariables,
    options?: {
      method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      headers?: Record<string, string>
      onSuccess?: (data: TData) => void
      onError?: (error: string) => void
    }
  ): Promise<TData | null> => {
    const { method = 'POST', headers = {}, onSuccess, onError } = options || {}
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: method !== 'DELETE' ? JSON.stringify(variables) : undefined
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    mutate,
    loading,
    error
  }
}