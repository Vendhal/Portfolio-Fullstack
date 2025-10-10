import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
const MemberPage = lazy(() => import('./pages/MemberPage.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const SettingsPanel = lazy(() => import('./components/SettingsPanel.jsx'))
import CursorSun from './components/CursorSun.jsx'
import ApiErrorBoundary from './components/ApiErrorBoundary.jsx'
import { SettingsProvider } from './state/SettingsContext.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import PerformanceMonitor from './utils/performanceMonitor.ts'
import { PWAManager } from './utils/pwa.ts'
import './styles.css'

// Initialize performance monitoring
const performanceMonitor = PerformanceMonitor.getInstance()

// Initialize PWA functionality
const pwaManager = PWAManager.getInstance()

// Record initial page load metrics
window.addEventListener('load', () => {
  setTimeout(() => {
    performanceMonitor.recordMetric({
      loadTime: performance.now(),
      renderTime: 0,
      memoryUsage: 0,
      bundleSize: 0,
      cacheHitRate: 0
    })
  }, 100)
})

function NotFound() {
  React.useEffect(() => {
    document.title = '404 - Team Portfolio'
  }, [])

  return (
    <div className="container" style={{ paddingTop: 40 }}>
      <h2>Lost in space</h2>
      <p>The page you were looking for drifted into a black hole.</p>
      <Link to="/" className="back-home-btn">
        <span className="back-home-glow" aria-hidden />
        <span className="back-home-icon" aria-hidden />
        <span className="back-home-text">Return home</span>
      </Link>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <ApiErrorBoundary onError={(error, errorInfo) => {
        // In production, send to error reporting service
        console.error('Global error:', error, errorInfo)
      }}>
        <SettingsProvider>
          <AuthProvider>
            <BrowserRouter>
              <CursorSun />
              <Suspense fallback={null}><SettingsPanel /></Suspense>
              <Routes>
                <Route path="/" element={
                  <ApiErrorBoundary>
                    <App />
                  </ApiErrorBoundary>
                } />
                <Route
                  path="/member/:slug"
                  element={
                    <ApiErrorBoundary>
                      <Suspense fallback={<div className="container" style={{ paddingTop: 40 }}>Loading profile...</div>}>
                        <MemberPage />
                      </Suspense>
                    </ApiErrorBoundary>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ApiErrorBoundary>
                      <Suspense fallback={<div className="container" style={{ paddingTop: 40 }}>Loading dashboard...</div>}>
                        <Dashboard />
                      </Suspense>
                    </ApiErrorBoundary>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </SettingsProvider>
      </ApiErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
)







