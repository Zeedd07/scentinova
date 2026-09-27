/**
 * Admin confirmation / result modal - simple and readable.
 *
 * - Info modals: pass only `onClose` (or `onCancel`); a single OK button closes it.
 * - Confirm modals: pass `onConfirm` + `onCancel`/`onClose`. An async `onConfirm`
 *   locks the buttons until it settles so double clicks cannot fire twice.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { useScrollLock } from '../../hooks/useScrollLock'

function ModalPanel({
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone,
  onConfirm,
  onClose,
  hideCancel,
}) {
  const titleId = useId()
  // While fading out, the overlay must not swallow clicks on the page beneath it
  const isPresent = useIsPresent()
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isPresent) return undefined
    // Capture phase so Escape closes only this modal, not an AdminDialog underneath it
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      if (!pendingRef.current) onClose?.()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [isPresent, onClose])

  const handleConfirm = async () => {
    if (pendingRef.current || !isPresent) return
    if (!onConfirm) {
      onClose?.()
      return
    }
    pendingRef.current = true
    try {
      const result = onConfirm()
      if (result && typeof result.then === 'function') {
        setPending(true)
        await result
      }
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  const handleClose = () => {
    if (pendingRef.current || !isPresent) return
    onClose?.()
  }

  const confirmClass =
    tone === 'danger' ? 'admin-btn admin-btn-danger' : 'admin-btn admin-btn-primary'

  return (
    <div
      data-lenis-prevent
      className={`fixed inset-0 z-[110] flex items-center justify-center px-4 ${
        isPresent ? '' : 'pointer-events-none'
      }`}
    >
      <motion.button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={handleClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="admin-surface relative z-10 w-full max-w-md p-5 shadow-lg sm:p-6"
      >
        <h2 id={titleId} className="text-lg font-semibold text-[#1b1917]">
          {title}
        </h2>
        {message && (
          <p className="mt-2 text-[15px] leading-relaxed text-[#4a4136]">{message}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {!hideCancel && (
            <button
              type="button"
              onClick={handleClose}
              disabled={pending}
              className="admin-btn admin-btn-quiet disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            aria-busy={pending}
            className={`${confirmClass} disabled:opacity-60`}
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
  onClose,
  hideCancel,
}) {
  const close = onCancel || onClose
  const infoOnly = !onConfirm
  useScrollLock(open)

  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalPanel
          key="admin-modal"
          title={title}
          message={message}
          confirmLabel={confirmLabel ?? (infoOnly ? 'OK' : 'Confirm')}
          cancelLabel={cancelLabel}
          tone={tone}
          onConfirm={onConfirm}
          onClose={close}
          hideCancel={hideCancel ?? infoOnly}
        />
      )}
    </AnimatePresence>,
    document.body,
  )
}
