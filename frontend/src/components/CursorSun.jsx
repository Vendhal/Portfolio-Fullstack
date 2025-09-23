import { useEffect, useRef } from 'react'

export default function CursorSun() {
  const sunRef = useRef(null)
  const trailRef = useRef(null)
  const raf = useRef(0)
  const state = useRef({ x: 0, y: 0, lx: 0, ly: 0, visible: true, scale: 1 })
  const enabledRef = useRef(true)
  const dprRef = useRef(1)
  const styleRef = useRef(null)

  useEffect(() => {
    const sun = sunRef.current
    const canvas = trailRef.current
    const ctx = canvas.getContext('2d')
    const s = state.current

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      dprRef.current = dpr
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    // accessibility: default to off if user prefers reduced motion or stored off
    const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const storedOff = localStorage.getItem('sunCursorOff') === '1'
    enabledRef.current = !(prefersReduce || storedOff)

    const applyEnabled = () => {
      const on = enabledRef.current
      document.documentElement.classList.toggle('sun-cursor-on', on)
      sun.style.display = on ? 'block' : 'none'
      canvas.style.display = on ? 'block' : 'none'
      // Inject a highest-priority style to force-hide OS cursor across the app
      if (on) {
        if (!styleRef.current) {
          const st = document.createElement('style')
          st.id = 'sun-cursor-force'
          st.textContent = `html, body, body * { cursor: none !important; }`
          document.head.appendChild(st)
          styleRef.current = st
        }
      } else {
        if (styleRef.current) {
          styleRef.current.remove()
          styleRef.current = null
        }
      }
    }

    resize()
    applyEnabled()

    const onMove = (e) => {
      s.x = e.clientX
      s.y = e.clientY
      s.visible = true // always show sun cursor everywhere on the site
    }
    const onLeave = () => { s.visible = false }
    const onEnter = () => { s.visible = true }
    const onClick = () => { s.scale = 1.25 }


    const points = [] // trail points
    const step = () => {
      // easing follow
      const k = 0.38 // faster follow to avoid seeing OS cursor on fast moves
      s.lx += (s.x - s.lx) * k
      s.ly += (s.y - s.ly) * k
      const opacity = s.visible ? 1 : 0
      sun.style.opacity = String(opacity)
      sun.style.transform = `translate3d(${s.lx}px, ${s.ly}px, 0) scale(${s.scale})`
      // decay pulse
      s.scale += (1 - s.scale) * 0.15

      // trail: add point and draw fading path
      points.push({ x: s.lx, y: s.ly, life: 1 })
      if (points.length > 80) points.shift()

      // fade previous frame slightly
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, 0, canvas.width / dprRef.current, canvas.height / dprRef.current)
      ctx.globalCompositeOperation = 'lighter'

      // draw from oldest to newest with increasing alpha/width
      for (let i = 1; i < points.length; i++) {
        const a = (i / points.length)
        ctx.strokeStyle = `rgba(255,220,140,${0.05 + a * 0.12})`
        ctx.lineWidth = 0.6 + a * 2.2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(points[i - 1].x, points[i - 1].y)
        ctx.lineTo(points[i].x, points[i].y)
        ctx.stroke()
      }

      raf.current = requestAnimationFrame(step)
    }

    window.addEventListener('resize', resize)
    // use high-frequency pointer events when available
    const hasRaw = 'onpointerrawupdate' in window
    window.addEventListener(hasRaw ? 'pointerrawupdate' : 'pointermove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('mouseenter', onEnter)
    window.addEventListener('click', onClick)
    const onKey = (e) => {
      if ((e.key || '').toLowerCase() === 'c') {
        enabledRef.current = !enabledRef.current
        localStorage.setItem('sunCursorOff', enabledRef.current ? '0' : '1')
        applyEnabled()
      }
    }
    window.addEventListener('keydown', onKey)
    const onExternal = (e) => {
      if (typeof e.detail === 'boolean') {
        enabledRef.current = e.detail
        localStorage.setItem('sunCursorOff', enabledRef.current ? '0' : '1')
        applyEnabled()
      }
    }
    window.addEventListener('sunCursorSet', onExternal)
    raf.current = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointerrawupdate', onMove)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('mouseenter', onEnter)
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('sunCursorSet', onExternal)
    }
  }, [])

  return (
    <>
      <canvas ref={trailRef} className="cursor-canvas" aria-hidden />
      <div ref={sunRef} className="cursor-sun" aria-hidden>
        <span className="sun-core" />
        <span className="sun-rays" />
      </div>
    </>
  )
}
