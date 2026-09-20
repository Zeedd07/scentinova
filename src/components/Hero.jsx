/**
 * Editorial hero — pinned canvas frame-scrub on scroll (desktop + mobile).
 * React state only updates on chapter/CTA gates; progress/frame via refs.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TOTAL_FRAMES } from '../hooks/useFrameSequence'
import { chapterAt } from '../data/storyChapters'
import Particles from './Particles'

gsap.registerPlugin(ScrollTrigger)

export default function Hero({ getFrame, priorityReady, isMobile }) {
  const pinRef = useRef(null)
  const canvasRef = useRef(null)
  const progressBarRef = useRef(null)
  const frameLabelRef = useRef(null)
  const frameState = useRef({ current: 1, target: 1 })
  const rafRef = useRef(0)
  const chapterIdRef = useRef(null)
  const progressRef = useRef(0)

  const [ready, setReady] = useState(false)
  const [chapter, setChapter] = useState(null)
  const [showEndCta, setShowEndCta] = useState(false)

  useEffect(() => {
    if (priorityReady) {
      const t = setTimeout(() => setReady(true), 300)
      return () => clearTimeout(t)
    }
    return undefined
  }, [priorityReady])

  const applyProgress = (progress) => {
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
      setChapter(next)
    }

    const atEnd = progress >= 0.88
    setShowEndCta((prev) => (prev === atEnd ? prev : atEnd))
  }

  // Canvas draw loop — desktop and mobile
  useEffect(() => {
    if (!priorityReady) return undefined
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d', { alpha: false })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2)
      const { clientWidth: w, clientHeight: h } = canvas
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawFrame(frameState.current.current)
    }

    function drawFrame(index) {
      let img = getFrame(index)
      if (!img?.complete) {
        for (let d = 0; d < TOTAL_FRAMES; d += 1) {
          const a = getFrame(index - d)
          const b = getFrame(index + d)
          if (a?.complete) {
            img = a
            break
          }
          if (b?.complete) {
            img = b
            break
          }
        }
      }
      if (!img?.complete) return

      const { clientWidth: cw, clientHeight: ch } = canvas
      const ir = img.naturalWidth / img.naturalHeight
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
      // Mobile: bias frame upward so the bottle clears the bottom copy band
      if (isMobile) {
        dy -= ch * 0.12
      }
      ctx.fillStyle = '#0d0c0b'
      ctx.fillRect(0, 0, cw, ch)
      ctx.drawImage(img, dx, dy, dw, dh)
    }

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop)
      const { current, target } = frameState.current
      if (current !== target) {
        const next =
          Math.abs(target - current) < 0.4
            ? target
            : current + (target - current) * 0.32
        frameState.current.current = next
        drawFrame(Math.round(next))
      }
    }

    resize()
    drawFrame(1)
    applyProgress(0)
    rafRef.current = requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorityReady, getFrame, isMobile])

  // ScrollTrigger scrub — same pin + scroll-driven frames on mobile
  useEffect(() => {
    if (!priorityReady) return undefined
    const pin = pinRef.current
    if (!pin) return undefined

    const st = ScrollTrigger.create({
      trigger: pin,
      start: 'top top',
      end: 'bottom bottom',
      scrub: isMobile ? 0.55 : 0.35,
      anticipatePin: 1,
      onUpdate: (self) => {
        frameState.current.target = 1 + self.progress * (TOTAL_FRAMES - 1)
        applyProgress(self.progress)
      },
    })

    // iOS URL bar / orientation can change viewport — keep pin accurate
    const onOrient = () => ScrollTrigger.refresh()
    window.addEventListener('orientationchange', onOrient)
    const refreshId = requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      cancelAnimationFrame(refreshId)
      window.removeEventListener('orientationchange', onOrient)
      st.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorityReady, isMobile])

  return (
    <section
      id="hero"
      ref={pinRef}
      className="relative bg-black"
      style={{ height: '420vh' }}
      aria-label="SCENTINOVA — cinematic frame sequence"
    >
      <div className="sticky top-0 flex h-screen w-full flex-col overflow-hidden bg-black">
        {/* Match fixed navbar height so frames never sit under it */}
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
          />

          <div className="hero-vignette pointer-events-none absolute inset-0 z-[2]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[55%] bg-gradient-to-t from-black via-black/90 to-transparent sm:h-72 sm:via-black/80" />
          {/* Solid black footing — sharp cut into cream below + mobile copy band */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-28 bg-black sm:h-20" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-1/3 bg-gradient-to-r from-black/80 via-black/30 to-transparent max-sm:hidden" />

          <div className="absolute inset-0 z-[3]">
            <Particles density={isMobile ? 28 : 64} />
          </div>

          {/* Vertical frame scrub indicator — desktop */}
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

          {/* Editorial copy — bottom-left on phone (clear of bottle), left-center on desktop */}
          <div className="pointer-events-none absolute inset-0 z-[5] flex items-end px-5 pb-[5.5rem] sm:items-center sm:px-10 sm:pb-0 md:pl-24 lg:pl-36">
            <AnimatePresence>
              {ready && (
                <motion.div
                  className="max-w-[20rem] pointer-events-auto text-left sm:max-w-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
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

          {/* Scroll cue */}
          {!showEndCta && (
            <motion.div
              className="pointer-events-none absolute bottom-5 left-5 z-[5] flex items-center gap-3 sm:bottom-10 sm:left-auto sm:right-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 0.7 : 0 }}
              transition={{ delay: 1.2 }}
            >
              <span className="text-[10px] tracking-[0.32em] text-bronze uppercase sm:text-[11px] sm:tracking-[0.35em]">
                Scroll to explore
              </span>
              <span className="h-px w-8 bg-gradient-to-r from-gold to-transparent sm:w-10" />
            </motion.div>
          )}

          {/* Seamless handoff cue at end */}
          <AnimatePresence>
            {showEndCta && (
              <motion.div
                className="pointer-events-none absolute inset-x-0 bottom-16 z-[6] flex justify-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    const el = document.getElementById('collection')
                    if (!el) return
                    const nav = document.querySelector('.site-nav')
                    const navH = nav?.getBoundingClientRect().height || 56
                    const top =
                      el.getBoundingClientRect().top + window.scrollY - navH - 8
                    window.scrollTo({ top, behavior: 'smooth' })
                  }}
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
