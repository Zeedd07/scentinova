/**
 * Segmented filter (All / Active / Archived ...). Scrolls sideways on narrow screens,
 * or with `wrap` sits in a two-column grid on phones.
 * options: [{ value, label, count? }]
 */
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export default function FilterTabs({ options, value, onValueChange, label, disabled, wrap = false, className }) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn('min-w-0', className)}>
      <TabsList
        aria-label={label}
        className={cn(
          'h-auto w-full max-w-full group-data-[orientation=horizontal]/tabs:h-auto justify-start gap-1 overflow-x-auto overflow-y-hidden rounded-sm [scrollbar-width:none] bg-transparent p-0 sm:w-fit',
          wrap && 'grid grid-cols-2 sm:flex',
        )}
      >
        {options.map((o) => (
          <TabsTrigger
            key={o.value}
            value={o.value}
            disabled={disabled}
            className={cn(
              'h-10 flex-none rounded-sm border-0 px-3 text-[14px] font-normal text-[#1b1917] hover:bg-cream data-[state=active]:bg-[#1b1917] data-[state=active]:text-[#faf9f6] data-[state=active]:shadow-none sm:h-9',
              wrap && 'w-full sm:w-auto',
            )}
          >
            {o.label}
            {o.count != null && <span className="tabular-nums opacity-70">{o.count}</span>}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
