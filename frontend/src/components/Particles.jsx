import { useEffect, useRef } from 'react'

export default function Particles({ seed, theme = 'default', speed = 1, density = 1, blackHoles: blackHoleFactor = 1, shooters: shootersEnabled = true, enabled = true }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = 0, height = 0, dpr = Math.max(1, window.devicePixelRatio || 1)

    const mouse = { x: null, y: null, active: false }
    const particles = []
    let galaxies = []
    let blackHoles = []
    let nebulae = []
    let milky = []
    const shootingStars = []
    let lastT = performance.now()

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Prime background with deep-space vertical gradient
      const g = ctx.createLinearGradient(0, 0, 0, height)
      g.addColorStop(0, '#05070d')
      g.addColorStop(0.5, '#0b1323')
      g.addColorStop(1, '#05070d')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, width, height)
    }

    // Seeded RNG (mulberry32) if seed provided
    let rng = Math.random
    if (seed) {
      let h = 0
      for (let i = 0; i < String(seed).length; i++) h = Math.imul(31, h) + String(seed).charCodeAt(i) | 0
      let a = h >>> 0
      rng = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296 }
    }
    const rand = (min, max) => rng() * (max - min) + min
    const choice = (arr) => arr[Math.floor(rng() * arr.length)]

    const initUniverse = () => {
      // Determine galaxy count from screen area
      const area = width * height
      const count = Math.max(3, Math.min(7, Math.round(area / (450000 / density))))
      const marginX = width * 0.15
      const marginY = height * 0.2
      galaxies = new Array(count).fill(0).map((_, i) => {
        const gx = rand(marginX, width - marginX)
        const gy = rand(marginY, height - marginY)
        const maxR = rand(Math.min(width, height) * 0.22, Math.min(width, height) * 0.4)
        // slightly faster rotation; scale with speed
        const spin = choice([rand(0.005, 0.014), -rand(0.005, 0.014)]) * speed // base angular vel
        const arms = choice([2, 3, 4])
        const tight = rand(0.015, 0.035) // spiral tightness
        const coreGlow = rand(0.6, 1.0)
        // palette by theme
        let hues
        switch (theme) {
          case 'cool': hues = [rand(200, 235), rand(225, 255), rand(260, 290)]; break
          case 'warm': hues = [rand(15, 35), rand(35, 55), rand(280, 300)]; break
          case 'neon': hues = [rand(290, 320), rand(170, 200), rand(200, 230)]; break
          default: hues = [rand(205, 235), rand(220, 245), rand(30, 45)]
        }
        const palette = { hues, bias: 'stellar' }
        // slow drift velocity
        const vx = rand(-0.10, 0.10) * speed
        const vy = rand(-0.06, 0.06) * speed
        // wandering orbit around a moving base to feel alive
        const bx = gx, by = gy
        const ampX = rand(40, 120)
        const ampY = rand(30, 90)
        const ws = rand(0.05, 0.12) * speed // rad/sec
        const phx = rand(0, Math.PI * 2)
        const phy = rand(0, Math.PI * 2)
        return { cx: gx, cy: gy, maxR, spin, arms, tight, coreGlow, palette, vx, vy, bx, by, ampX, ampY, ws, phx, phy }
      })

      // Define black holes (~40% of galaxy count)
      const bhCount = Math.max(3, Math.round(galaxies.length * 0.4 * blackHoleFactor))
      blackHoles = new Array(bhCount).fill(0).map(() => {
        const x = rand(width * 0.2, width * 0.8)
        const y = rand(height * 0.25, height * 0.75)
        const mass = rand(2500, 7000) * blackHoleFactor // stronger gravity
        const horizon = rand(18, 34) // visual radius
        const influence = horizon * 16
        // slower drift for black holes
        const vx = rand(-0.06, 0.06) * Math.max(0.5, speed * 0.8)
        const vy = rand(-0.04, 0.04) * Math.max(0.5, speed * 0.8)
        return { x, y, mass, horizon, influence, vx, vy }
      })

      // Nebula clouds (3–6) drifting slowly
      const nebCount = rand(3, 7) | 0
      nebulae = new Array(nebCount).fill(0).map(() => {
        const x = rand(-width * 0.2, width * 1.2)
        const y = rand(-height * 0.2, height * 1.2)
        const r = rand(Math.min(width, height) * 0.2, Math.min(width, height) * 0.45)
        const hue = choice([rand(200, 225), rand(225, 245), rand(190, 205)])
        const sat = rand(20, 45)
        const light = rand(30, 50)
        const alpha = rand(0.025, 0.05)
        const vx = rand(-0.02, 0.02)
        const vy = rand(-0.01, 0.01)
        return { x, y, r, hue, sat, light, alpha, vx, vy }
      })

      // Milky Way band: diagonal cluster haze segments
      const segs = 20
      const x0 = -width * 0.2, y0 = height * 0.2
      const x1 = width * 1.2, y1 = height * 0.8
      const vx = x1 - x0, vy = y1 - y0
      const len = Math.hypot(vx, vy) || 1
      const ux = vx / len, uy = vy / len
      milky = new Array(segs).fill(0).map((_, i) => {
        const t = i / (segs - 1)
        const x = x0 + (x1 - x0) * t + rand(-40, 40)
        const y = y0 + (y1 - y0) * t + rand(-30, 30)
        const rx = rand(120, 240)
        const ry = rand(40, 90)
        const rot = Math.atan2(y1 - y0, x1 - x0) + rand(-0.1, 0.1)
        const alpha = rand(0.015, 0.04) // dimmer so UI stays readable
        const speed = rand(0.25, 0.6)
        return { x, y, rx, ry, rot, alpha, ux, uy, speed }
      })
    }

    const initParticles = () => {
      particles.length = 0
      const baseCount = Math.floor((width * height) / (9000 / density))
      const targetCount = Math.max(300, Math.min(900, baseCount))
      for (let i = 0; i < targetCount; i++) {
        const g = choice(galaxies)
        // spiral arm bias
        const arm = (Math.random() * g.arms) | 0
        const base = arm * (Math.PI * 2 / g.arms)
        const radius = Math.max(12, Math.pow(Math.random(), 0.45) * g.maxR)
        // theta biased along base arm plus jitter + radius-based curl
        const angle = base + radius * g.tight + rand(-0.25, 0.25)
        const av = (g.spin + rand(-0.003, 0.003)) // inherit galaxy spin with jitter
        const rv = rand(-0.02, 0.02) * speed

        // near-white stellar palette with subtle temperature variance
        const baseHue = choice(g.palette.hues)
        const bright = Math.random() < 0.6
        const light = bright ? rand(78, 96) : rand(55, 72)
        const sat = bright ? rand(8, 25) : rand(10, 30)
        const r = bright ? rand(1.2, 2.2) : rand(0.6, 1.4)
        const twSpeed = rand(0.8, 3.5)
        const twPhase = rand(0, Math.PI * 2)

        particles.push({
          angle, radius, av, rv, r,
          hue: baseHue, sat, light, twSpeed, twPhase,
          gIndex: galaxies.indexOf(g)
        })
      }
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = (e.clientX - rect.left)
      mouse.y = (e.clientY - rect.top)
      mouse.active = true
    }
    const onLeave = () => { mouse.active = false }

    const step = (now) => {
      if (!enabled) {
        // When disabled, keep canvas cleared and schedule next frame
        ctx.clearRect(0, 0, width, height)
        rafRef.current = requestAnimationFrame(step)
        return
      }
      // normalized to 60fps frames (16.67ms)
      const dt60 = Math.min(3, (now - lastT) / 16.67)
      lastT = now

      // motion trails: translucent dark overlay (slightly lighter to show motion)
      ctx.fillStyle = 'rgba(5,7,13,0.08)'
      ctx.fillRect(0, 0, width, height)

      // Move galaxy bases with wrap; center wanders around base in a slow Lissajous
      const timeSec = now * 0.001
      for (const g of galaxies) {
        g.bx += g.vx * dt60
        g.by += g.vy * dt60
        if (g.bx < -g.maxR) g.bx = width + g.maxR
        if (g.bx > width + g.maxR) g.bx = -g.maxR
        if (g.by < -g.maxR) g.by = height + g.maxR
        if (g.by > height + g.maxR) g.by = -g.maxR
        g.cx = g.bx + Math.cos(timeSec * g.ws + g.phx) * g.ampX
        g.cy = g.by + Math.sin(timeSec * g.ws * 0.85 + g.phy) * g.ampY
      }

      // Milky Way band (diagonal haze drifting along its axis)
      for (const m of milky) {
        m.x += m.ux * m.speed * dt60
        m.y += m.uy * m.speed * dt60
        if (m.x < -width * 0.4 || m.y < -height * 0.4 || m.x > width * 1.4 || m.y > height * 1.4) {
          // wrap back near origin with small jitter
          m.x -= m.ux * (width * 1.6)
          m.y -= m.uy * (height * 1.2)
        }
        ctx.save()
        ctx.translate(m.x, m.y)
        ctx.rotate(m.rot)
        ctx.scale(1, m.ry / m.rx)
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, m.rx)
        grad.addColorStop(0, `rgba(255,255,255,${m.alpha})`)
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(0, 0, m.rx, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // draw drifting nebulae softly
      for (const n of nebulae) {
        n.x += n.vx * dt60
        n.y += n.vy * dt60
        // wrap around edges
        if (n.x < -n.r) n.x = width + n.r
        if (n.x > width + n.r) n.x = -n.r
        if (n.y < -n.r) n.y = height + n.r
        if (n.y > height + n.r) n.y = -n.r
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        grad.addColorStop(0, `hsla(${n.hue} ${n.sat}% ${n.light}% / ${n.alpha})`)
        grad.addColorStop(0.6, `hsla(${n.hue} ${n.sat}% ${Math.max(10, n.light-10)}% / ${n.alpha * 0.5})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // update + draw stars
      // galaxy cores glow (behind stars)
      for (const g of galaxies) {
        const grad = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.maxR * 0.5)
        grad.addColorStop(0, `rgba(255,255,245,${0.12 * g.coreGlow})`)
        grad.addColorStop(1, 'rgba(255,255,245,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(g.cx, g.cy, g.maxR * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }

      const positions = new Array(particles.length)
      for (let idx = 0; idx < particles.length; idx++) {
        const p = particles[idx]
        const g = galaxies[p.gIndex]
        // swirl update around galaxy core with spiral bias
        p.angle += p.av * dt60
        p.radius += p.rv * dt60
        if (p.radius < 16) { p.radius = 16; p.rv *= -1 }
        if (p.radius > g.maxR) { p.radius = g.maxR; p.rv *= -1 }

        // logarithmic spiral position: angle plus radius-based curl
        const theta = p.angle + p.radius * g.tight
        let x = g.cx + Math.cos(theta) * p.radius
        let y = g.cy + Math.sin(theta) * p.radius

        // black hole gravity influence and drift
        for (const bh of blackHoles) {
          bh.x += bh.vx * dt60
          bh.y += bh.vy * dt60
          if (bh.x < -50) bh.x = width + 50
          if (bh.x > width + 50) bh.x = -50
          if (bh.y < -50) bh.y = height + 50
          if (bh.y > height + 50) bh.y = -50
          const dx = bh.x - x
          const dy = bh.y - y
          const d2 = dx*dx + dy*dy
          const d = Math.sqrt(d2)
          if (d < bh.influence) {
            const grav = (bh.mass / (d2 + 200)) * dt60
            // Nudge orbit toward BH: shrink radius and speed up angle near BH
            p.radius -= grav * 4
            p.av += (dx * -Math.sin(p.angle) + dy * Math.cos(p.angle)) * 0.00001 * dt60
          }
          if (d < bh.horizon) {
            // Respawn far from hole within its galaxy
            p.radius = rand(bh.horizon + 60, g.maxR)
            p.angle = rand(0, Math.PI * 2)
            p.av *= choice([1, -1])
          }
        }

        // gentle mouse gravity toward cursor
        if (mouse.active && mouse.x != null) {
          const dx = mouse.x - x
          const dy = mouse.y - y
          x += dx * 0.015 * dt60
          y += dy * 0.015 * dt60
        }

        positions[idx] = { x, y }

        // twinkle alpha
        const a = 0.5 + 0.5 * Math.sin(now * 0.001 * p.twSpeed + p.twPhase)
        ctx.beginPath()
        ctx.arc(x, y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue} ${p.sat}% ${p.light}% / ${a})`
        ctx.fill()
      }

      // removed network lines to keep look natural

      // draw black holes with dark core and subtle accretion ring
      const t = now * 0.001
      for (const bh of blackHoles) {
        // core
        const ggrad = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, bh.horizon * 2.5)
        ggrad.addColorStop(0, 'rgba(0,0,0,1)')
        ggrad.addColorStop(0.7, 'rgba(0,0,0,0.7)')
        ggrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = ggrad
        ctx.beginPath()
        ctx.arc(bh.x, bh.y, bh.horizon * 2.2, 0, Math.PI * 2)
        ctx.fill()

        // accretion ring (rotating arc)
        ctx.save()
        ctx.translate(bh.x, bh.y)
        ctx.rotate(t * 0.6)
        ctx.strokeStyle = 'rgba(240, 200, 150, 0.28)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(0, 0, bh.horizon * 2.8, Math.PI * 0.15, Math.PI * 0.55)
        ctx.stroke()
        ctx.rotate(Math.PI)
        ctx.beginPath()
        ctx.arc(0, 0, bh.horizon * 2.8, Math.PI * 0.15, Math.PI * 0.45)
        ctx.stroke()
        ctx.restore()
      }

      // occasional shooting stars
      if (shootersEnabled && rng() < 0.04 * dt60 && shootingStars.length < 4) {
        const fromTop = Math.random() < 0.5
        const x = fromTop ? rand(-50, width * 0.3) : rand(width * 0.7, width + 50)
        const y = fromTop ? rand(-50, height * 0.25) : rand(-50, height * 0.25)
        const spd = rand(6, 12) * speed
        const angle = fromTop ? rand(Math.PI * 0.10, Math.PI * 0.25) : rand(Math.PI * 0.75, Math.PI * 0.90)
        shootingStars.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: rand(24, 48) })
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i]
        s.x += s.vx * dt60
        s.y += s.vy * dt60
        s.life -= dt60
        // draw streak
        const len = 20
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - s.vx * len * 0.1, s.y - s.vy * len * 0.1)
        ctx.stroke()
        if (s.life <= 0 || s.x < -100 || s.x > width + 100 || s.y > height + 100) {
          shootingStars.splice(i, 1)
        }
      }

      rafRef.current = requestAnimationFrame(step)
    }

    const onResize = () => { resize(); initUniverse(); initParticles() }

    resize()
    initUniverse()
    initParticles()
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', onResize)
    rafRef.current = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [seed, theme, speed, density, blackHoleFactor, shootersEnabled, enabled])

  return <canvas ref={canvasRef} className="bg-canvas" aria-hidden />
}


