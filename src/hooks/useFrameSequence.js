/**
 * Preload a scroll-scrub frame sequence.
 * Frames are kept as decoded <img> elements rather than ImageBitmaps: 600 bitmaps
 * would pin ~1 GB of pixels, while the browser may evict and re-decode images.
 * Priority frames load before unlock; the rest load on idle, coarse pass first.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export const FRAME_SOURCES = {
  landscape: { path: '/frames-landscape', total: 600, pad: 4, ext: 'webp' },
  portrait: { path: '/frames-portrait', total: 600, pad: 4, ext: 'webp' },
}

export function frameUrl(source, index) {
  return `${source.path}/frame-${String(index).padStart(source.pad, '0')}.${source.ext}`
}

const COARSE_STEP = 8

function scheduleIdle(cb, timeout = 120) {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(cb, { timeout })
    return () => cancelIdleCallback(id)
  }
  const id = setTimeout(() => cb({ timeRemaining: () => 16, didTimeout: true }), timeout)
  return () => clearTimeout(id)
}

function loadImage(src, highPriority) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    if ('fetchPriority' in img) img.fetchPriority = highPriority ? 'high' : 'low'
    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') await img.decode()
      } catch {
        /* still drawable */
      }
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

export function isFrameDrawable(drawable) {
  return Boolean(
    drawable &&
      drawable.complete &&
      drawable.naturalWidth > 0 &&
      drawable.naturalHeight > 0,
  )
}

export function frameSize(drawable) {
  if (!drawable) return { w: 0, h: 0 }
  return { w: drawable.naturalWidth || 0, h: drawable.naturalHeight || 0 }
}

/** Frame 1..priorityCount in order, then every COARSE_STEP-th frame, then the gaps. */
function loadOrder(total, priorityCount) {
  const priority = []
  for (let i = 1; i <= Math.min(priorityCount, total); i += 1) priority.push(i)

  const seen = new Set(priority)
  const rest = []
  const push = (i) => {
    if (!seen.has(i)) {
      seen.add(i)
      rest.push(i)
    }
  }
  for (let i = 1; i <= total; i += COARSE_STEP) push(i)
  push(total)
  for (let i = 1; i <= total; i += 1) push(i)
  return { priority, rest }
}

/**
 * @param {object} opts
 * @param {{ path: string, total: number, pad: number, ext: string }} opts.source
 * @param {number} [opts.priorityCount=60]
 * @param {number} [opts.batchSize=12] - background idle batch size
 * @param {boolean} [opts.enabled=true]
 */
export function useFrameSequence({
  source,
  priorityCount = 60,
  batchSize = 12,
  enabled = true,
}) {
  const total = source.total
  const framesRef = useRef(/** @type {(HTMLImageElement|null)[]} */ ([]))
  const [priorityReady, setPriorityReady] = useState(false)
  const [fullyLoaded, setFullyLoaded] = useState(false)

  const getExactFrame = useCallback((index1Based) => {
    const img = framesRef.current[Math.round(index1Based) - 1]
    return isFrameDrawable(img) ? img : null
  }, [])

  const getFrame = useCallback(
    (index1Based) => {
      const frames = framesRef.current
      const primary = Math.max(1, Math.min(total, Math.round(index1Based)))
      const direct = frames[primary - 1]
      if (isFrameDrawable(direct)) return direct

      for (let d = 1; d < total; d += 1) {
        const lo = frames[primary - d - 1]
        if (primary - d >= 1 && isFrameDrawable(lo)) return lo
        const hi = frames[primary + d - 1]
        if (primary + d <= total && isFrameDrawable(hi)) return hi
      }
      return null
    },
    [total],
  )

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false
    let cancelIdle = /** @type {null | (() => void)} */ (null)
    framesRef.current = new Array(total).fill(null)
    setPriorityReady(false)
    setFullyLoaded(false)

    const { priority, rest } = loadOrder(total, priorityCount)

    const loadRange = (indices, highPriority) =>
      Promise.all(
        indices.map((idx) =>
          loadImage(frameUrl(source, idx), highPriority)
            .then((img) => {
              if (!cancelled) framesRef.current[idx - 1] = img
            })
            .catch(() => {
              /* neighbour frames cover a missing one */
            }),
        ),
      )

    let cursor = 0
    const pump = () => {
      if (cancelled) return
      if (cursor >= rest.length) {
        setFullyLoaded(true)
        return
      }
      cancelIdle = scheduleIdle(async () => {
        if (cancelled) return
        const batch = rest.slice(cursor, cursor + batchSize)
        cursor += batch.length
        await loadRange(batch, false)
        pump()
      }, 200)
    }

    ;(async () => {
      await loadRange(priority, true)
      if (cancelled) return
      setPriorityReady(true)
      pump()
    })()

    return () => {
      cancelled = true
      if (cancelIdle) cancelIdle()
      framesRef.current = []
    }
  }, [enabled, source, total, priorityCount, batchSize])

  return { getFrame, getExactFrame, priorityReady, fullyLoaded, total }
}
