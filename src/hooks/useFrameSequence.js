/**
 * Batch-preload frame sequence with progress reporting.
 * Prefers WebP (`/frames-webp/`) with JPEG fallback (`/frames/` or `/frames-clean/`).
 * Priority: first `priorityCount` frames (for blur-up / early scrub),
 * then remaining frames in concurrent batches.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export const TOTAL_FRAMES = 240
export const PRIORITY_FRAMES = 48

/** Preferred production path (cleaned + WebP). */
export function frameSrcWebp(index) {
  const n = String(index).padStart(3, '0')
  return `/frames-webp/frame-${n}.webp`
}

/** Fallback JPEG (cleaned if present in deploy, else original). */
export function frameSrcJpg(index) {
  const n = String(index).padStart(3, '0')
  // Prefer cleaned JPEGs when WebP unavailable; originals remain as last resort via onerror chain
  return `/frames-clean/frame-${n}.jpg`
}

/** Legacy / poster path — original or cleaned JPEG. */
export function frameSrc(index) {
  return frameSrcWebp(index)
}

/**
 * Load a single Image; tries WebP first, then cleaned JPG, then original JPG.
 */
function loadImage(index) {
  const candidates = [
    frameSrcWebp(index),
    frameSrcJpg(index),
    `/frames/frame-${String(index).padStart(3, '0')}.jpg`,
  ]

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
      img.onload = () => resolve(img)
      img.onerror = () => tryNext()
      img.src = src
    }

    tryNext()
  })
}

/**
 * @param {object} opts
 * @param {number} [opts.total=240]
 * @param {number} [opts.priorityCount=60] — gate the loader until these are ready
 * @param {number} [opts.batchSize=12] — concurrent loads after priority
 * @param {boolean} [opts.enabled=true]
 */
export function useFrameSequence({
  total = TOTAL_FRAMES,
  priorityCount = PRIORITY_FRAMES,
  batchSize = 12,
  enabled = true,
} = {}) {
  const framesRef = useRef(/** @type {(HTMLImageElement|null)[]} */ ([]))
  const [readyCount, setReadyCount] = useState(0)
  const [priorityReady, setPriorityReady] = useState(false)
  const [fullyLoaded, setFullyLoaded] = useState(false)
  const [error, setError] = useState(null)

  const getFrame = useCallback((index1Based) => {
    const i = Math.max(1, Math.min(total, Math.round(index1Based))) - 1
    return framesRef.current[i] ?? null
  }, [total])

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false
    framesRef.current = new Array(total).fill(null)

    async function loadRange(from, to) {
      const jobs = []
      for (let i = from; i <= to; i += 1) {
        const idx = i
        jobs.push(
          loadImage(idx)
            .then((img) => {
              if (cancelled) return
              framesRef.current[idx - 1] = img
              setReadyCount((c) => c + 1)
            })
            .catch((err) => {
              if (!cancelled) setError(err)
            }),
        )
      }
      await Promise.all(jobs)
    }

    ;(async () => {
      // Phase 1 — priority frames for first paint / early scrub
      await loadRange(1, Math.min(priorityCount, total))
      if (cancelled) return
      setPriorityReady(true)

      // Phase 2 — remaining frames in batches (keeps network calm)
      for (let start = priorityCount + 1; start <= total; start += batchSize) {
        if (cancelled) return
        const end = Math.min(start + batchSize - 1, total)
        await loadRange(start, end)
      }
      if (!cancelled) setFullyLoaded(true)
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, total, priorityCount, batchSize])

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
