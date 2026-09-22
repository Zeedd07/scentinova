/**
 * Editorial hero — pinned canvas frame-scrub on scroll (desktop + mobile).
 * Single RAF: dt-independent lerp + draw + UI chrome. Lenis + ScrollTrigger.
 */
import { useEffect, useRef, useState, startTransition } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  TOTAL_FRAMES,
  isFrameDrawable,
  frameSize,
} from '../hooks/useFrameSequence'
import { chapterAt } from '../data/storyChapters'
import Particles from './Particles'
import { useLenis } from './SmoothScroll'
import { easeOutExpo, fadeUp } from '../lib/motion'

gsap.registerPlugin(ScrollTrigger)

const BG = '#0d0c0b'

export default function Hero({ getFrame, priorityReady, isMobile }) {
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
    if (priorityReady) {
      const t = setTimeout(() => setReady(true), 220)
      return () => clearTimeout(t)
    }
    return undefined
  }, [priorityReady])

  // ── Canvas + single RAF loop ──────────────────────────────────────────
  useEffect(() => {
    if (!priorityReady) return undefined
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      colorSpace: 'srgb',
      willReadFrequently: false,
    })
    if (!ctx) return undefined

    ctx.imageSmoothingEnabled = !isMobile
    if (!isMobile) ctx.imageSmoothingQuality = 'high'

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
      // Slight mobile lift — keep full cover so we never flash letterbox black
      if (isMobile) {
        dy -= ch * 0.04
        dh += ch * 0.04
      }

      const rect = { dw, dh, dx, dy }
      coverRef.current.cache.set(key, rect)
      return rect
    }

    const resize = () => {
      const rawDpr = window.devicePixelRatio || 1
      const dpr = isMobile ? 1 : Math.min(rawDpr, 2)
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
      ctx.imageSmoothingEnabled = !isMobile
      if (!isMobile) ctx.imageSmoothingQuality = 'high'
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
      const direct = getFrame(rounded)
      if (isFrameDrawable(direct)) {
        frameState.current.lastGood = rounded
        frameState.current.lastDrawable = direct
        return { img: direct, drawnIndex: rounded }
      }

      // Prefer previously drawn bitmap (never flash black during load gaps)
      if (isFrameDrawable(frameState.current.lastDrawable)) {
        return {
          img: frameState.current.lastDrawable,
          drawnIndex: frameState.current.lastGood,
        }
      }

      const lastGood = getFrame(frameState.current.lastGood)
      if (isFrameDrawable(lastGood)) {
        frameState.current.lastDrawable = lastGood
        return {
          img: lastGood,
          drawnIndex: frameState.current.lastGood,
        }
      }

      for (let d = 1; d <= TOTAL_FRAMES; d += 1) {
        const a = getFrame(rounded - d)
        if (isFrameDrawable(a)) {
          frameState.current.lastDrawable = a
          return { img: a, drawnIndex: rounded - d }
        }
        const b = getFrame(rounded + d)
        if (isFrameDrawable(b)) {
          frameState.current.lastDrawable = b
          return { img: b, drawnIndex: rounded + d }
        }
      }
      return null
    }

    function flushUiChrome(progress) {
      progressRef.current = progress
      if (progressBarRef.current) {
        progressBarRef.current.style.height = `${progress * 100}%`
      }
      const frameNum = Math.round(1 + progress * (TOTAL_FRAMES - 1))
      if (frameLabelRef.current) {
        frameLabelRef.current.textContent = String(frameNum).padStart(2, '0')
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
      // Always fill first on mobile — prevents black bars / cleared-canvas flashes
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
        // Hold last frame — never leave a wiped/black canvas mid-scrub
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
    drawFrame(1)
    frameState.current.pendingProgress = 0
    flushUiChrome(0)
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
  }, [priorityReady, getFrame, isMobile])

  // ── ScrollTrigger pin + scrub ─────────────────────────────────────────
  useEffect(() => {
    if (!priorityReady) return undefined
    const pin = pinRef.current
    if (!pin) return undefined

    // iOS Safari rubber-band / URL-bar mitigation
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
      scrub: isMobile ? 0.08 : 0.18,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      onUpdate: (self) => {
        frameState.current.target = 1 + self.progress * (TOTAL_FRAMES - 1)
        frameState.current.pendingProgress = self.progress
      },
    })

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
  }, [priorityReady, isMobile])

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
        height: isMobile ? '320vh' : '400vh',
        touchAction: 'pan-y',
      }}
      aria-label="SCENTINOVA — cinematic frame sequence"
    >
      <div
        ref={stickyRef}
        className="hero-sticky sticky top-0 flex h-dvh w-full flex-col overflow-hidden bg-black"
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

          <div className="pointer-events-none absolute left-5 top-1/2 z-[6] hidden h-[42vh] -translate-y-1/2 flex-col items-center sm:left-8 md:flex lg:left-12">
            <span
              ref={frameLabelRef}
              className="font-display text-sm tabular-nums text-gold-light"
            >
              01
            </span>
            <div className="relative my-3 w-px flex-1 bg-gold/20">
              <div
                ref={progressBarRef}
                className="absolute inset-x-0 top-0 w-px bg-gradient-to-b from-gold to-gold-light"
                style={{ height: '0%' }}
              />
            </div>
            <span className="font-display text-sm tabular-nums text-bronze">
              {String(TOTAL_FRAMES).padStart(2, '0')}
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
                    Four signatures. Crystal, gold, and a private hour that stays.
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
                        {chapter.eyebrow} — {chapter.title}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="mt-7 flex flex-wrap items-center gap-4 sm:mt-10 sm:gap-5">
                    <Link
                      to="/shop"
                      className="btn-luxury inline-flex items-center gap-2 border border-champagne/50 px-6 py-3 text-[11px] text-warm-white hover:bg-champagne hover:text-charcoal sm:gap-3 sm:px-8 sm:py-3.5"
                    >
                      Discover the collection
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!showEndCta && (
            <motion.div
              className="pointer-events-none absolute bottom-5 left-5 z-[5] flex items-center gap-3 sm:bottom-10 sm:left-auto sm:right-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 0.7 : 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              <span className="text-[10px] tracking-[0.32em] text-bronze uppercase sm:text-[11px] sm:tracking-[0.35em]">
                Scroll to explore
              </span>
              <span className="h-px w-8 bg-gradient-to-r from-gold to-transparent sm:w-10" />
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
