/**
 * Larger admin dialog shell (media picker, uploads, asset details).
 */
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { useScrollLock } from '../../hooks/useScrollLock'

function DialogPanel({ title, onClose, children, footer, wide }) {
  const titleId = useId()
  const panelRef = useRef(null)
  // While fading out, the overlay must not swallow clicks on the page beneath it
  const isPresent = useIsPresent()

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  const close = () => {
    if (isPresent) onClose?.()
  }

  return (
    <div
      data-lenis-prevent
      className={`fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:px-4 ${
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
        onClick={close}
      />
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={`admin-surface relative z-10 flex max-h-[92vh] w-full flex-col font-sans text-[15px] leading-normal text-charcoal shadow-lg outline-none ${
          wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-stone px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-charcoal">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            className="admin-link border-0 bg-transparent text-[20px] leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-stone px-5 py-3">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function AdminDialog({ open, title, onClose, children, footer, wide = false }) {
  useScrollLock(open)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Portal keeps dialog inputs out of any surrounding <form> (e.g. the product editor).
  return createPortal(
    <AnimatePresence>
      {open && (
        <DialogPanel key="admin-dialog" title={title} onClose={onClose} footer={footer} wide={wide}>
          {children}
        </DialogPanel>
      )}
    </AnimatePresence>,
    document.body,
  )
}
