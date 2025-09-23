import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const Ctx = createContext(null)

export function SettingsProvider({ children }) {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false

  const [effectsOn, setEffectsOn] = useState(() => localStorage.getItem('effectsOn') !== '0')
  const [bgSpeed, setBgSpeed] = useState(() => Number(localStorage.getItem('bgSpeed') || '1'))
  const [bgDensity, setBgDensity] = useState(() => Number(localStorage.getItem('bgDensity') || '1'))
  const [reduceMotion, setReduceMotion] = useState(() => {
    const stored = localStorage.getItem('reduceMotion')
    if (stored !== null) return stored === '1'
    return prefersReduced
  })

  useEffect(() => {
    localStorage.setItem('effectsOn', effectsOn ? '1' : '0')
    document.documentElement.classList.toggle('sun-cursor-on', effectsOn)
    window.dispatchEvent(new CustomEvent('sunCursorSet', { detail: effectsOn }))
  }, [effectsOn])

  useEffect(() => {
    localStorage.setItem('bgSpeed', String(bgSpeed))
  }, [bgSpeed])

  useEffect(() => {
    localStorage.setItem('bgDensity', String(bgDensity))
  }, [bgDensity])

  useEffect(() => {
    localStorage.setItem('reduceMotion', reduceMotion ? '1' : '0')
    document.documentElement.classList.toggle('motion-reduced', reduceMotion)
    if (reduceMotion && effectsOn) setEffectsOn(false)
  }, [reduceMotion, effectsOn])

  const value = useMemo(() => ({
    effectsOn,
    setEffectsOn,
    bgSpeed,
    setBgSpeed,
    bgDensity,
    setBgDensity,
    reduceMotion,
    setReduceMotion,
  }), [effectsOn, bgSpeed, bgDensity, reduceMotion])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings() {
  return useContext(Ctx)
}
