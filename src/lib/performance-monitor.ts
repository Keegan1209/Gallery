/**
 * Performance Monitoring Utilities
 * 
 * Simple utilities to track image loading performance and provide
 * insights for further optimization.
 */

interface PerformanceMetric {
  id: string
  startTime: number
  endTime?: number
  duration?: number
  type: 'thumbnail' | 'full-image' | 'api-call'
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()

  startTimer(id: string, type: PerformanceMetric['type']): void {
    this.metrics.set(id, {
      id,
      startTime: performance.now(),
      type
    })
  }

  endTimer(id: string): number | null {
    const metric = this.metrics.get(id)
    if (!metric) return null

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    this.metrics.set(id, {
      ...metric,
      endTime,
      duration
    })

    return duration
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined)
  }

  getAverageLoadTime(type?: PerformanceMetric['type']): number {
    const relevantMetrics = this.getMetrics().filter(m => 
      !type || m.type === type
    )
    
    if (relevantMetrics.length === 0) return 0
    
    const totalTime = relevantMetrics.reduce((sum, m) => sum + (m.duration || 0), 0)
    return totalTime / relevantMetrics.length
  }

  logSummary(): void {
    const thumbnailAvg = this.getAverageLoadTime('thumbnail')
    const fullImageAvg = this.getAverageLoadTime('full-image')
    const apiAvg = this.getAverageLoadTime('api-call')

    console.log('📊 Performance Summary:')
    console.log(`  Thumbnail avg: ${thumbnailAvg.toFixed(2)}ms`)
    console.log(`  Full image avg: ${fullImageAvg.toFixed(2)}ms`)
    console.log(`  API call avg: ${apiAvg.toFixed(2)}ms`)
    console.log(`  Total metrics: ${this.getMetrics().length}`)
  }

  clear(): void {
    this.metrics.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()