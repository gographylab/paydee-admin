'use client'

/**
 * Performance Monitoring Utility for TanStack Query
 * Use this to track cache hits, query performance, and API calls
 */

import React from 'react'

interface PerformanceMetrics {
  cacheHits: number
  cacheMisses: number
  totalQueries: number
  averageQueryTime: number
  slowQueries: Array<{ key: string; duration: number }>
  apiCalls: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    totalQueries: 0,
    averageQueryTime: 0,
    slowQueries: [],
    apiCalls: 0,
  }

  private queryTimes: number[] = []
  private readonly SLOW_QUERY_THRESHOLD = 1000 // 1 second

  /**
   * Track a query execution
   */
  trackQuery(queryKey: string, startTime: number, isCacheHit: boolean) {
    const duration = performance.now() - startTime

    this.metrics.totalQueries++
    this.queryTimes.push(duration)

    if (isCacheHit) {
      this.metrics.cacheHits++
    } else {
      this.metrics.cacheMisses++
      this.metrics.apiCalls++
    }

    // Track slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.metrics.slowQueries.push({
        key: JSON.stringify(queryKey),
        duration: Math.round(duration),
      })
    }

    // Update average
    this.metrics.averageQueryTime =
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics & {
    cacheHitRate: number
    totalQueryTime: number
  } {
    const cacheHitRate = this.metrics.totalQueries > 0
      ? (this.metrics.cacheHits / this.metrics.totalQueries) * 100
      : 0

    return {
      ...this.metrics,
      cacheHitRate: Math.round(cacheHitRate),
      totalQueryTime: Math.round(this.queryTimes.reduce((a, b) => a + b, 0)),
    }
  }

  /**
   * Get formatted report
   */
  getReport(): string {
    const metrics = this.getMetrics()

    return `
🎯 TanStack Query Performance Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Cache Performance:
  • Total Queries: ${metrics.totalQueries}
  • Cache Hits: ${metrics.cacheHits}
  • Cache Misses: ${metrics.cacheMisses}
  • Hit Rate: ${metrics.cacheHitRate}%

⚡ Query Performance:
  • Average Query Time: ${Math.round(metrics.averageQueryTime)}ms
  • Total Query Time: ${metrics.totalQueryTime}ms

🌐 API Calls:
  • Total API Calls: ${metrics.apiCalls}
  • Saved by Cache: ${metrics.cacheHits}
  • Reduction: ${Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.apiCalls)) * 100)}%

${metrics.slowQueries.length > 0 ? `
⚠️ Slow Queries (>${this.SLOW_QUERY_THRESHOLD}ms):
${metrics.slowQueries.slice(0, 5).map(q => `  • ${q.key}: ${q.duration}ms`).join('\n')}
` : '✅ No slow queries detected'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim()
  }

  /**
   * Log report to console
   */
  logReport() {
    console.log(this.getReport())
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalQueries: 0,
      averageQueryTime: 0,
      slowQueries: [],
      apiCalls: 0,
    }
    this.queryTimes = []
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.getMetrics(),
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * React hook to use performance monitor
 */
export function usePerformanceMonitor() {
  return {
    trackQuery: performanceMonitor.trackQuery.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getReport: performanceMonitor.getReport.bind(performanceMonitor),
    logReport: performanceMonitor.logReport.bind(performanceMonitor),
    reset: performanceMonitor.reset.bind(performanceMonitor),
    exportMetrics: performanceMonitor.exportMetrics.bind(performanceMonitor),
  }
}

/**
 * React component to display performance metrics
 */
export function PerformanceMonitorDisplay() {
  const monitor = usePerformanceMonitor()
  const [metrics, setMetrics] = React.useState(monitor.getMetrics())

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics())
    }, 1000)

    return () => clearInterval(interval)
  }, [monitor])

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg z-50 font-mono text-xs max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">⚡ Performance</h3>
        <button
          onClick={() => monitor.reset()}
          className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30"
        >
          Reset
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Cache Hit Rate:</span>
          <span className={metrics.cacheHitRate > 70 ? 'text-green-400' : 'text-yellow-400'}>
            {metrics.cacheHitRate}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Total Queries:</span>
          <span>{metrics.totalQueries}</span>
        </div>

        <div className="flex justify-between">
          <span>API Calls:</span>
          <span>{metrics.apiCalls}</span>
        </div>

        <div className="flex justify-between">
          <span>Avg Query Time:</span>
          <span className={metrics.averageQueryTime < 100 ? 'text-green-400' : 'text-yellow-400'}>
            {Math.round(metrics.averageQueryTime)}ms
          </span>
        </div>

        {metrics.slowQueries.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="text-yellow-400">⚠️ {metrics.slowQueries.length} slow queries</div>
          </div>
        )}
      </div>

      <button
        onClick={() => monitor.logReport()}
        className="mt-2 w-full text-xs bg-blue-500 px-2 py-1 rounded hover:bg-blue-600"
      >
        Log Full Report
      </button>
    </div>
  )
}
