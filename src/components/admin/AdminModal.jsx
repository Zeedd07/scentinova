/**
 * Admin confirmation / success modal.
 */
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function AdminModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default', // default | danger | success
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
      ? 'border-champagne/50 bg-champagne/10 text-champagne hover:border-champagne'
      : tone === 'success'
        ? 'gold-border text-cream'
        : 'border-gold/40 text-cream hover:border-gold'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-ink/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md border border-gold/25 bg-ink-soft p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-8"
          >
            <p className="text-[10px] tracking-[0.35em] text-bronze uppercase">
              SCENTINOVA Admin
            </p>
            <h2
              id="admin-modal-title"
              className="mt-2 font-display text-2xl text-cream"
            >
              {title}
            </h2>
            {message && (
              <p className="mt-3 text-sm leading-relaxed text-bronze">{message}</p>
            )}
            <div className="mt-8 flex flex-wrap justify-end gap-3">
              {!hideCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="border border-gold/20 px-5 py-2.5 text-[11px] tracking-[0.22em] text-bronze uppercase transition hover:text-cream"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={onConfirm}
                className={`btn-luxury border px-5 py-2.5 ${confirmClass}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
