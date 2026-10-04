/**
 * Product photos + videos in one swipeable track (native scroll-snap).
 * Swipe on touch; thumbnails, arrows and arrow keys everywhere.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { signatureStageBackground } from '../lib/storefrontBackdrops'
import { imageScaleStyle, productImageScale } from '../lib/imageScale'

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlayIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  )
}

function SoundIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
      {muted ? (
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      ) : (
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
      )}
    </svg>
  )
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function productSlides(product) {
  const images = (product.gallery?.length ? product.gallery : [product.image])
    .filter(Boolean)
    .map((src, i) => ({ type: 'image', key: `img-${i}-${src}`, src, scale: productImageScale(product, i) }))
  const videos = (product.videos || [])
    .filter((v) => v?.url)
    .map((v) => ({ type: 'video', key: `vid-${v.publicId || v.url}`, src: v.url, poster: v.posterUrl || undefined }))
  return [...images, ...videos]
}

export default function ProductGallery({ product }) {
  const slides = productSlides(product)
  const trackRef = useRef(null)
  const videoRefs = useRef(new Map())
  const [active, setActive] = useState(0)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(() => prefersReducedMotion())
  const count = slides.length
  const activeSlide = slides[Math.min(active, count - 1)]

  const goTo = useCallback((index, behavior = 'smooth') => {
    const track = trackRef.current
    if (!track) return
    const i = Math.max(0, Math.min(index, track.children.length - 1))
    track.scrollTo({ left: i * track.clientWidth, behavior: prefersReducedMotion() ? 'auto' : behavior })
    setActive(i)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (!track.clientWidth) return
        setActive(Math.round(track.scrollLeft / track.clientWidth))
      })
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    videoRefs.current.forEach((video, key) => {
      if (key === activeSlide?.key && !paused) {
        video.play().catch(() => setPaused(true))
      } else {
        video.pause()
      }
    })
  }, [activeSlide?.key, paused])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      goTo(active + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(active - 1)
    }
  }

  const setVideoRef = (key) => (el) => {
    if (el) {
      el.muted = muted
      videoRefs.current.set(key, el)
    } else {
      videoRefs.current.delete(key)
    }
  }

  const toggleMuted = () => {
    setMuted((m) => {
      videoRefs.current.forEach((v) => {
        v.muted = !m
      })
      return !m
    })
  }

  if (!count) return null
  const arrowClass =
    'absolute top-1/2 z-[2] hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-charcoal/10 bg-ivory/80 text-charcoal backdrop-blur-sm transition hover:bg-ivory disabled:pointer-events-none disabled:opacity-0 sm:flex'

  return (
    <div>
      <div
        className="group relative"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${product.name} photos and videos`}
      >
        <div
          ref={trackRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="product-gallery-track flex aspect-[3/4] snap-x snap-mandatory overflow-x-auto overscroll-x-contain border border-stone/80 outline-none focus-visible:ring-1 focus-visible:ring-charcoal/40"
          style={{ background: signatureStageBackground }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              className="relative flex h-full w-full shrink-0 snap-center snap-always items-center justify-center overflow-hidden"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== active}
            >
              {slide.type === 'image' ? (
                <img
                  src={slide.src}
                  alt={`${product.name} - image ${i + 1} of ${count}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  className="h-full w-full object-contain p-6 select-none sm:p-10"
                  style={imageScaleStyle(slide.scale)}
                />
              ) : (
                <>
                  <video
                    ref={setVideoRef(slide.key)}
                    src={slide.src}
                    poster={slide.poster}
                    muted
                    loop
                    playsInline
                    preload={i === active ? 'auto' : 'metadata'}
                    onClick={() => setPaused((p) => !p)}
                    className="h-full w-full cursor-pointer object-contain"
                    aria-label={`${product.name} video`}
                  />
                  {paused && i === active && (
                    <button
                      type="button"
                      onClick={() => setPaused(false)}
                      aria-label="Play video"
                      className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-ivory/85 text-charcoal shadow-sm backdrop-blur-sm"
                    >
                      <PlayIcon className="ml-0.5 h-6 w-6" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous"
              className={`${arrowClass} left-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100`}
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              disabled={active === count - 1}
              aria-label="Next"
              className={`${arrowClass} right-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100`}
            >
              <Chevron dir="right" />
            </button>
          </>
        )}

        {activeSlide?.type === 'video' && (
          <button
            type="button"
            onClick={toggleMuted}
            aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
            className="absolute right-3 bottom-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-ivory/85 text-charcoal shadow-sm backdrop-blur-sm"
          >
            <SoundIcon muted={muted} />
          </button>
        )}

        {count > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[1] flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
            {slides.map((slide, i) => (
              <span
                key={slide.key}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? 'w-5 bg-charcoal/80' : 'w-1.5 bg-charcoal/25'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => goTo(i)}
              aria-label={slide.type === 'video' ? `Play video ${i + 1}` : `View image ${i + 1}`}
              aria-current={i === active ? 'true' : undefined}
              className={`relative flex h-20 w-16 items-center justify-center overflow-hidden border transition sm:h-24 sm:w-20 ${
                i === active ? 'border-charcoal' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              style={{ background: signatureStageBackground }}
            >
              {slide.type === 'image' ? (
                <img
                  src={slide.src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain p-1.5"
                  style={imageScaleStyle(slide.scale)}
                />
              ) : (
                <>
                  {slide.poster ? (
                    <img src={slide.poster} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <video src={slide.src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute inset-0 m-auto flex h-7 w-7 items-center justify-center rounded-full bg-ivory/85 text-charcoal">
                    <PlayIcon className="ml-px h-3.5 w-3.5" />
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
