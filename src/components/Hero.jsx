/**
 * Editorial hero: canvas frame sequence drawn by a single RAF loop.
 * Desktop: pinned frame-scrub on scroll (ScrollTrigger).
 * Mobile: one swipe plays one story beat between MOBILE_STOPS; past the last beat the page scrolls on.
 * The frame set (landscape / portrait) is chosen by the parent.
 */
import { useEffect, useRef, useState, startTransition } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isFrameDrawable, frameSize } from '../hooks/useFrameSequence'
import { chapterAt } from '../data/storyChapters'
import Particles from './Particles'
import { useLenis } from './SmoothScroll'
import { easeOutExpo, fadeUp } from '../lib/motion'

gsap.registerPlugin(ScrollTrigger)

const BG = '#0d0c0b'

/** Frames each mobile swipe moves between, in order. */
const MOBILE_STOPS = [1, 106, 175, 263, 350, 430, 600]
/** Finger travel (px) that counts as one swipe. */
const SWIPE_PX = 24
const WHEEL_DELTA = 20
/** Silence (ms) that ends a wheel / trackpad burst, so inertia counts as one step. */
const WHEEL_IDLE_MS = 200

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
  const progressBarRef = useRef(null)
  const frameLabelRef = useRef(null)
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
  const lastTsRef = useRef(0)
  const showEndCtaRef = useRef(false)

  const [ready, setReady] = useState(false)
  const [chapter, setChapter] = useState(null)
  const [showEndCta, setShowEndCta] = useState(false)

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

    const labelPad = String(totalFrames).length

    function flushUiChrome(progress) {
      progressRef.current = progress
      if (progressBarRef.current) {
        progressBarRef.current.style.height = `${progress * 100}%`
      }
      const frameNum = Math.round(1 + progress * (totalFrames - 1))
      if (frameLabelRef.current) {
        frameLabelRef.current.textContent = String(frameNum).padStart(labelPad, '0')
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

  // ── Desktop: ScrollTrigger pin + scrub ────────────────────────────────
  useEffect(() => {
    if (!priorityReady || isMobile) return undefined
    const pin = pinRef.current
    if (!pin) return undefined

    try {
      ScrollTrigger.normalizeScroll(true)
    } catch {
      /* older GSAP */
    }

    const st = ScrollTrigger.create({
      trigger: pin,
      start: 'top top',
      end: 'bottom bottom',
      // Numeric scrub feels smoother with Lenis than scrub:true on some devices
      scrub: 0.18,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      onUpdate: (self) => {
        frameState.current.target = 1 + self.progress * (totalFrames - 1)
        frameState.current.pendingProgress = self.progress
      },
    })
    frameState.current.target = 1 + st.progress * (totalFrames - 1)
    frameState.current.pendingProgress = st.progress

    let refreshTimer = 0
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh()
      }, 280)
    }

    window.addEventListener('orientationchange', scheduleRefresh, {
      passive: true,
    })
    window.addEventListener('resize', scheduleRefresh, { passive: true })
    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleRefresh).catch(() => {})
    }
    const bootRefresh = window.setTimeout(() => ScrollTrigger.refresh(), 60)

    return () => {
      window.clearTimeout(refreshTimer)
      window.clearTimeout(bootRefresh)
      window.removeEventListener('orientationchange', scheduleRefresh)
      window.removeEventListener('resize', scheduleRefresh)
      st.kill()
    }
  }, [priorityReady, totalFrames, isMobile])

  // ── Mobile: one swipe = one story beat ────────────────────────────────
  useEffect(() => {
    if (!isMobile) return undefined
    const hero = pinRef.current
    if (!hero) return undefined

    const stops = MOBILE_STOPS.map((f) => Math.min(f, totalFrames))
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

    const step = (dir) => {
      if (!canStep(dir)) return
      const wasPlaying = playing()
      stop += dir
      tween?.kill()
      const distance = Math.abs(stops[stop] - playhead.frame)
      tween = gsap.to(playhead, {
        frame: stops[stop],
        duration: reduceMotion ? 0.35 : 0.7 + distance * 0.009,
        // Mid-flight retargets keep their momentum instead of easing in again
        ease: wasPlaying ? 'power2.out' : 'power1.inOut',
        onUpdate: syncFrame,
      })
    }

    // The story owns the gesture only while the hero fills the screen; at the ends it lets the page scroll
    const owns = (dir) =>
      window.scrollY <= 2 &&
      document.documentElement.style.overflow !== 'hidden' &&
      (canStep(dir) || playing())

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
      const dir = e.key === ' ' ? (e.shiftKey ? -1 : 1) : KEY_DIR[e.key]
      if (!dir || !owns(dir)) return
      e.preventDefault()
      step(dir)
    }

    const opts = { passive: false }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, opts)
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    window.addEventListener('wheel', onWheel, opts)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      tween?.kill()
      window.clearTimeout(wheelTimer)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove, opts)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('wheel', onWheel, opts)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isMobile, totalFrames])

  const scrollToCollection = (e) => {
    e.preventDefault()
    const el = document.getElementById('collection')
    if (!el) return
    const nav = document.querySelector('.site-nav')
    const navH = nav?.getBoundingClientRect().height || 56
    const top =
      el.getBoundingClientRect().top + window.scrollY - navH - 8
    if (lenis) {
      lenis.scrollTo(top, { offset: 0, duration: 1.2 })
    } else {
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <section
      id="hero"
      ref={pinRef}
      className="relative bg-black"
      style={{
        height: isMobile ? undefined : '400vh',
        touchAction: 'pan-y',
      }}
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
            height: 'calc(var(--nav-h) + env(safe-area-inset-top, 0px))',
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

          <div className="pointer-events-none absolute right-4 top-[calc(var(--nav-h)+1.25rem)] z-[6] flex h-[22vh] flex-col items-center drop-shadow-[0_1px_4px_rgba(0,0,0,0.75)] md:right-auto md:left-8 md:top-1/2 md:h-[42vh] md:-translate-y-1/2 md:drop-shadow-none lg:left-12">
            <span
              ref={frameLabelRef}
              className="font-display text-xs tabular-nums text-gold-light md:text-sm"
            >
              {'1'.padStart(String(totalFrames).length, '0')}
            </span>
            <div className="relative my-2 w-px flex-1 bg-gold/30 md:my-3 md:bg-gold/20">
              <div
                ref={progressBarRef}
                className="absolute inset-x-0 top-0 w-px bg-gradient-to-b from-gold to-gold-light"
                style={{ height: '0%' }}
              />
            </div>
            <span className="font-display text-xs tabular-nums text-warm-white/60 md:text-sm md:text-warm-white/50">
              {totalFrames}
            </span>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[5] flex items-end px-5 pb-[5.5rem] sm:items-center sm:px-10 sm:pb-0 md:pl-24 lg:pl-36">
            <AnimatePresence>
              {ready && (
                <motion.div
                  className="max-w-[20rem] pointer-events-auto text-left sm:max-w-md"
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  transition={{ duration: 1.05, ease: easeOutExpo }}
                >
                  <p className="mb-3 text-[10px] tracking-[0.38em] text-sand uppercase sm:mb-5 sm:text-[11px] sm:tracking-[0.42em]">
                    SCENTINOVA · Heavenly Crafted
                  </p>
                  <h1 className="font-display text-[2rem] leading-[1.1] text-warm-white sm:text-5xl lg:text-6xl">
                    Fragrance as
                    <br />
                    <span className="italic text-champagne">presence.</span>
                  </h1>
                  <p className="mt-4 max-w-[17rem] text-[13px] leading-relaxed text-sand/95 sm:mt-6 sm:max-w-sm sm:text-[15px]">
                    Signatures in crystal and gold - a private hour that stays.
                  </p>

                  <AnimatePresence mode="wait">
                    {chapter && progressRef.current > 0.08 && !showEndCta && (
                      <motion.p
                        key={chapter.id}
                        className="mt-4 text-[10px] tracking-[0.2em] text-gold/80 uppercase sm:mt-5 sm:text-[11px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45 }}
                      >
                        {chapter.eyebrow} - {chapter.title}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="mt-7 flex flex-wrap items-center gap-4 sm:mt-10 sm:gap-5">
                    <Link
                      to="/shop"
                      className="btn-luxury inline-flex items-center gap-2 border border-champagne/50 px-6 py-3 text-[11px] text-warm-white sm:gap-3 sm:px-8 sm:py-3.5"
                    >
                      Discover the collection
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isMobile && !showEndCta && (
            <motion.button
              type="button"
              onClick={scrollToCollection}
              className="absolute bottom-3 left-3 z-[6] flex items-center gap-3 px-2 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 0.85 : 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              <span className="text-[10px] tracking-[0.32em] text-warm-white/50 uppercase">
                Enter the collection
              </span>
              <span aria-hidden className="text-[11px] text-gold">
                ↓
              </span>
            </motion.button>
          )}

          {!isMobile && !showEndCta && (
            <motion.div
              className="pointer-events-none absolute bottom-5 left-5 z-[5] flex items-center gap-3 sm:bottom-10 sm:left-auto sm:right-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 0.7 : 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              <span className="text-[10px] tracking-[0.32em] text-warm-white/50 uppercase sm:text-[11px] sm:tracking-[0.35em]">
                Scroll to explore
              </span>
              <span className="h-px w-8 bg-gradient-to-r from-scent-red-light to-transparent sm:w-10" />
            </motion.div>
          )}

          <AnimatePresence>
            {showEndCta && (
              <motion.div
                className="pointer-events-none absolute inset-x-0 bottom-16 z-[6] flex justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: easeOutExpo }}
              >
                <button
                  type="button"
                  onClick={scrollToCollection}
                  className="pointer-events-auto text-[11px] tracking-[0.4em] text-gold uppercase"
                >
                  Enter the collection ↓
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
