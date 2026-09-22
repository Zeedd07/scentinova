/**
 * Batch-preload frame sequence with decoded bitmap cache.
 * Desktop prefers sharp cleaned JPEGs; mobile prefers lighter WebP.
 * Priority frames fully decode before unlock; remainder loads on idle.
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

/** @typedef {'webp' | 'clean' | 'original'} FrameFormat */

function urlForFormat(format, index) {
  if (format === 'webp') return frameSrcWebp(index)
  if (format === 'clean') return frameSrcJpg(index)
  return `/frames/frame-${String(index).padStart(3, '0')}.jpg`
}

function formatOrder(preferSharp) {
  return preferSharp
    ? /** @type {FrameFormat[]} */ (['clean', 'original', 'webp'])
    : /** @type {FrameFormat[]} */ (['webp', 'clean', 'original'])
}

function scheduleIdle(cb, timeout = 120) {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(
      (deadline) => {
        cb(deadline)
      },
      { timeout },
    )
    return () => cancelIdleCallback(id)
  }
  const id = setTimeout(() => cb({ timeRemaining: () => 16, didTimeout: true }), timeout)
  return () => clearTimeout(id)
}

/**
 * Decode off the hot path. Prefer createImageBitmap; fall back to Image + decode().
 * @returns {Promise<{ drawable: CanvasImageSource, format: FrameFormat }>}
 */
