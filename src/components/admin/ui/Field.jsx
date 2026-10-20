/**
 * Label + control + optional hint or error. Without `htmlFor` the whole field is a
 * <label>, so a single native input inside needs no id.
 */
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const LABEL_CLASS = 'text-[13px] font-medium text-[#4a4136]'

export default function Field({ label, htmlFor, hint, error, className, children }) {
  const note = error ? (
    <span role="alert" className="mt-1 block text-[12px] text-destructive">
      {error}
    </span>
  ) : hint ? (
    <span className="mt-1 block text-[12px] text-muted-foreground">{hint}</span>
  ) : null

  if (htmlFor) {
    return (
      <div className={className}>
        <Label htmlFor={htmlFor} className={LABEL_CLASS}>
          {label}
        </Label>
        <div className="mt-1.5">{children}</div>
        {note}
      </div>
    )
  }

  return (
    <label className={cn('block', className)}>
      <span className={cn('block', LABEL_CLASS)}>{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {note}
    </label>
  )
}
