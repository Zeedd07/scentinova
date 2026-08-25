/**
 * Editorial hero — pinned canvas frame-scrub + cinematic overlays.
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
  const videoRef = useRef(null)
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

  // Canvas draw loop
  useEffect(() => {
    if (isMobile || !priorityReady) return undefined
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d', { alpha: false })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
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
      ctx.fillStyle = '#050403'
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
  }, [isMobile, priorityReady, getFrame])

  // ScrollTrigger scrub
  useEffect(() => {
    if (isMobile || !priorityReady) return undefined
    const pin = pinRef.current
    if (!pin) return undefined

    const st = ScrollTrigger.create({
      trigger: pin,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.35,
      onUpdate: (self) => {
        frameState.current.target = 1 + self.progress * (TOTAL_FRAMES - 1)
        applyProgress(self.progress)
      },
    })
    return () => st.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, priorityReady])

  // Mobile video
  useEffect(() => {
    if (!isMobile || !priorityReady) return undefined
    const video = videoRef.current
    if (!video) return undefined
    applyProgress(0)
    const onTime = () => {
      const dur = video.duration || 10
      applyProgress(video.currentTime / dur)
    }
    video.addEventListener('timeupdate', onTime)
    return () => video.removeEventListener('timeupdate', onTime)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, priorityReady])

  return (
    <section
      id="hero"
      ref={pinRef}
      className="relative"
      style={{ height: isMobile ? '100vh' : '420vh' }}
      aria-label="SCENTINOVA — cinematic frame sequence"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-ink">
        <div className="pointer-events-none absolute inset-0 z-0 bg-luxury" />

        {isMobile ? (
          <video
            ref={videoRef}
            className="absolute inset-0 z-[1] h-full w-full object-cover"
            src="/hero-mobile.mp4"
            autoPlay
            muted
            loop
            playsInline
            poster="/frames/frame-001.jpg"
          />
        ) : (
          <canvas ref={canvasRef} className="absolute inset-0 z-[1] h-full w-full" />
        )}

        <div className="hero-vignette pointer-events-none absolute inset-0 z-[2]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-72 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-1/3 bg-gradient-to-r from-ink/80 via-ink/30 to-transparent" />

        <div className="absolute inset-0 z-[3]">
          <Particles density={isMobile ? 28 : 64} />
        </div>

        {/* Vertical frame scrub indicator */}
        {!isMobile && (
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
        )}

        {/* Editorial copy — left */}
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-end px-6 pb-28 sm:items-center sm:px-10 sm:pb-0 md:pl-24 lg:pl-36">
          <AnimatePresence>
            {ready && (
              <motion.div
                className="max-w-md pointer-events-auto"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mb-5 text-[11px] tracking-[0.42em] text-bronze uppercase">
                  SCENTINOVA Parfums
                </p>
                <h1 className="font-display text-[2.35rem] leading-[1.08] text-cream sm:text-5xl lg:text-6xl">
                  Not perfume.
                  <br />
                  <span className="gold-text italic">A private hour in gold.</span>
                </h1>
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-bronze sm:text-[15px]">
                  A fragrance to be remembered. A moment that lingers. A world
                  that is yours.
                </p>

                <AnimatePresence mode="wait">
                  {chapter && progressRef.current > 0.08 && !showEndCta && (
                    <motion.p
                      key={chapter.id}
                      className="mt-5 text-[11px] tracking-[0.2em] text-gold/80 uppercase"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {chapter.eyebrow} — {chapter.title}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <Link
                    to="/shop"
                    className="btn-luxury gold-border inline-flex items-center gap-3 rounded-sm px-8 py-3.5 text-cream"
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
        {!isMobile && !showEndCta && (
          <motion.div
            className="pointer-events-none absolute bottom-10 right-8 z-[5] hidden items-center gap-3 sm:flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 0.7 : 0 }}
            transition={{ delay: 1.2 }}
          >
            <span className="text-[11px] tracking-[0.35em] text-bronze uppercase">
              Scroll to explore
            </span>
            <span className="h-px w-10 bg-gradient-to-r from-gold to-transparent" />
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
                  const top = el.getBoundingClientRect().top + window.scrollY - 72
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
    </section>
  )
}
