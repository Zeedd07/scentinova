/**
 * Larger admin dialog shell (media picker, uploads, asset details).
 * Phones: a sheet from the bottom with a scrolling body and a sticky footer.
 */
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useScrollLock } from '../../hooks/useScrollLock'

export default function AdminDialog({ open, title, onClose, children, footer, wide = false, tall = false }) {
  // Lenis keeps scrolling the page underneath unless it is stopped as well
  useScrollLock(open)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent
        data-lenis-prevent
        overlayClassName="bg-black/30"
        aria-describedby={undefined}
        className={cn(
          'top-auto bottom-0 left-0 flex max-h-[92dvh] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-t-lg rounded-b-none p-0 text-[15px] leading-normal',
          'sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:max-h-[90vh] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg',
          wide ? 'sm:max-w-4xl' : 'sm:max-w-lg',
          tall && 'h-[92dvh] sm:h-auto',
        )}
      >
        <div className="flex items-center gap-3 border-b border-border py-3 pr-14 pl-5 sm:py-4">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-border bg-background px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:flex-wrap sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