async function loadDecodedFrame(index, preferSharp, lockedFormat) {
  const formats = lockedFormat
    ? [lockedFormat]
    : formatOrder(preferSharp)

  let lastError = null
  for (const format of formats) {
    const src = urlForFormat(format, index)
    try {
      if (typeof createImageBitmap === 'function' && typeof fetch === 'function') {
        const res = await fetch(src, { credentials: 'same-origin' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const bitmap = await createImageBitmap(blob)
        return { drawable: bitmap, format }
      }

      const img = await new Promise((resolve, reject) => {
        const el = new Image()
        el.decoding = 'async'
        if ('fetchPriority' in el) {
          el.fetchPriority = index <= 24 ? 'high' : 'auto'
        }
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error(`img error ${src}`))
        el.src = src
      })
      try {
        if (typeof img.decode === 'function') await img.decode()
      } catch {
        /* still drawable */
      }
      return { drawable: img, format }
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || new Error(`Failed to load frame ${index}`)
}

export function isFrameDrawable(drawable) {
  if (!drawable) return false
  if (typeof ImageBitmap !== 'undefined' && drawable instanceof ImageBitmap) {
    return drawable.width > 0 && drawable.height > 0
  }
  return Boolean(
    drawable.complete &&
      drawable.naturalWidth > 0 &&
      drawable.naturalHeight > 0,
  )
}

export function frameSize(drawable) {
  if (!drawable) return { w: 0, h: 0 }
  if (typeof ImageBitmap !== 'undefined' && drawable instanceof ImageBitmap) {
    return { w: drawable.width, h: drawable.height }
  }
  return { w: drawable.naturalWidth || 0, h: drawable.naturalHeight || 0 }
}

/**
 * @param {object} opts
 * @param {number} [opts.total=240]
 * @param {number} [opts.priorityCount]
 * @param {number} [opts.batchSize] — background idle batch size
 * @param {boolean} [opts.enabled=true]
 * @param {boolean} [opts.preferSharp=true]
 * @param {number} [opts.frameStep=1] — mobile can use 2 (every other frame)
 * @param {number} [opts.yieldMs=0] — unused when idle scheduling is active; kept for API compat
 */
export function useFrameSequence({
  total = TOTAL_FRAMES,
  priorityCount = PRIORITY_FRAMES,
  batchSize = 8,
  enabled = true,
  preferSharp = true,
  frameStep = 1,
  yieldMs = 0,
} = {}) {
  const framesRef = useRef(/** @type {(CanvasImageSource|null)[]} */ ([]))
  const lockedFormatRef = useRef(/** @type {FrameFormat|null} */ (null))
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

  const snapIndex = useCallback(
    (index1Based) => {
      const clamped = Math.max(1, Math.min(total, Math.round(index1Based)))
      if (frameStep <= 1) return clamped
      const snapped =
        Math.round((clamped - 1) / frameStep) * frameStep + 1
      return Math.max(1, Math.min(total, snapped))
    },
    [total, frameStep],
  )

  const getFrame = useCallback(
    (index1Based) => {
      const primary = snapIndex(index1Based)
      const direct = framesRef.current[primary - 1]
      if (direct && isFrameDrawable(direct)) return direct

      // Wide neighbor scan — critical on mobile while background frames still load
      const maxScan = total
      for (let d = frameStep; d <= maxScan; d += frameStep) {
        const lo = primary - d
        if (lo >= 1) {
          const a = framesRef.current[lo - 1]
          if (a && isFrameDrawable(a)) return a
        }
        const hi = primary + d
        if (hi <= total) {
          const b = framesRef.current[hi - 1]
          if (b && isFrameDrawable(b)) return b
        }
      }
      return null
    },
    [snapIndex, frameStep, total],
  )

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false
    let cancelIdle = /** @type {null | (() => void)} */ (null)
    framesRef.current = new Array(total).fill(null)
    lockedFormatRef.current = null
    readyCountRef.current = 0
    setReadyCount(0)
    setPriorityReady(false)
    setFullyLoaded(false)
    setError(null)

    const indicesToLoad = []
    for (let i = 1; i <= total; i += frameStep) {
      indicesToLoad.push(i)
    }
    if (indicesToLoad[indicesToLoad.length - 1] !== total) {
      indicesToLoad.push(total)
    }

    function releaseDrawable(drawable) {
      if (
        drawable &&
        typeof ImageBitmap !== 'undefined' &&
        drawable instanceof ImageBitmap &&
        typeof drawable.close === 'function'
      ) {
        try {
          drawable.close()
        } catch {
          /* ignore */
        }
      }
    }

    async function loadOne(index) {
      const { drawable, format } = await loadDecodedFrame(
        index,
        preferSharp,
        lockedFormatRef.current,
      )
      if (cancelled) {
        releaseDrawable(drawable)
        return
      }
      if (!lockedFormatRef.current) lockedFormatRef.current = format
      const prev = framesRef.current[index - 1]
      if (prev && prev !== drawable) releaseDrawable(prev)
      framesRef.current[index - 1] = drawable
      bumpReady()
    }

    async function loadRange(indices) {
      await Promise.all(
        indices.map((idx) =>
          loadOne(idx).catch((err) => {
            if (!cancelled) setError(err)
          }),
        ),
      )
    }

    function loadBackground(startAt) {
      let cursor = startAt

      const pump = () => {
        if (cancelled) return
        if (cursor >= indicesToLoad.length) {
          setReadyCount(readyCountRef.current)
          setFullyLoaded(true)
          return
        }

        cancelIdle = scheduleIdle(async (deadline) => {
          if (cancelled) return
          const batch = []
          while (
            cursor < indicesToLoad.length &&
            batch.length < batchSize &&
            (deadline.didTimeout || deadline.timeRemaining() > 4)
          ) {
            batch.push(indicesToLoad[cursor])
            cursor += 1
          }
          if (batch.length === 0 && cursor < indicesToLoad.length) {
            batch.push(indicesToLoad[cursor])
            cursor += 1
          }
          if (batch.length) await loadRange(batch)
          if (yieldMs > 0) {
            await new Promise((r) => setTimeout(r, yieldMs))
          }
          pump()
        }, 200)
      }

      pump()
    }

    ;(async () => {
      const priorityCap = Math.min(priorityCount, total)
      const priorityIndices = indicesToLoad.filter((i) => i <= priorityCap)
      // Always include frame 1
      if (!priorityIndices.includes(1)) priorityIndices.unshift(1)

      await loadRange(priorityIndices)
      if (cancelled) return
      setReadyCount(readyCountRef.current)
      setPriorityReady(true)

      const restStart = indicesToLoad.findIndex(
        (i) => i > priorityCap,
      )
      if (restStart === -1) {
        setFullyLoaded(true)
        return
      }
      loadBackground(restStart)
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(progressFlushRef.current)
      if (cancelIdle) cancelIdle()
      for (const d of framesRef.current) releaseDrawable(d)
      framesRef.current = []
    }
  }, [
    enabled,
    total,
    priorityCount,
    batchSize,
    preferSharp,
    frameStep,
    yieldMs,
    bumpReady,
  ])

  const progress = readyCount / Math.max(1, Math.ceil(total / frameStep))

  return {
    framesRef,
    getFrame,
    readyCount,
    priorityReady,
    fullyLoaded,
    progress: Math.min(1, progress),
    error,
    total,
    frameStep,
  }
}
