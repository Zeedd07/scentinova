/**
 * One Filter button that opens every filter for a list.
 * groups: [{ id, title, value, onValueChange, options: [{ value, label }] }]
 */
import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function FilterButton({ groups, disabled = false, align = 'start' }) {
  const [open, setOpen] = useState(false)
  const summary = groups
    .map((group) => group.options.find((option) => option.value === group.value)?.label)
    .filter(Boolean)
    .join(' · ')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-label={summary ? `Filter, ${summary}` : 'Filter'}
          className="w-full justify-start sm:w-auto"
        >
          <SlidersHorizontal />
          Filter
          {summary && <span className="truncate font-normal text-[#4a4136]">{summary}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-64 p-2">
        <div className="max-h-[min(24rem,70vh)] space-y-3 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="px-2 pt-1 pb-1.5 text-[13px] font-medium text-[#4a4136]">{group.title}</p>
              <div className="flex flex-col gap-1" role="listbox" aria-label={group.title}>
                {group.options.map((option) => {
                  const selected = option.value === group.value
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      variant={selected ? 'default' : 'outline'}
                      className="h-10 w-full justify-start font-normal"
                      onClick={() => {
                        group.onValueChange(option.value)
                        if (groups.length === 1) setOpen(false)
                      }}
                    >
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
