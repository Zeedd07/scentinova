/**
 * Analytics period filter. Presets apply immediately.
 * Custom dates use the shadcn calendar (range mode) and apply only once both days are chosen.
 */
import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const PRESETS = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
]

const pad = (n) => String(n).padStart(2, '0')

function toIso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function fromIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function shortDate(iso) {
  return fromIso(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function customRangeLabel(custom) {
  if (!custom?.from || !custom?.to) return 'Custom dates'
  return `${shortDate(custom.from)} – ${shortDate(custom.to)}`
}

export default function AnalyticsRangeFilter({ value, custom, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const [dates, setDates] = useState(undefined)

  const summary = value === 'custom' ? customRangeLabel(custom) : PRESETS.find((r) => r.key === value)?.label

  const openPopover = (next) => {
    setOpen(next)
    if (!next) return
    setDraft(value)
    setDates(value === 'custom' && custom?.from && custom?.to
      ? { from: fromIso(custom.from), to: fromIso(custom.to) }
      : undefined)
  }

  const applyPreset = (key) => {
    onChange({ range: key, custom: null })
    setOpen(false)
  }

  const applyCustom = () => {
    if (!dates?.from || !dates?.to) return
    onChange({ range: 'custom', custom: { from: toIso(dates.from), to: toIso(dates.to) } })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={openPopover}>
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
      <PopoverContent align="end" className="w-auto max-w-[calc(100vw-2rem)] p-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="w-56">
            <p className="px-2 pt-1 pb-1.5 text-[13px] font-medium text-[#4a4136]">Time period</p>
            <div className="flex flex-col gap-1" role="listbox" aria-label="Time period">
              {PRESETS.map((option) => {
                const selected = draft === option.key
                return (
                  <Button
                    key={option.key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    variant={selected ? 'default' : 'outline'}
                    className="h-10 w-full justify-start border-[#c9bdaa] font-normal"
                    onClick={() => applyPreset(option.key)}
                  >
                    {option.label}
                  </Button>
                )
              })}
              <Button
                type="button"
                role="option"
                aria-selected={draft === 'custom'}
                variant={draft === 'custom' ? 'default' : 'outline'}
                className="h-10 w-full justify-start border-[#c9bdaa] font-normal"
                onClick={() => setDraft('custom')}
              >
                Custom dates
              </Button>
            </div>
          </div>

          {draft === 'custom' && (
            <div className="border-t border-[#c9bdaa] pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
              <p className="px-2 pb-1.5 text-[13px] font-medium text-[#4a4136]">Start and end</p>
              <Calendar
                mode="range"
                selected={dates}
                onSelect={setDates}
                numberOfMonths={1}
                disabled={{ after: new Date() }}
                defaultMonth={dates?.from}
                className="rounded-md border border-[#c9bdaa] bg-white"
              />
              <p className="px-2 pt-2 text-[12px] text-[#6b645b]">Both days are included. Dates use India time.</p>
              <Button
                type="button"
                className="mt-2 w-full"
                disabled={!dates?.from || !dates?.to}
                onClick={applyCustom}
              >
                Apply dates
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
