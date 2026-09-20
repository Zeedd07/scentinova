/**
 * Admin confirmation modal — simple and readable.
 */
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function AdminModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
  hideCancel = false,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  const confirmClass =
    tone === 'danger'
      ? 'admin-btn admin-btn-danger'
      : 'admin-btn admin-btn-primary'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="admin-surface relative z-10 w-full max-w-md p-5 shadow-lg sm:p-6"
          >
            <h2
              id="admin-modal-title"
              className="text-lg font-semibold text-[#1b1917]"
            >
              {title}
            </h2>
            {message && (
              <p className="mt-2 text-[15px] leading-relaxed text-[#4a4136]">
                {message}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {!hideCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="admin-btn admin-btn-quiet"
                >
                  {cancelLabel}
                </button>
              )}
              <button type="button" onClick={onConfirm} className={confirmClass}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
