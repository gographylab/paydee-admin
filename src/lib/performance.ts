// Performance utilities and hooks

import { useCallback, useRef } from 'react'

// Debounce hook for search/filter inputs
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay)
    }) as T,
    [callback, delay]
  )
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const observe = useCallback((element: Element | null) => {
    if (observerRef.current) observerRef.current.disconnect()
    
    if (element) {
      observerRef.current = new IntersectionObserver(callback, {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      })
      observerRef.current.observe(element)
    }
  }, [callback, options])

  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }, [])

  return { observe, disconnect }
}

// Performance measurement utilities
export const performance = {
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name)
    }
  },
  
  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark)
        const entries = window.performance.getEntriesByName(name)
        const latest = entries[entries.length - 1]
        console.log(`${name}: ${latest.duration}ms`)
        return latest.duration
      } catch (error) {
        console.warn('Performance measurement failed:', error)
      }
    }
    return 0
  },
  
  now: () => {
    if (typeof window !== 'undefined' && window.performance) {
      return window.performance.now()
    }
    return Date.now()
  }
}

// Virtual scrolling for large lists
export class VirtualScroller {
  private container: HTMLElement
  private itemHeight: number
  private overscan: number

  constructor(container: HTMLElement, itemHeight: number, overscan = 5) {
    this.container = container
    this.itemHeight = itemHeight
    this.overscan = overscan
  }

  calculateVisibleRange(scrollTop: number, containerHeight: number, totalItems: number) {
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan)
    const endIndex = Math.min(
      totalItems - 1,
      Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.overscan
    )
    
    return { startIndex, endIndex }
  }

  getTransformStyle(index: number) {
    return `translateY(${index * this.itemHeight}px)`
  }
}