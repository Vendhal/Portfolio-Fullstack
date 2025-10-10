import type { PerformanceMetrics } from '../types/index'

class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null
  private metrics: PerformanceMetrics[] = []
  private observers: Map<string, PerformanceObserver> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private constructor() {
    this.initializeObservers()
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !window.performance) return

    // Monitor navigation timing
    this.observeNavigationTiming()
    
    // Monitor LCP (Largest Contentful Paint)
    this.observeLCP()
    
    // Monitor FID (First Input Delay)
    this.observeFID()
    
    // Monitor CLS (Cumulative Layout Shift)
    this.observeCLS()
    
    // Monitor memory usage if available
    this.observeMemoryUsage()
  }

  private observeNavigationTiming(): void {
    if (!window.performance.getEntriesByType) return

    const navigationEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (navigationEntries.length > 0) {
      const entry = navigationEntries[0]
      if (entry) {
        const loadTime = entry.loadEventEnd - entry.loadEventStart
        const renderTime = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart
        
        this.recordMetric({
          loadTime,
          renderTime,
          memoryUsage: this.getMemoryUsage(),
          bundleSize: this.getBundleSize(),
          cacheHitRate: this.getCacheHitRate()
        })
      }
    }
  }

  private observeLCP(): void {
    if (!window.PerformanceObserver) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
        console.log('LCP:', lastEntry.startTime)
      })
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      this.observers.set('lcp', observer)
    } catch (error) {
      console.warn('LCP observer not supported:', error)
    }
  }

  private observeFID(): void {
    if (!window.PerformanceObserver) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number }
          const fid = fidEntry.processingStart - fidEntry.startTime
          console.log('FID:', fid)
        })
      })
      
      observer.observe({ type: 'first-input', buffered: true })
      this.observers.set('fid', observer)
    } catch (error) {
      console.warn('FID observer not supported:', error)
    }
  }

  private observeCLS(): void {
    if (!window.PerformanceObserver) return

    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value
          }
        })
        console.log('CLS:', clsValue)
      })
      
      observer.observe({ type: 'layout-shift', buffered: true })
      this.observers.set('cls', observer)
    } catch (error) {
      console.warn('CLS observer not supported:', error)
    }
  }

  private observeMemoryUsage(): void {
    // Monitor memory usage periodically
    const checkMemory = () => {
      const memoryUsage = this.getMemoryUsage()
      if (memoryUsage > 0) {
        console.log('Memory Usage:', memoryUsage, 'MB')
      }
    }

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000)
  }

  private getMemoryUsage(): number {
    if ('memory' in window.performance) {
      const memory = (window.performance as any).memory
      return Math.round(memory.usedJSHeapSize / 1048576) // Convert to MB
    }
    return 0
  }

  private getBundleSize(): number {
    // Estimate bundle size from resource timing
    if (!window.performance.getEntriesByType) return 0
    
    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    let totalSize = 0
    
    resources.forEach((resource) => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        // Estimate size from transfer time and connection speed
        const transferTime = resource.responseEnd - resource.responseStart
        totalSize += transferTime * 100 // Rough estimation
      }
    })
    
    return Math.round(totalSize / 1024) // Convert to KB
  }

  private getCacheHitRate(): number {
    // Calculate cache hit rate based on resource timing
    if (!window.performance.getEntriesByType) return 0
    
    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    let cacheHits = 0
    let totalResources = 0
    
    resources.forEach((resource) => {
      totalResources++
      // If duration is very small, likely served from cache
      if (resource.duration < 10) {
        cacheHits++
      }
    })
    
    return totalResources > 0 ? Math.round((cacheHits / totalResources) * 100) : 0
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    } as PerformanceMetrics & { timestamp: number })
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
        bundleSize: 0,
        cacheHitRate: 0
      }
    }

    const sum = this.metrics.reduce((acc, metric) => ({
      loadTime: acc.loadTime + metric.loadTime,
      renderTime: acc.renderTime + metric.renderTime,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      bundleSize: acc.bundleSize + metric.bundleSize,
      cacheHitRate: acc.cacheHitRate + metric.cacheHitRate
    }), {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      bundleSize: 0,
      cacheHitRate: 0
    })

    const count = this.metrics.length
    return {
      loadTime: Math.round(sum.loadTime / count),
      renderTime: Math.round(sum.renderTime / count),
      memoryUsage: Math.round(sum.memoryUsage / count),
      bundleSize: Math.round(sum.bundleSize / count),
      cacheHitRate: Math.round(sum.cacheHitRate / count)
    }
  }

  measureComponentRender(componentName: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      console.log(`${componentName} render time:`, renderTime.toFixed(2), 'ms')
    }
  }

  measureAsyncOperation(operationName: string): { start: () => void; end: () => void } {
    let startTime: number
    
    return {
      start: () => {
        startTime = performance.now()
      },
      end: () => {
        const endTime = performance.now()
        const duration = endTime - startTime
        console.log(`${operationName} duration:`, duration.toFixed(2), 'ms')
      }
    }
  }

  cleanup(): void {
    this.observers.forEach((observer) => {
      observer.disconnect()
    })
    this.observers.clear()
  }
}

export default PerformanceMonitor

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    recordMetric: monitor.recordMetric.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    getAverageMetrics: monitor.getAverageMetrics.bind(monitor),
    measureComponentRender: monitor.measureComponentRender.bind(monitor),
    measureAsyncOperation: monitor.measureAsyncOperation.bind(monitor)
  }
}