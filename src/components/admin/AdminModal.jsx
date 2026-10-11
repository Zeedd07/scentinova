/**
 * Admin confirmation / result modal - simple and readable.
 *
 * - Info modals: pass only `onClose` (or `onCancel`); a single OK button closes it.
 * - Confirm modals: pass `onConfirm` + `onCancel`/`onClose`. An async `onConfirm`
 *   locks the buttons until it settles so double clicks cannot fire twice.
 */
import { useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useScrollLock } from '../../hooks/useScrollLock'

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
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const confirmRef = useRef(null)
  useScrollLock(open)

  const handleClose = () => {
    if (pendingRef.current) return
    close?.()
  }

  const handleConfirm = async () => {
    if (pendingRef.current) return
    if (!onConfirm) {
      close?.()
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

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <AlertDialogContent
        data-lenis-prevent
        overlayClassName="bg-black/30"
        className="gap-0 p-5 data-[size=default]:sm:max-w-md sm:p-6"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          confirmRef.current?.focus()
        }}
        onEscapeKeyDown={(e) => {
          if (pendingRef.current) e.preventDefault()
        }}
        {...(message ? {} : { 'aria-describedby': undefined })}
      >
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-lg font-semibold">{title}</AlertDialogTitle>
          {message && (
            <AlertDialogDescription className="mt-1 text-[15px] leading-relaxed text-[#4a4136]">
              {message}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-2">
          {!(hideCancel ?? infoOnly) && (
            <Button type="button" variant="quiet" onClick={handleClose} disabled={pending}>
              {cancelLabel}
            </Button>
          )}
          <Button
            ref={confirmRef}
            type="button"
            variant={tone === 'danger' ? 'danger' : 'default'}
            onClick={handleConfirm}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? 'Working…' : (confirmLabel ?? (infoOnly ? 'OK' : 'Confirm'))}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
