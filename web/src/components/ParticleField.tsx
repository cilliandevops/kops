import { useEffect, useRef } from 'react'

/**
 * Soft drifting light that reveals the login page's own lattice, with a few particles
 * travelling along it.
 *
 * Cohesion with the page is the whole point, so this is deliberately not a sculpture
 * parked behind the layout. A handful of broad, slow light sources wash across the page,
 * and everything else is lit by that same field: the 28px grid from `.login-page`'s
 * background gets a dot at each intersection that swells where the light falls, and
 * particles trace paths along the grid lines themselves. The field also measures the
 * card and copy, so the lattice clears out under text and flares just outside the card,
 * which leaves the form looking seated in the light rather than covered by it.
 *
 * Two things carry the quality here. The wash provides the depth — small dark specks on
 * a near-white background read as dirt, whereas broad tonal variation reads as premium,
 * so the dots are a reveal on top of it rather than the effect itself. And the particles
 * stay on the lattice: free-floating motes at random angles read as scratches on the
 * page, while axis-aligned travellers reinforce the same grid everything else uses.
 *
 * Canvas 2D rather than a 3D library: a frame is four gradient fills plus a few batched
 * paths, so pulling WebGL onto the login route would buy nothing.
 */

/** Must match the grid step in `.login-page`'s background or the two layers beat. */
const GRID = 28

/** Every intersection stays visible, so the eye reads an ordered matrix first... */
const NODE_BASE = 0.075
/** ...and the light only decides how far each one swells above that. */
const NODE_GAIN = 0.4
const NODE_ALPHA_MAX = 0.48
/** Enough levels that the swell across a lit patch reads as a gradient, not as steps. */
const NODE_LEVELS = 8

/** Nodes of path history kept behind each traveller, so the trail spans ~4 grid steps. */
const TRAIL_NODES = 4
/** Chance a traveller carries straight on through a node rather than turning. */
const STRAIGHT_BIAS = 0.72
/** Share of travellers drawn in the brand accent. */
const ACCENT_RATIO = 0.35

/** Clearance around measured content, in px: dead zone, then ramp back to full. */
const CONTENT_PAD = 12
const CONTENT_FADE = 76

/**
 * Broad light sources. Each drifts on its own slow Lissajous path, which gives motion
 * that never repeats on a visible cycle without needing a noise field. `tint` picks
 * between the accent and the text colour so the wash carries a little hue variation.
 */
const LIGHTS = [
  { ax: 0.2, ay: 0.16, sx: 0.09, sy: 0.13, phx: 0.4, phy: 2.1, cx: 0.3, cy: 0.34, r: 0.72, w: 0.62, tint: 'accent' },
  { ax: 0.22, ay: 0.14, sx: 0.07, sy: 0.11, phx: 3.2, phy: 0.7, cx: 0.72, cy: 0.62, r: 0.66, w: 0.5, tint: 'ink' },
  { ax: 0.16, ay: 0.2, sx: 0.12, sy: 0.08, phx: 1.6, phy: 4.3, cx: 0.84, cy: 0.24, r: 0.48, w: 0.42, tint: 'accent' },
  { ax: 0.18, ay: 0.17, sx: 0.1, sy: 0.14, phx: 5.1, phy: 2.8, cx: 0.24, cy: 0.78, r: 0.52, w: 0.38, tint: 'ink' },
] as const

/** Peak wash opacity. Deliberately small — this reads as tone, not as a coloured blob. */
const WASH_ACCENT = 0.075
const WASH_INK = 0.04
/**
 * The wash is rendered at a quarter scale and upscaled. It is pure low-frequency
 * gradient, so the resample is invisible, and it turns four full-canvas gradient fills
 * per frame — by far the most expensive thing here — into four fills of a sixteenth the
 * area plus one hardware blit.
 */
const WASH_SCALE = 4
/**
 * Dark ink on a pale background has less perceptual contrast than pale ink on a dark
 * one, so the light themes need a nudge to land in the same place visually.
 */
const LIGHT_MODE_GAIN = 1.3

