// Simple cache for API responses
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>()
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  set(key: string, data: any, ttl: number = 30000): void { // 30 seconds default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  clear(): void {
    this.cache.clear()
  }

  // Clear all cache entries that match a pattern
  clearPattern(pattern: string): void {
    const keysToDelete: string[] = []
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Delete a specific key
  delete(key: string): void {
    this.cache.delete(key)
  }
}

export const apiCache = new SimpleCache()
