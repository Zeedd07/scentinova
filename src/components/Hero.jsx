/**
 * Editorial hero: canvas frame sequence drawn by a single RAF loop.
 * Each scroll / swipe plays one story beat between the stops below; the last beat hands straight off to the collection.
 * The frame set (landscape / portrait) is chosen by the parent.
 */
import { useEffect, useId, useRef, useState, startTransition } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { isFrameDrawable, frameSize } from '../hooks/useFrameSequence'
import { chapterAt } from '../data/storyChapters'
import Particles from './Particles'
import { useLenis } from './SmoothScroll'
import { easeOutExpo, fadeUp } from '../lib/motion'
import { smoothScrollTo } from '../lib/smoothScroll'

const BG = '#0d0c0b'

/** Frames each scroll / swipe moves between, in order. */
const MOBILE_STOPS = [1, 106, 175, 263, 350, 430, 600]
const DESKTOP_STOPS = [1, 160, 425, 550, 600]
const MAX_BEAT_SECONDS = 2.8
/** The closing beat stays short: the page moves on to the collection as soon as it ends. */
const FINAL_BEAT_SECONDS = 1.6
/** Finger travel (px) that counts as one swipe. */
const SWIPE_PX = 24
const WHEEL_DELTA = 20
/** Silence (ms) that ends a wheel / trackpad burst, so inertia counts as one step. */
const WHEEL_IDLE_MS = 200

function goToCollection(lenis) {
  const el = document.getElementById('collection')
  if (!el) return
  const navH = document.querySelector('.site-nav')?.getBoundingClientRect().height || 56
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 8
  if (lenis) lenis.scrollTo(top, { offset: 0, duration: 1.2 })
  else smoothScrollTo(top)
}

/** Replays the gauge's mist: 'puff' for a story beat, 'burst' for the closing one. */
function sprayGauge(gauge, kind) {
  if (!gauge) return
  delete gauge.dataset.spray
  // Reflow so the CSS animations restart when the same kind fires twice in a row
  void gauge.offsetWidth
  gauge.dataset.spray = kind
}

const CAP_KNURLS = [14, 16, 18, 20, 22, 24, 26]
/** Mist droplets: end offset (dx, dy) from the nozzle, radius, delay (s); `burst` ones only show on the closing spray. */
const MIST = [
  { dx: -14, dy: -5, r: 1.6, delay: 0 },
  { dx: -19, dy: -1, r: 2.1, delay: 0.04 },
  { dx: -16, dy: 3, r: 1.4, delay: 0.08 },
  { dx: -23, dy: -7, r: 1.2, delay: 0.1 },
  { dx: -25, dy: 1, r: 1.8, delay: 0.14 },
  { dx: -30, dy: -4, r: 2.4, delay: 0.18, burst: true },
  { dx: -34, dy: 3, r: 1.7, delay: 0.24, burst: true },
  { dx: -28, dy: -10, r: 1.5, delay: 0.3, burst: true },
  { dx: -38, dy: -2, r: 2.2, delay: 0.38, burst: true },
  { dx: -21, dy: 6, r: 1.3, delay: 0.44, burst: true },
]

/**
 * Upright perfume flacon that starts full and drains as the story plays, misting from its atomiser on each beat.
 * The liquid follows `--p` (0-1), set straight on the element by the RAF loop.
 */
