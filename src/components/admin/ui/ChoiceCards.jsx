/**
 * Radio choices drawn as cards: the whole card is the click target.
 * options: [{ value, label, hint? }]
 */
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export default function ChoiceCards({
  options,
  value,
  onValueChange,
  disabled = false,
  className,
  ...groupProps
}) {
  const baseId = useId()
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className={cn('grid gap-2 sm:auto-cols-fr sm:grid-flow-col', className)}
      {...groupProps}
    >
      {options.map((opt) => {
        const itemId = `${baseId}-${opt.value}`
        return (
          <Label
            key={opt.value}
            htmlFor={itemId}
            className="min-h-11 cursor-pointer items-start gap-3 rounded-none border border-input bg-white px-3 py-2.5 font-normal transition-colors hover:border-[#c9bdaa] has-[[data-state=checked]]:border-[#1b1917] has-[[data-state=checked]]:bg-[#faf6ee] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
          >
            <RadioGroupItem id={itemId} value={opt.value} className="mt-0.5" />
            <span className="min-w-0">
              <span className="block text-[15px] leading-snug text-foreground">{opt.label}</span>
              {opt.hint && <span className="mt-0.5 block text-[12px] text-muted-foreground">{opt.hint}</span>}
            </span>
          </Label>
        )
      })}
    </RadioGroup>
  )
}
