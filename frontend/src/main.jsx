import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import App from './App.jsx'
const MemberPage = lazy(() => import('./pages/MemberPage.jsx'))
const SettingsPanel = lazy(() => import('./components/SettingsPanel.jsx'))
import CursorSun from './components/CursorSun.jsx'
import { SettingsProvider } from './state/SettingsContext.jsx'
import './styles.css'

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
    <SettingsProvider>
      <BrowserRouter>
        <CursorSun />
        <Suspense fallback={null}><SettingsPanel /></Suspense>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/member/:slug"
            element={
              <Suspense fallback={<div className="container" style={{ paddingTop: 40 }}>Loading profile...</div>}>
                <MemberPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  </React.StrictMode>
)







