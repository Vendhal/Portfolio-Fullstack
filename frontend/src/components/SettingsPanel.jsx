import { useEffect, useState } from 'react'
import { useSettings } from '../state/SettingsContext.jsx'
import PerformanceDashboard from './PerformanceDashboard.tsx'

export default function SettingsPanel() {
  const {
    effectsOn,
    setEffectsOn,
    bgSpeed,
    setBgSpeed,
    bgDensity,
    setBgDensity,
    reduceMotion,
    setReduceMotion,
  } = useSettings()
  const [open, setOpen] = useState(false)
  const [showPerformance, setShowPerformance] = useState(false)

  // Keyboard shortcut to open panel: Shift+S
  useEffect(() => {
    const onKey = (e) => {
      if (e.shiftKey && (e.key || '').toLowerCase() === 's') setOpen(v => !v)
      // Keyboard shortcut for performance dashboard: Shift+P
      if (e.shiftKey && (e.key || '').toLowerCase() === 'p') setShowPerformance(v => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <button className="settings-btn" onClick={() => setOpen(v => !v)} aria-label="Open settings">
        &#9881;
      </button>
      {open && (
        <div className="settings-panel" role="dialog" aria-modal="true">
          <div className="settings-row">
            <label>
              <input type="checkbox" checked={effectsOn} onChange={e => setEffectsOn(e.target.checked)} />
              <span> Visual effects (background + cursor)</span>
            </label>
          </div>
          <div className="settings-row">
            <label>
              <input type="checkbox" checked={reduceMotion} onChange={e => setReduceMotion(e.target.checked)} />
              <span> Reduce motion (minimize animations)</span>
            </label>
          </div>
          <div className="settings-row">
            <label>Background speed</label>
            <input type="range" min="0.5" max="1.5" step="0.05" value={bgSpeed} onChange={e => setBgSpeed(parseFloat(e.target.value))} />
            <span className="range-val">{bgSpeed.toFixed(2)}</span>
          </div>
          <div className="settings-row">
            <label>Background density</label>
            <input type="range" min="0.5" max="1.5" step="0.05" value={bgDensity} onChange={e => setBgDensity(parseFloat(e.target.value))} />
            <span className="range-val">{bgDensity.toFixed(2)}</span>
          </div>
          <div className="settings-row">
            <button 
              className="performance-btn"
              onClick={() => setShowPerformance(true)}
              title="Open Performance Dashboard"
            >
              📊 Performance Dashboard
            </button>
          </div>
          <div className="settings-hint">
            Press C to toggle the cursor. Shift+S opens settings. Shift+P opens performance dashboard. Reduced motion turns off large background effects.
          </div>
        </div>
      )}
      
      <PerformanceDashboard 
        show={showPerformance} 
        onClose={() => setShowPerformance(false)} 
      />
    </>
  )
}