type ContentRect = {
  x: number
  y: number
  w: number
  h: number
  /** Light multiplier inside the rect. 0 goes fully dark. */
  floor: number
  /** Strength of the flare hugging the rect's edge. */
  halo: number
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

/**
 * Resolves any CSS colour to concrete channels via a 1x1 canvas.
 *
 * Needed because gradient stops have to be built as explicit `rgba()`. Fading a named
 * or hex colour to the `transparent` keyword interpolates towards transparent *black*,
 * which puts a dirty grey halo around every light on a pale background.
 */
function toRgb(color: string): [number, number, number] {
  const probe = document.createElement('canvas')
  probe.width = 1
  probe.height = 1
  const pctx = probe.getContext('2d')
  if (!pctx) return [24, 24, 27]
  pctx.fillStyle = '#000'
  pctx.fillStyle = color
  pctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = pctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

function readTheme(host: HTMLElement) {
  const s = getComputedStyle(host)
  const ink = s.getPropertyValue('--color-text').trim() || '#18181b'
  const accent = s.getPropertyValue('--color-cyan').trim() || '#0ea5e9'
  const gain = host.dataset.themeMode === 'dark' ? 1 : LIGHT_MODE_GAIN
  return { ink, accent, inkRgb: toRgb(ink), accentRgb: toRgb(accent), gain }
}

export function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    /*
     * On a phone the card covers most of the viewport, so the field would be occluded
     * anyway — not worth the battery. Matches how the rest of the app treats small
     * screens and coarse pointers.
     */
    const smallScreen = window.matchMedia('(max-width: 768px), (pointer: coarse)')

    let theme = readTheme(document.documentElement)
    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let last = 0
    /** Drives the light drift. */
    let clock = 0

    // --- content-aware falloff -------------------------------------------------
    let rects: ContentRect[] = []

    const measure = () => {
      const host = canvas.getBoundingClientRect()
      const next: ContentRect[] = []
      const add = (sel: string, floor: number, halo: number) => {
        const el = document.querySelector(sel)
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.width < 4 || r.height < 4) return
        next.push({ x: r.x - host.x, y: r.y - host.y, w: r.width, h: r.height, floor, halo })
      }
      // The card is opaque, so clear the lattice under it and let the flare tie it in.
      add('.login-card', 0, 1)
      /*
       * The brand copy sits on the bare background, so only damp the lattice there.
       * Clearing it the way the card does would cut a visible rectangle out of the
       * matrix, which looks like a bug rather than a composition.
       */
      add('.login-brand > div', 0.22, 0)
      rects = next
    }

    // --- light field -----------------------------------------------------------
    /** Live centre and radius per light, in px. Recomputed once per frame. */
    const lx = new Float32Array(LIGHTS.length)
    const ly = new Float32Array(LIGHTS.length)
    const lr = new Float32Array(LIGHTS.length)

    const placeLights = () => {
      const span = Math.min(width, height)
      for (let i = 0; i < LIGHTS.length; i++) {
        const L = LIGHTS[i]
        lx[i] = width * (L.cx + L.ax * Math.sin(clock * L.sx * 6.283 + L.phx))
        ly[i] = height * (L.cy + L.ay * Math.sin(clock * L.sy * 6.283 + L.phy))
        lr[i] = span * L.r
      }
    }

    const lightAtPoint = (x: number, y: number) => {
      let sum = 0
      for (let i = 0; i < LIGHTS.length; i++) {
        const dx = x - lx[i]
        const dy = y - ly[i]
        const q = (dx * dx + dy * dy) / (lr[i] * lr[i])
        // Gaussian falloff: soft-edged, so the reveal never shows a hard boundary.
        sum += LIGHTS[i].w * Math.exp(-2.2 * q)
      }
      return sum
    }

    /*
     * Sampled per grid intersection so the matrix, and the travellers reading it back,
     * are lit by exactly the same field. `shade` is kept separate from `light` so the
     * content falloff can also suppress the matrix's base brightness — folded into
     * `light` it would only dim the swell, leaving dots sitting on top of the card.
     */
    let light = new Float32Array(0)
    let shade = new Float32Array(0)
    let cols = 0
    let rows = 0

    const washCanvas = document.createElement('canvas')
    const washCtx = washCanvas.getContext('2d')

    const buildFields = () => {
      for (let r = 0; r < rows; r++) {
        const y = r * GRID
        for (let c = 0; c < cols; c++) {
          const x = c * GRID
          let scale = 1
          let halo = 0
          for (let i = 0; i < rects.length; i++) {
            const q = rects[i]
            const dx = Math.max(q.x - x, x - (q.x + q.w), 0)
            const dy = Math.max(q.y - y, y - (q.y + q.h), 0)
            const d = Math.sqrt(dx * dx + dy * dy)
            let t = (d - CONTENT_PAD) / CONTENT_FADE
            t = t < 0 ? 0 : t > 1 ? 1 : t
            const s = q.floor + (1 - q.floor) * smoothstep(t)
            if (s < scale) scale = s
            if (q.halo > 0) {
              // Bell peaking just inside full brightness, so the flare hugs the card.
              const k = (d - (CONTENT_PAD + CONTENT_FADE * 0.72)) / 42
              const g = Math.exp(-k * k) * q.halo
              if (g > halo) halo = g
            }
          }
          let v = lightAtPoint(x, y)
          if (v > 1) v = 1
          const idx = r * cols + c
          light[idx] = smoothstep(v) + halo * 0.6
          shade[idx] = scale
        }
      }
    }

    /** Bilinear read of one of the grid-aligned fields, in page px. */
    const sampleAt = (field: Float32Array, x: number, y: number) => {
      const gx = x / GRID
      const gy = y / GRID
      let c0 = Math.floor(gx)
      let r0 = Math.floor(gy)
      if (c0 < 0) c0 = 0
      if (r0 < 0) r0 = 0
      if (c0 > cols - 2) c0 = cols - 2
      if (r0 > rows - 2) r0 = rows - 2
      const tx = gx - c0
      const ty = gy - r0
      const base = r0 * cols + c0
      const a = field[base]
      const b = field[base + 1]
      const c = field[base + cols]
      const d = field[base + cols + 1]
      return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty
    }

    // --- travellers ------------------------------------------------------------
    let count = 0
    /** Node the traveller last passed through, in lattice coords. */
    let tc = new Int16Array(0)
    let tr = new Int16Array(0)
    /** Unit direction along the lattice, one axis at a time. */
    let tdx = new Int8Array(0)
    let tdy = new Int8Array(0)
    /** Progress along the current edge, 0 to 1. */
    let tp = new Float32Array(0)
    /** Edges per second. */
    let tspeed = new Float32Array(0)
    let tlife = new Float32Array(0)
    let tspan = new Float32Array(0)
    let taccent = new Uint8Array(0)
    /** Recent node positions in px, newest first. Stride is TRAIL_NODES * 2. */
    let trail = new Float32Array(0)

    const setDirection = (i: number, dx: number, dy: number) => {
      tdx[i] = dx
      tdy[i] = dy
    }

    const turn = (i: number) => {
      if (Math.random() < STRAIGHT_BIAS) return
      const dx = tdx[i]
      const dy = tdy[i]
      // Rotate a quarter turn either way. Never reverse: doubling back looks like a bug.
      if (Math.random() < 0.5) setDirection(i, dy, -dx)
      else setDirection(i, -dy, dx)
    }

    const spawn = (i: number, seeded: boolean) => {
      const c = Math.floor(Math.random() * cols)
      const r = Math.floor(Math.random() * rows)
      tc[i] = c
      tr[i] = r
      const axis = Math.random() < 0.5
      const sign = Math.random() < 0.5 ? -1 : 1
      setDirection(i, axis ? sign : 0, axis ? 0 : sign)
      tp[i] = Math.random()
      tspeed[i] = 0.85 + Math.random() * 1.15
      tspan[i] = 16 + Math.random() * 16
      // Stagger the first generation, or every traveller fades out on the same frame.
      tlife[i] = seeded ? Math.random() * tspan[i] : 0
      taccent[i] = Math.random() < ACCENT_RATIO ? 1 : 0
      // Collapse the trail onto the spawn point so it grows in rather than snapping.
      const base = i * TRAIL_NODES * 2
      for (let k = 0; k < TRAIL_NODES; k++) {
        trail[base + k * 2] = c * GRID
        trail[base + k * 2 + 1] = r * GRID
      }
    }

    const pushTrail = (i: number, x: number, y: number) => {
      const base = i * TRAIL_NODES * 2
      for (let k = TRAIL_NODES - 1; k > 0; k--) {
        trail[base + k * 2] = trail[base + (k - 1) * 2]
        trail[base + k * 2 + 1] = trail[base + (k - 1) * 2 + 1]
      }
      trail[base] = x
      trail[base + 1] = y
    }

    /** Returns true when the population was rebuilt and needs seeding. */
    const allocate = () => {
      /*
       * A handful only. These are an accent on the lattice; enough of them to look like
       * traffic and the page stops feeling calm enough to read a form on.
       */
      const next = Math.max(8, Math.min(44, Math.round((width * height) / 46000)))
      if (next === count) return false
      count = next
      tc = new Int16Array(count)
      tr = new Int16Array(count)
      tdx = new Int8Array(count)
      tdy = new Int8Array(count)
      tp = new Float32Array(count)
      tspeed = new Float32Array(count)
      tlife = new Float32Array(count)
      tspan = new Float32Array(count)
      taccent = new Uint8Array(count)
      trail = new Float32Array(count * TRAIL_NODES * 2)
      return true
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // The wash is upscaled on blit, so it never needs the device pixel ratio.
      washCanvas.width = Math.max(1, Math.ceil(width / WASH_SCALE))
      washCanvas.height = Math.max(1, Math.ceil(height / WASH_SCALE))
      cols = Math.max(2, Math.ceil(width / GRID) + 1)
      rows = Math.max(2, Math.ceil(height / GRID) + 1)
      light = new Float32Array(cols * rows)
      shade = new Float32Array(cols * rows)
      if (allocate()) {
        for (let i = 0; i < count; i++) spawn(i, true)
      } else {
        /*
         * Only rescue the travellers the new bounds left behind. Re-seeding all of them
         * would visibly reset the field on every frame of a window drag.
         */
        for (let i = 0; i < count; i++) {
          if (tc[i] > cols + 1 || tr[i] > rows + 1) spawn(i, true)
        }
      }
      measure()
    }

    const step = (dt: number) => {
      for (let i = 0; i < count; i++) {
        tlife[i] += dt
        if (tlife[i] > tspan[i]) {
          spawn(i, false)
          continue
        }
        tp[i] += tspeed[i] * dt
        // A slow traveller crosses at most one node per frame, but guard the general case.
        while (tp[i] >= 1) {
          tp[i] -= 1
          tc[i] += tdx[i]
          tr[i] += tdy[i]
          pushTrail(i, tc[i] * GRID, tr[i] * GRID)
          turn(i)
          if (tc[i] < -2 || tc[i] > cols + 1 || tr[i] < -2 || tr[i] > rows + 1) {
            spawn(i, false)
            break
          }
        }
      }
    }

    const paintWash = () => {
      if (!washCtx) return
      const ww = washCanvas.width
      const wh = washCanvas.height
      washCtx.clearRect(0, 0, ww, wh)
      for (let i = 0; i < LIGHTS.length; i++) {
        const isAccent = LIGHTS[i].tint === 'accent'
        const [r, g, b] = isAccent ? theme.accentRgb : theme.inkRgb
        const peak = (isAccent ? WASH_ACCENT : WASH_INK) * LIGHTS[i].w * theme.gain
        const cx = lx[i] / WASH_SCALE
        const cy = ly[i] / WASH_SCALE
        const rad = lr[i] / WASH_SCALE
        const grad = washCtx.createRadialGradient(cx, cy, 0, cx, cy, rad)
        grad.addColorStop(0, `rgba(${r},${g},${b},${peak})`)
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${peak * 0.42})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        washCtx.fillStyle = grad
        washCtx.fillRect(0, 0, ww, wh)
      }
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(washCanvas, 0, 0, ww, wh, 0, 0, width, height)
    }

    const paintNodes = () => {
      /*
       * A dot at every intersection of the lattice the page background already draws, so
       * the canvas extends the page's own structure instead of introducing new geometry.
       * Sizes stay whole pixels on whole-pixel centres: at 1-3px, anti-aliasing is the
       * difference between a crisp matrix and a smudge.
       */
      ctx.fillStyle = theme.ink
      const gain = theme.gain
      for (let l = 0; l < NODE_LEVELS; l++) {
        const t = (l + 0.5) / NODE_LEVELS
        const lo = (l / NODE_LEVELS) * NODE_ALPHA_MAX
        const hi = l === NODE_LEVELS - 1 ? Infinity : ((l + 1) / NODE_LEVELS) * NODE_ALPHA_MAX
        const size = t < 0.4 ? 1 : t < 0.75 ? 2 : 3
        const off = size >> 1
        ctx.globalAlpha = t * NODE_ALPHA_MAX
        ctx.beginPath()
        let any = false
        for (let r = 0; r < rows; r++) {
          const rowBase = r * cols
          for (let c = 0; c < cols; c++) {
            const idx = rowBase + c
            const a = (NODE_BASE + light[idx] * NODE_GAIN) * shade[idx] * gain
            if (a < 0.012 || a < lo || a >= hi) continue
            ctx.rect(c * GRID - off, r * GRID - off, size, size)
            any = true
          }
        }
        if (any) ctx.fill()
      }
    }

    const paintTravellers = () => {
      /*
       * Trails run along the grid lines the page already paints, so a traveller looks
       * like the existing lattice carrying something rather than new geometry crossing
       * it.
       *
       * Drawn one traveller at a time rather than batched by segment. Batching forces a
       * single alpha per batch, which meant the content falloff could not be applied per
       * segment and trails drew straight over the card. There are at most a few dozen
       * travellers with four segments each, so the extra draw calls are noise.
       */
      ctx.lineCap = 'butt'
      ctx.lineWidth = 1
      for (let i = 0; i < count; i++) {
        const hx = tc[i] * GRID + tdx[i] * tp[i] * GRID
        const hy = tr[i] * GRID + tdy[i] * tp[i] * GRID

        const age = tlife[i]
        const total = tspan[i]
        const edge = 1.6
        let fade = 1
        if (age < edge) fade = age / edge
        else if (age > total - edge) fade = (total - age) / edge
        if (fade <= 0) continue

        const isAccent = taccent[i] === 1
        const color = isAccent ? theme.accent : theme.ink
        const trailPeak = (isAccent ? 0.3 : 0.22) * fade * theme.gain
        const base = i * TRAIL_NODES * 2

        ctx.strokeStyle = color
        for (let seg = TRAIL_NODES - 1; seg >= 0; seg--) {
          const ax = seg === 0 ? hx : trail[base + (seg - 1) * 2]
          const ay = seg === 0 ? hy : trail[base + (seg - 1) * 2 + 1]
          const bx = trail[base + seg * 2]
          const by = trail[base + seg * 2 + 1]
          if (ax === bx && ay === by) continue
          // Midpoint is enough: a segment is one grid step, so shade barely varies across it.
          const dim = sampleAt(shade, (ax + bx) / 2, (ay + by) / 2)
          if (dim <= 0.02) continue
          const decay = 1 - seg / TRAIL_NODES
          const a = trailPeak * decay * decay * dim
          if (a < 0.008) continue
          ctx.globalAlpha = a
          ctx.beginPath()
          // Half-pixel offsets keep the trail on the same device pixels as the CSS grid.
          ctx.moveTo(ax + 0.5, ay + 0.5)
          ctx.lineTo(bx + 0.5, by + 0.5)
          ctx.stroke()
        }

        // Head last, as a crisp 2px square.
        if (hx < -4 || hx > width + 4 || hy < -4 || hy > height + 4) continue
        const lit = sampleAt(light, hx, hy)
        const dim = sampleAt(shade, hx, hy)
        const a = (0.3 + lit * 0.45) * dim * fade * theme.gain
        if (a < 0.01) continue
        ctx.fillStyle = color
        ctx.globalAlpha = a > 0.75 ? 0.75 : a
        ctx.fillRect(Math.round(hx) - 1, Math.round(hy) - 1, 2, 2)
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      if (width < 2 || height < 2 || smallScreen.matches) return
      placeLights()
      buildFields()
      paintWash()
      paintNodes()
      paintTravellers()
      ctx.globalAlpha = 1
    }

    /* Motion this slow looks identical at 30fps and costs half as much when idle. */
    const FRAME_MS = 1000 / 30

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const elapsed = last ? now - last : FRAME_MS
      if (elapsed < FRAME_MS) return
      last = now
      // Cap dt so a backgrounded tab does not teleport everything on return.
      const dt = Math.min(elapsed, 120) / 1000
      clock += dt * 0.03
      step(dt)
      draw()
    }

    const start = () => {
      if (raf || reduceMotion || smallScreen.matches) return
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    resize()
    // Let the travellers lay down a trail, so even a static first frame has direction.
    for (let i = 0; i < 60; i++) step(1 / 30)
    draw()
    start()

    const onResize = () => {
      resize()
      draw()
    }
    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }
    // Narrowing a desktop window must stop the loop, not just blank a frame.
    const onSmallScreenChange = () => {
      if (smallScreen.matches) stop()
      else start()
      draw()
    }
    // Theme switches rewrite the variables this samples.
    const themeObserver = new MutationObserver(() => {
      theme = readTheme(document.documentElement)
      draw()
    })
    /*
     * Switching to the register form or surfacing an error grows the card, so the
     * carve-out has to be re-measured rather than sampled once on mount.
     */
    const layoutObserver = new ResizeObserver(() => {
      measure()
      if (reduceMotion || smallScreen.matches) draw()
    })
    const card = document.querySelector('.login-card')
    const brand = document.querySelector('.login-brand > div')
    if (card) layoutObserver.observe(card)
    if (brand) layoutObserver.observe(brand)

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    smallScreen.addEventListener('change', onSmallScreenChange)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-theme-mode', 'style'],
    })

    return () => {
      stop()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      smallScreen.removeEventListener('change', onSmallScreenChange)
      themeObserver.disconnect()
      layoutObserver.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}