function ScrollGauge({ ref, label, initial }) {
  const id = useId().replace(/:/g, '')
  return (
    <div
      ref={ref}
      className="hero-gauge flex flex-col items-center gap-2"
      style={{ '--p': initial }}
      data-idle={initial < 0.005 ? 'true' : 'false'}
    >
      <svg viewBox="0 0 40 74" className="h-14 w-auto overflow-visible sm:h-[4.5rem]" aria-hidden>
        <defs>
          <linearGradient id={`${id}-cap`} x1="0" x2="1">
            <stop offset="0" stopColor="#7d5e22" />
            <stop offset="0.35" stopColor="#f3e2b3" />
            <stop offset="0.6" stopColor="#c9a24a" />
            <stop offset="1" stopColor="#6e521d" />
          </linearGradient>
          <linearGradient id={`${id}-glass`} x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0.02" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.07" />
          </linearGradient>
          <linearGradient id={`${id}-liquid`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0d58f" />
            <stop offset="0.25" stopColor="#d4af5a" />
            <stop offset="1" stopColor="#9a7428" />
          </linearGradient>
          <clipPath id={`${id}-body`}>
            <rect x="5" y="25" width="30" height="46" rx="5" />
          </clipPath>
        </defs>

        <g className="hero-gauge-mists">
          {MIST.map((m, i) => (
            <circle
              key={i}
              className={m.burst ? 'hero-gauge-mist hero-gauge-mist-burst' : 'hero-gauge-mist'}
              cx="15"
              cy="21.5"
              r={m.r}
              fill="#f3e2b3"
              style={{ '--dx': `${m.dx}px`, '--dy': `${m.dy}px`, '--delay': `${m.delay}s` }}
            />
          ))}
        </g>

        <g className="hero-gauge-cap">
          <rect x="11" y="1" width="18" height="15" rx="2" fill={`url(#${id}-cap)`} />
          {CAP_KNURLS.map((x) => (
            <line key={x} x1={x} y1="3" x2={x} y2="14" stroke="#000" strokeOpacity="0.22" strokeWidth="0.6" />
          ))}
          <rect x="13" y="16" width="14" height="3" fill="#a8842f" />
        </g>
        <rect x="15.5" y="19" width="9" height="5" fill="#fff" fillOpacity="0.06" stroke="#c9a24a" strokeOpacity="0.5" strokeWidth="0.6" />
        <circle cx="15.5" cy="21.5" r="0.7" fill="#0d0c0b" stroke="#c9a24a" strokeOpacity="0.6" strokeWidth="0.3" />

        <rect x="4" y="24" width="32" height="48" rx="6" fill="#141210" fillOpacity="0.6" />
        <g clipPath={`url(#${id}-body)`}>
          <rect
            className="hero-gauge-liquid"
            x="5"
            y="25"
            width="30"
            height="46"
            fill={`url(#${id}-liquid)`}
          />
          <rect className="hero-gauge-shine" x="-14" y="20" width="10" height="56" fill="#fff" fillOpacity="0.22" transform="skewX(-18)" />
        </g>
        <rect x="4" y="24" width="32" height="48" rx="6" fill={`url(#${id}-glass)`} stroke="#d4af5a" strokeOpacity="0.65" strokeWidth="0.9" />
        <rect x="7.5" y="27.5" width="25" height="41" rx="3.5" fill="none" stroke="#fff" strokeOpacity="0.09" strokeWidth="0.6" />
        <rect x="11" y="41" width="18" height="13" rx="1" fill="#0d0c0b" fillOpacity="0.75" stroke="#c9a24a" strokeOpacity="0.7" strokeWidth="0.6" />
        <line x1="14" y1="47.5" x2="26" y2="47.5" stroke="#c9a24a" strokeOpacity="0.6" strokeWidth="0.5" />
        <line x1="8" y1="30" x2="8" y2="62" stroke="#fff" strokeOpacity="0.28" strokeWidth="0.9" strokeLinecap="round" />
      </svg>
      <span className="text-[8px] tracking-[0.42em] text-warm-white/50 uppercase sm:text-[9px]">
        {label}
      </span>
    </div>
  )
}

export default function Hero({
  getFrame,
  getExactFrame,
  priorityReady,
  totalFrames,
  isMobile,
}) {
  const pinRef = useRef(null)
  const stickyRef = useRef(null)
  const canvasRef = useRef(null)
  const lenis = useLenis()

  const frameState = useRef({
    current: 1,
    target: 1,
    lastDrawn: -1,
    lastDrawnExact: false,
    lastGood: 1,
    pendingProgress: null,
    visible: true,
    running: false,
    /** @type {CanvasImageSource|null} */
    lastDrawable: null,
  })
  const coverRef = useRef({
    cw: 0,
    ch: 0,
    cssW: 0,
    cssH: 0,
    dpr: 1,
    // keyed by aspect ratio string → { dw, dh, dx, dy }
    cache: new Map(),
  })
  const rafRef = useRef(0)
  const chapterIdRef = useRef(null)
  const progressRef = useRef(0)
  const gaugeRef = useRef(null)
  const lenisRef = useRef(lenis)
  const lastTsRef = useRef(0)
  const showEndCtaRef = useRef(false)

  const [ready, setReady] = useState(false)
  const [chapter, setChapter] = useState(null)
  const [showEndCta, setShowEndCta] = useState(false)

  useEffect(() => {
    lenisRef.current = lenis
  }, [lenis])

  useEffect(() => {
    if (priorityReady || isMobile) {
      const t = setTimeout(() => setReady(true), 220)
      return () => clearTimeout(t)
    }
    return undefined
  }, [priorityReady, isMobile])

  // ── Canvas + single RAF loop ──────────────────────────────────────────
  useEffect(() => {
    if (!priorityReady) return undefined
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d', {
      alpha: false,
      colorSpace: 'srgb',
      willReadFrequently: false,
    })
    if (!ctx) return undefined

    const smoothingQuality = isMobile ? 'medium' : 'high'
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = smoothingQuality

    // The frame set may have changed (orientation flip); never paint a stale set
    frameState.current.lastDrawable = null
    frameState.current.lastDrawn = -1
    frameState.current.lastDrawnExact = false

    let resizeTimer = 0

    const computeCover = (iw, ih, cw, ch) => {
      const key = `${iw}x${ih}@${cw}x${ch}`
      const cached = coverRef.current.cache.get(key)
      if (cached) return cached

      const ir = iw / ih
      const cr = cw / ch
      let dw
      let dh
      let dx
      let dy
      if (cr > ir) {
        dw = cw
        dh = cw / ir
        dx = 0
        dy = (ch - dh) / 2
      } else {
        dh = ch
        dw = ch * ir
        dx = (cw - dw) / 2
        dy = 0
      }

      const rect = { dw, dh, dx, dy }
      coverRef.current.cache.set(key, rect)
      return rect
    }

    const resize = () => {
      const rawDpr = window.devicePixelRatio || 1
      const dpr = Math.min(rawDpr, isMobile ? 1.5 : 2)
      const { clientWidth: w, clientHeight: h } = canvas
      if (w < 2 || h < 2) return

      // Avoid clearing the bitmap on iOS URL-bar / visualViewport jitter
      if (
        coverRef.current.cssW === w &&
        coverRef.current.cssH === h &&
        coverRef.current.dpr === dpr
      ) {
        return
      }

      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = smoothingQuality
      coverRef.current.cw = w
      coverRef.current.ch = h
      coverRef.current.cssW = w
      coverRef.current.cssH = h
      coverRef.current.dpr = dpr
      coverRef.current.cache.clear()
      frameState.current.lastDrawn = -1
      frameState.current.lastDrawnExact = false
      drawFrame(frameState.current.current)
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(resize, 250)
    }

    function resolveImage(index) {
      const rounded = Math.round(index)
      const direct = getExactFrame(rounded)
      if (isFrameDrawable(direct)) {
        frameState.current.lastGood = rounded
        return { img: direct, drawnIndex: rounded }
      }

      // Nearest loaded neighbour while the background pass fills gaps
      const nearest = getFrame(rounded)
      if (isFrameDrawable(nearest)) {
        return { img: nearest, drawnIndex: -1 }
      }

      if (isFrameDrawable(frameState.current.lastDrawable)) {
        return {
          img: frameState.current.lastDrawable,
          drawnIndex: frameState.current.lastGood,
        }
      }
      return null
    }

    function flushUiChrome(progress) {
      progressRef.current = progress
      const gauge = gaugeRef.current
      if (gauge) {
        gauge.style.setProperty('--p', progress.toFixed(4))
        gauge.dataset.idle = progress < 0.005 ? 'true' : 'false'
      }

      const next = chapterAt(progress)
      if (next.id !== chapterIdRef.current) {
        chapterIdRef.current = next.id
        startTransition(() => setChapter(next))
      }

      const atEnd = progress >= 0.88
      if (atEnd !== showEndCtaRef.current) {
        showEndCtaRef.current = atEnd
        setShowEndCta(atEnd)
      }
    }

    function paintDrawable(img, cw, ch) {
      const { w: iw, h: ih } = frameSize(img)
      if (iw < 1 || ih < 1) return false
      const { dw, dh, dx, dy } = computeCover(iw, ih, cw, ch)
      // Always fill first on mobile - prevents black bars / cleared-canvas flashes
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, cw, ch)
      ctx.drawImage(img, dx, dy, dw, dh)
      return true
    }

    function drawFrame(index) {
      const rounded = Math.round(index)
      if (
        rounded === frameState.current.lastDrawn &&
        frameState.current.lastDrawnExact
      ) {
        return
      }

      const cw = coverRef.current.cw || canvas.clientWidth
      const ch = coverRef.current.ch || canvas.clientHeight
      if (cw < 2 || ch < 2) return

      const resolved = resolveImage(rounded)
      if (!resolved) {
        // Hold last frame - never leave a wiped/black canvas mid-scrub
        if (isFrameDrawable(frameState.current.lastDrawable)) {
          paintDrawable(frameState.current.lastDrawable, cw, ch)
        }
        return
      }

      const { img, drawnIndex } = resolved
      const exact = drawnIndex === rounded
      if (!paintDrawable(img, cw, ch)) return

      frameState.current.lastDrawable = img
      frameState.current.lastDrawn = rounded
      frameState.current.lastDrawnExact = exact
    }

    // Snappier on mobile so we spend less time between sparse loaded frames
    const easeFactor = isMobile ? 0.55 : 0.28

    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop)
      if (!frameState.current.visible) {
        lastTsRef.current = ts
        return
      }

      const prev = lastTsRef.current || ts
      const dtMs = Math.min(50, Math.max(1, ts - prev))
      lastTsRef.current = ts

      const { current, target, pendingProgress } = frameState.current
      const delta = target - current

      if (Math.abs(delta) < 0.0005) {
        if (current !== target) {
          frameState.current.current = target
          drawFrame(target)
        } else if (
          !frameState.current.lastDrawnExact &&
          getExactFrame(Math.round(target))
        ) {
          drawFrame(target)
        }
      } else {
        // Frame-rate independent lerp (normalized to 60fps / 16.67ms)
        const t = 1 - Math.pow(1 - easeFactor, dtMs / 16.67)
        const next = current + delta * t
        frameState.current.current = next
        drawFrame(next)
      }

      if (pendingProgress != null) {
        frameState.current.pendingProgress = null
        flushUiChrome(pendingProgress)
      }
    }

    resize()
    const startFrame = frameState.current.target
    frameState.current.current = startFrame
    drawFrame(startFrame)
    frameState.current.pendingProgress = null
    flushUiChrome((startFrame - 1) / (totalFrames - 1))
    lastTsRef.current = 0
    frameState.current.running = true
    rafRef.current = requestAnimationFrame(loop)

    const ioTarget = stickyRef.current || canvas
    const io = new IntersectionObserver(
      ([entry]) => {
        frameState.current.visible = entry.isIntersecting
      },
      { threshold: 0.02, rootMargin: '10% 0px' },
    )
    io.observe(ioTarget)

    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      frameState.current.running = false
      cancelAnimationFrame(rafRef.current)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      io.disconnect()
    }
  }, [priorityReady, getFrame, getExactFrame, totalFrames, isMobile])

  // ── One scroll / swipe = one story beat ───────────────────────────────
  useEffect(() => {
    const hero = pinRef.current
    if (!hero) return undefined

    const stops = (isMobile ? MOBILE_STOPS : DESKTOP_STOPS).map((f) => Math.min(f, totalFrames))
    const last = stops.length - 1
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const playhead = { frame: stops[0] }
    let stop = 0
    let tween = null

    frameState.current.target = playhead.frame
    frameState.current.pendingProgress = 0

    const syncFrame = () => {
      frameState.current.target = playhead.frame
      frameState.current.pendingProgress = (playhead.frame - 1) / (totalFrames - 1)
    }

    const playing = () => Boolean(tween?.isActive())
    const canStep = (dir) => stop + dir >= 0 && stop + dir <= last
    const leave = () => goToCollection(lenisRef.current)

    const step = (dir) => {
      // Past the last beat, a forward gesture goes straight to the collection
      if (dir > 0 && stop === last) {
        if (!playing()) leave()
        return
      }
      if (!canStep(dir)) return
      const wasPlaying = playing()
      stop += dir
      tween?.kill()
      const final = dir > 0 && stop === last
      if (dir > 0) sprayGauge(gaugeRef.current, final ? 'burst' : 'puff')
      const distance = Math.abs(stops[stop] - playhead.frame)
      const duration = Math.min(MAX_BEAT_SECONDS, 0.7 + distance * 0.009)
      tween = gsap.to(playhead, {
        frame: stops[stop],
        duration: reduceMotion ? 0.35 : final ? Math.min(FINAL_BEAT_SECONDS, duration) : duration,
        // Mid-flight retargets keep their momentum instead of easing in again
        ease: wasPlaying ? 'power2.out' : 'power1.inOut',
        onUpdate: syncFrame,
        onComplete: final ? () => window.scrollY <= 2 && leave() : undefined,
      })
    }

    // The story owns the gesture only while the hero fills the screen; going back past the first beat lets the page scroll
    const owns = (dir) =>
      window.scrollY <= 2 &&
      document.documentElement.style.overflow !== 'hidden' &&
      (canStep(dir) || playing() || (dir > 0 && Boolean(document.getElementById('collection'))))

    const inScope = (target) =>
      target instanceof Element &&
      !target.closest('[role="dialog"]') &&
      (hero.contains(target) || Boolean(target.closest('.site-nav')))

    let touch = null

    const onTouchStart = (e) => {
      touch =
        e.touches.length === 1 && inScope(e.target)
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY, dir: 0, dy: 0, owned: false, fired: false }
          : null
    }

    const onTouchMove = (e) => {
      if (!touch) return
      const t = e.touches[0]
      const dx = t.clientX - touch.x
      touch.dy = touch.y - t.clientY

      if (touch.dir === 0) {
        if (Math.abs(dx) < 3 && Math.abs(touch.dy) < 3) {
          // Direction unknown yet: hold the page still if either direction would play
          if (e.cancelable && (owns(1) || owns(-1))) e.preventDefault()
          return
        }
        if (Math.abs(dx) > Math.abs(touch.dy)) {
          touch = null
          return
        }
        touch.dir = touch.dy > 0 ? 1 : -1
        touch.owned = owns(touch.dir)
      }

      if (!touch.owned) return
      if (e.cancelable) e.preventDefault()
      if (!touch.fired && Math.abs(touch.dy) >= SWIPE_PX) {
        touch.fired = true
        step(touch.dir)
      }
    }

    const onTouchEnd = () => {
      // Short flicks that end before SWIPE_PX still count
      if (touch?.owned && !touch.fired && Math.abs(touch.dy) >= SWIPE_PX / 2) step(touch.dir)
      touch = null
    }

    let wheelBurst = false
    let wheelSum = 0
    let wheelTimer = 0

    const onWheel = (e) => {
      if (e.ctrlKey || !inScope(e.target)) return
      const dir = e.deltaY > 0 ? 1 : -1
      if (!wheelBurst && !owns(dir)) return
      e.preventDefault()
      // Lenis skips events flagged like this, so it doesn't smooth-scroll the page underneath
      e.lenisStopPropagation = true
      window.clearTimeout(wheelTimer)
      wheelTimer = window.setTimeout(() => {
        wheelBurst = false
        wheelSum = 0
      }, WHEEL_IDLE_MS)
      if (wheelBurst) return
      wheelSum += e.deltaY
      if (Math.abs(wheelSum) >= WHEEL_DELTA) {
        wheelBurst = true
        step(dir)
      }
    }

    const KEY_DIR = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }
    const onKeyDown = (e) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
      if (e.key === ' ' && e.target instanceof Element && e.target.closest('a, button')) return
      const dir = e.key === ' ' ? (e.shiftKey ? -1 : 1) : KEY_DIR[e.key]
      if (!dir || !owns(dir)) return
      e.preventDefault()
      step(dir)
    }

    // Capture phase: runs before Lenis's own window listeners
    const opts = { passive: false, capture: true }
    const passive = { passive: true, capture: true }
    window.addEventListener('touchstart', onTouchStart, passive)
    window.addEventListener('touchmove', onTouchMove, opts)
    window.addEventListener('touchend', onTouchEnd, passive)
    window.addEventListener('touchcancel', onTouchEnd, passive)
    window.addEventListener('wheel', onWheel, opts)
    window.addEventListener('keydown', onKeyDown, true)

    return () => {
      tween?.kill()
      window.clearTimeout(wheelTimer)
      window.removeEventListener('touchstart', onTouchStart, passive)
      window.removeEventListener('touchmove', onTouchMove, opts)
      window.removeEventListener('touchend', onTouchEnd, passive)
      window.removeEventListener('touchcancel', onTouchEnd, passive)
      window.removeEventListener('wheel', onWheel, opts)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [isMobile, totalFrames])

  const scrollToCollection = (e) => {
    e.preventDefault()
    goToCollection(lenis)
  }

  return (
    <section
      id="hero"
      ref={pinRef}
      className="relative bg-black"
      style={{ touchAction: 'pan-y' }}
      aria-label="SCENTINOVA - cinematic frame sequence"
    >
      <div
        ref={stickyRef}
        className={`hero-sticky sticky top-0 flex w-full flex-col overflow-hidden bg-black ${
          isMobile ? 'h-svh' : 'h-dvh'
        }`}
        style={{
          contain: 'layout paint size',
          transform: 'translateZ(0)',
          willChange: 'transform',
          touchAction: 'pan-y',
        }}
      >
        <div
          className="shrink-0 bg-black"
          style={{
            height: 'calc(var(--header-h) + env(safe-area-inset-top, 0px))',
          }}
          aria-hidden
        />

        <div className="relative min-h-0 flex-1">
          <div className="pointer-events-none absolute inset-0 z-0 bg-luxury-dark" />

          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-[1] h-full w-full"
            style={{
              imageRendering: 'auto',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              willChange: 'contents',
              contain: 'strict',
            }}
          />

          <div className="hero-vignette pointer-events-none absolute inset-0 z-[2]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[55%] bg-gradient-to-t from-black via-black/90 to-transparent sm:h-72 sm:via-black/80" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-28 bg-black sm:h-20" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-1/3 bg-gradient-to-r from-black/80 via-black/30 to-transparent max-sm:hidden" />

          {!isMobile && (
            <div className="absolute inset-0 z-[3]">
              <Particles density={28} />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 z-[5] flex items-end px-5 pb-[3.25rem] sm:items-center sm:px-10 sm:pb-0 md:pl-24 lg:pl-36">
            <AnimatePresence>
              {ready && (
                <motion.div
                  className="max-w-[15rem] pointer-events-auto text-left sm:max-w-md"
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  transition={{ duration: 1.05, ease: easeOutExpo }}
                >
                  <p className="mb-2 text-[8px] whitespace-nowrap tracking-[0.3em] text-sand/80 uppercase sm:mb-5 sm:text-[11px] sm:tracking-[0.42em] sm:text-sand">
                    SCENTINOVA · Heavenly Crafted
                  </p>
                  <h1 className="font-display text-[1.6rem] leading-[1.1] text-warm-white sm:text-5xl lg:text-6xl">
                    Fragrance as
                    <br />
                    <span className="text-champagne">presence.</span>
                  </h1>
                  <p className="mt-6 hidden max-w-sm text-[15px] leading-relaxed text-sand/95 sm:block">
                    Signatures in crystal and gold - a private hour that stays.
                  </p>

                  <AnimatePresence mode="wait">
                    {chapter && progressRef.current > 0.08 && !showEndCta && (
                      <motion.p
                        key={chapter.id}
                        className="mt-2.5 text-[8.5px] tracking-[0.22em] text-gold/80 uppercase sm:mt-5 sm:text-[11px] sm:tracking-[0.2em]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45 }}
                      >
                        {chapter.eyebrow} - {chapter.title}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="mt-4 flex flex-wrap items-center gap-4 sm:mt-10 sm:gap-5">
                    <Link
                      to="/shop"
                      className="btn-luxury inline-flex items-center gap-2 border border-champagne/50 px-4 py-2 whitespace-nowrap text-warm-white max-sm:text-[9.5px]! max-sm:tracking-[0.2em]! sm:gap-3 sm:px-8 sm:py-3.5"
                    >
                      Discover the collection
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            className="pointer-events-none absolute inset-0 z-[6]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 8 }}
            transition={{ delay: 1.1, duration: 0.8, ease: easeOutExpo }}
          >
            <div className="absolute right-5 bottom-[3.25rem] sm:right-10 sm:bottom-9">
              <ScrollGauge ref={gaugeRef} label={isMobile ? 'Swipe' : 'Scroll'} initial={progressRef.current} />
            </div>
            {isMobile && (
              <button
                type="button"
                onClick={scrollToCollection}
                className="pointer-events-auto absolute inset-x-0 bottom-2 mx-auto w-max px-3 py-1.5 text-[8.5px] tracking-[0.32em] text-warm-white/40 uppercase"
              >
                Skip to the collection <span aria-hidden className="text-gold">↓</span>
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

