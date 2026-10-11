/**
 * Date and time picker for admin forms. Value is a local "YYYY-MM-DDTHH:mm" string
 * (same as a datetime-local input) or '' when empty.
 */
import { useState } from 'react'
import { CalendarIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const pad = (n) => String(n).padStart(2, '0')
const HOURS = Array.from({ length: 24 }, (_, h) => pad(h))
const MINUTE_STEPS = Array.from({ length: 12 }, (_, i) => pad(i * 5))

function parse(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '')
  if (!match) return null
  const [, y, m, d, hh, mm] = match
  return { date: new Date(Number(y), Number(m) - 1, Number(d)), hh, mm }
}

function format(date, hh, mm) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${hh}:${mm}`
}

function hourLabel(hh) {
  const h = Number(hh)
  const suffix = h < 12 ? 'am' : 'pm'
  return `${h % 12 || 12} ${suffix}`
}

export default function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  defaultTime = '00:00',
  className,
}) {
  const [open, setOpen] = useState(false)
  const current = parse(value)
  const [defaultHh, defaultMm] = defaultTime.split(':')
  const hh = current?.hh ?? defaultHh
  const mm = current?.mm ?? defaultMm
  const minutes = [...new Set([...MINUTE_STEPS, mm, '59'])].sort()

  const label = current
    ? new Date(`${value}:00`).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : placeholder

  return (
    <div className={cn('flex items-stretch gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              'min-w-0 flex-1 justify-start border-input text-left text-base font-normal',
              !current && 'text-[#9a9288]',
            )}
          >
            <CalendarIcon className="text-muted-foreground" />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" collisionPadding={12}>
          <Calendar
            mode="single"
            selected={current?.date}
            defaultMonth={current?.date}
            onSelect={(date) => {
              if (date) onChange(format(date, hh, mm))
            }}
            className="[--cell-size:--spacing(10)] sm:[--cell-size:--spacing(9)]"
          />
          <div className="flex items-center gap-2 border-t border-border p-3">
            <span className="text-[14px] text-muted-foreground">Time</span>
            <Select
              value={hh}
              disabled={!current}
              onValueChange={(next) => current && onChange(format(current.date, next, mm))}
            >
              <SelectTrigger size="sm" className="w-24" aria-label="Hour">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={h}>
                    {hourLabel(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span aria-hidden="true">:</span>
            <Select
              value={mm}
              disabled={!current}
              onValueChange={(next) => current && onChange(format(current.date, hh, next))}
            >
              <SelectTrigger size="sm" className="w-20" aria-label="Minute">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {minutes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" className="ml-auto" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {current && (
        <Button
          type="button"
          variant="quiet"
          size="icon"
          aria-label="Clear date"
          onClick={() => onChange('')}
        >
          <XIcon />
        </Button>
      )}
    </div>
  )
}
