/**
 * On/off setting: a switch with its label (and optional hint) as the click target.
 */
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export default function SwitchField({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}) {
  const autoId = useId()
  const fieldId = id || autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <Switch
        id={fieldId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={hintId}
        className="mt-px"
      />
      <div className="min-w-0">
        <Label htmlFor={fieldId} className="min-h-6 text-[15px] font-normal text-foreground sm:min-h-5">
          {label}
        </Label>
        {hint && (
          <p id={hintId} className="mt-0.5 text-[12px] text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
