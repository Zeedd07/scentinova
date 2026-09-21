/**
 * Batch-preload frame sequence with progress reporting.
 * Desktop prefers sharp cleaned JPEGs; mobile prefers lighter WebP.
 * Uses decode() so first paints aren't soft half-decoded bitmaps.
 * Progress state is throttled so loads don't thrash React during scrub.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export const TOTAL_FRAMES = 240
export const PRIORITY_FRAMES = 64

export function frameSrcWebp(index) {
  const n = String(index).padStart(3, '0')
  return `/frames-webp/frame-${n}.webp`
}

export function frameSrcJpg(index) {
  const n = String(index).padStart(3, '0')
  return `/frames-clean/frame-${n}.jpg`
}

export function frameSrc(index) {
  return frameSrcWebp(index)
}

function candidatesFor(index, preferSharp) {
  const webp = frameSrcWebp(index)
  const clean = frameSrcJpg(index)
  const original = `/frames/frame-${String(index).padStart(3, '0')}.jpg`
  return preferSharp
    ? [clean, original, webp]
    : [webp, clean, original]
}

function loadImage(index, preferSharp) {
  const candidates = candidatesFor(index, preferSharp)

  return new Promise((resolve, reject) => {
    let attempt = 0

    const tryNext = () => {
      if (attempt >= candidates.length) {
        reject(new Error(`Failed to load frame ${index}`))
        return
      }
      const src = candidates[attempt]
      attempt += 1
      const img = new Image()
      img.decoding = 'async'
      if ('fetchPriority' in img) {
        img.fetchPriority = index <= 24 ? 'high' : 'auto'
      }
      img.onload = async () => {
        try {
          if (typeof img.decode === 'function') {
            await img.decode()
          }
        } catch {
          /* decode can fail on some browsers; still usable */
        }
        resolve(img)
      }
      img.onerror = () => tryNext()
      img.src = src
    }

    tryNext()
  })
}

/**
 * @param {object} opts
 * @param {number} [opts.total=240]
 * @param {number} [opts.priorityCount]
 * @param {number} [opts.batchSize]
 * @param {boolean} [opts.enabled=true]
 * @param {boolean} [opts.preferSharp=true]
 * @param {number} [opts.yieldMs=0] — pause between batches (mobile needs more)
 */
export function useFrameSequence({
  total = TOTAL_FRAMES,
  priorityCount = PRIORITY_FRAMES,
  batchSize = 16,
  enabled = true,
  preferSharp = true,
  yieldMs = 0,
} = {}) {
  const framesRef = useRef(/** @type {(HTMLImageElement|null)[]} */ ([]))
  const readyCountRef = useRef(0)
  const [readyCount, setReadyCount] = useState(0)
  const [priorityReady, setPriorityReady] = useState(false)
  const [fullyLoaded, setFullyLoaded] = useState(false)
  const [error, setError] = useState(null)
  const progressFlushRef = useRef(0)

  const bumpReady = useCallback(() => {
    readyCountRef.current += 1
    if (progressFlushRef.current) return
    progressFlushRef.current = requestAnimationFrame(() => {
      progressFlushRef.current = 0
      setReadyCount(readyCountRef.current)
    })
  }, [])

  const getFrame = useCallback(
    (index1Based) => {
      const i = Math.max(1, Math.min(total, Math.round(index1Based))) - 1
      return framesRef.current[i] ?? null
    },
    [total],
  )

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false
    framesRef.current = new Array(total).fill(null)
    readyCountRef.current = 0
    setReadyCount(0)
    setPriorityReady(false)
    setFullyLoaded(false)

    async function loadRange(from, to) {
      const jobs = []
      for (let i = from; i <= to; i += 1) {
        const idx = i
        jobs.push(
          loadImage(idx, preferSharp)
            .then((img) => {
              if (cancelled) return
              framesRef.current[idx - 1] = img
              bumpReady()
            })
            .catch((err) => {
              if (!cancelled) setError(err)
            }),
        )
      }
      await Promise.all(jobs)
    }

    ;(async () => {
      const priority = Math.min(priorityCount, total)
      await loadRange(1, priority)
      if (cancelled) return
      setReadyCount(readyCountRef.current)
      setPriorityReady(true)

      for (let start = priority + 1; start <= total; start += batchSize) {
        if (cancelled) return
        const end = Math.min(start + batchSize - 1, total)
        await loadRange(start, end)
        await new Promise((r) => setTimeout(r, yieldMs))
      }
      if (!cancelled) {
        setReadyCount(readyCountRef.current)
        setFullyLoaded(true)
      }
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(progressFlushRef.current)
    }
  }, [enabled, total, priorityCount, batchSize, preferSharp, yieldMs, bumpReady])

  const progress = readyCount / total

  return {
    framesRef,
    getFrame,
    readyCount,
    priorityReady,
    fullyLoaded,
    progress,
    error,
    total,
  }
}
