import { useEffect, useState } from 'react'
import { usePerformanceMonitor } from '@/utils/performanceMonitor'
import type { PerformanceMetrics } from '@/types'
import './PerformanceDashboard.css'

interface PerformanceDashboardProps {
  show?: boolean;
  onClose?: () => void;
}

export default function PerformanceDashboard({ show = false, onClose }: PerformanceDashboardProps) {
  const { getMetrics, getAverageMetrics } = usePerformanceMonitor()
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [averageMetrics, setAverageMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    cacheHitRate: 0
  })

  useEffect(() => {
    if (show) {
      const updateMetrics = () => {
        setMetrics(getMetrics())
        setAverageMetrics(getAverageMetrics())
      }

      updateMetrics()
      const interval = setInterval(updateMetrics, 5000) // Update every 5 seconds

      return () => clearInterval(interval)
    }
    
    return undefined
  }, [show, getMetrics, getAverageMetrics])

  if (!show) return null

  const formatTime = (time: number) => {
    return time < 1000 ? `${time.toFixed(1)}ms` : `${(time / 1000).toFixed(2)}s`
  }

  const getPerformanceGrade = (metric: keyof PerformanceMetrics, value: number) => {
    const thresholds = {
      loadTime: { good: 1000, fair: 3000 },
      renderTime: { good: 100, fair: 300 },
      memoryUsage: { good: 50, fair: 100 },
      bundleSize: { good: 250, fair: 500 },
      cacheHitRate: { good: 80, fair: 60 }
    }

    const threshold = thresholds[metric]
    if (metric === 'cacheHitRate') {
      return value >= threshold.good ? 'good' : value >= threshold.fair ? 'fair' : 'poor'
    }
    return value <= threshold.good ? 'good' : value <= threshold.fair ? 'fair' : 'poor'
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'good': return '#4ade80'
      case 'fair': return '#fbbf24'
      case 'poor': return '#f87171'
      default: return '#6b7280'
    }
  }

  return (
    <div className="performance-dashboard">
      <div className="dashboard-overlay" onClick={onClose} />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Performance Dashboard</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close dashboard">
            ×
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Load Time</h3>
            <div className="metric-value">
              <span 
                className="value"
                style={{ color: getGradeColor(getPerformanceGrade('loadTime', averageMetrics.loadTime)) }}
              >
                {formatTime(averageMetrics.loadTime)}
              </span>
              <span className="grade">{getPerformanceGrade('loadTime', averageMetrics.loadTime)}</span>
            </div>
            <div className="metric-description">Time to fully load the page</div>
          </div>

          <div className="metric-card">
            <h3>Render Time</h3>
            <div className="metric-value">
              <span 
                className="value"
                style={{ color: getGradeColor(getPerformanceGrade('renderTime', averageMetrics.renderTime)) }}
              >
                {formatTime(averageMetrics.renderTime)}
              </span>
              <span className="grade">{getPerformanceGrade('renderTime', averageMetrics.renderTime)}</span>
            </div>
            <div className="metric-description">DOM content loaded time</div>
          </div>

          <div className="metric-card">
            <h3>Memory Usage</h3>
            <div className="metric-value">
              <span 
                className="value"
                style={{ color: getGradeColor(getPerformanceGrade('memoryUsage', averageMetrics.memoryUsage)) }}
              >
                {averageMetrics.memoryUsage}MB
              </span>
              <span className="grade">{getPerformanceGrade('memoryUsage', averageMetrics.memoryUsage)}</span>
            </div>
            <div className="metric-description">JavaScript heap usage</div>
          </div>

          <div className="metric-card">
            <h3>Bundle Size</h3>
            <div className="metric-value">
              <span 
                className="value"
                style={{ color: getGradeColor(getPerformanceGrade('bundleSize', averageMetrics.bundleSize)) }}
              >
                {averageMetrics.bundleSize}KB
              </span>
              <span className="grade">{getPerformanceGrade('bundleSize', averageMetrics.bundleSize)}</span>
            </div>
            <div className="metric-description">Estimated bundle size</div>
          </div>

          <div className="metric-card">
            <h3>Cache Hit Rate</h3>
            <div className="metric-value">
              <span 
                className="value"
                style={{ color: getGradeColor(getPerformanceGrade('cacheHitRate', averageMetrics.cacheHitRate)) }}
              >
                {averageMetrics.cacheHitRate}%
              </span>
              <span className="grade">{getPerformanceGrade('cacheHitRate', averageMetrics.cacheHitRate)}</span>
            </div>
            <div className="metric-description">Resources served from cache</div>
          </div>

          <div className="metric-card full-width">
            <h3>Performance Tips</h3>
            <div className="tips-list">
              {averageMetrics.loadTime > 3000 && (
                <div className="tip">⚠️ Consider optimizing images and reducing bundle size</div>
              )}
              {averageMetrics.memoryUsage > 100 && (
                <div className="tip">⚠️ Memory usage is high, check for memory leaks</div>
              )}
              {averageMetrics.cacheHitRate < 60 && (
                <div className="tip">⚠️ Low cache hit rate, consider adding cache headers</div>
              )}
              {averageMetrics.bundleSize > 500 && (
                <div className="tip">⚠️ Large bundle size, consider code splitting</div>
              )}
              {Object.values(averageMetrics).every((value, index) => {
                const keys: Array<keyof PerformanceMetrics> = ['loadTime', 'renderTime', 'memoryUsage', 'bundleSize', 'cacheHitRate']
                const key = keys[index]
                return key ? getPerformanceGrade(key, value) === 'good' : false
              }) && (
                <div className="tip">✅ All performance metrics are looking good!</div>
              )}
            </div>
          </div>
        </div>

        <div className="metrics-history">
          <h3>Recent Metrics ({metrics.length} samples)</h3>
          <div className="history-list">
            {metrics.slice(-5).reverse().map((metric, index) => (
              <div key={index} className="history-item">
                <span>Load: {formatTime(metric.loadTime)}</span>
                <span>Render: {formatTime(metric.renderTime)}</span>
                <span>Memory: {metric.memoryUsage}MB</span>
                <span>Cache: {metric.cacheHitRate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}