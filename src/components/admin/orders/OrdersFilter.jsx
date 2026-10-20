/**
 * Orders list filters: status, prepaid or cash, one or more perfumes, and stacked sort.
 */
import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { orderStatusLabel } from '../../../lib/orderStatus'

const STATUSES = [
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'PENDING_PAYMENT',
  'PAYMENT_FAILED',
  'PAYMENT_EXPIRED',
  'REFUND_PENDING',
  'REFUNDED',
]

export const ORDER_SORTS = [
  { key: 'newest', label: 'Newest', group: 'date' },
  { key: 'oldest', label: 'Oldest', group: 'date' },
  { key: 'amount-high', label: 'Highest amount', group: 'amount' },
  { key: 'amount-low', label: 'Lowest amount', group: 'amount' },
]

const PAYMENTS = [
  { value: '', label: 'Any payment' },
  { value: 'PREPAID', label: 'Prepaid' },
  { value: 'COD', label: 'Cash on delivery' },
]

function Choice({ selected, children, onClick }) {
  return (
    <Button
      type="button"
      variant={selected ? 'default' : 'outline'}
      aria-pressed={selected}
      className="h-10 w-full justify-start border-[#c9bdaa] font-normal"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export default function OrdersFilter({
  status,
  method,
  productIds,
  sorts,
  products,
  productsError,
  disabled,
  onStatus,
  onMethod,
  onToggleProduct,
  onToggleSort,
  onClear,
}) {
  const [open, setOpen] = useState(false)
  const productName = (id) => products.find((product) => product.id === id)?.name

  const parts = []
  if (status) parts.push(orderStatusLabel(status))
  if (method === 'COD') parts.push('Cash on delivery')
  if (method === 'PREPAID') parts.push('Prepaid')
  if (productIds.length === 1) parts.push(productName(productIds[0]) || '1 perfume')
  else if (productIds.length > 1) parts.push(`${productIds.length} perfumes`)
  const sortIsDefault = sorts.length === 1 && sorts[0] === 'newest'
  if (!sortIsDefault) {
    parts.push(sorts.map((key) => ORDER_SORTS.find((sort) => sort.key === key)?.label).filter(Boolean).join(', '))
  }
  const summary = parts.length ? parts.join(' · ') : 'All orders'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-label={`Filter, ${summary}`}
          className="w-full justify-start border-[#c9bdaa] sm:w-auto"
        >
          <SlidersHorizontal />
          Filter
          <span className="max-w-[16rem] truncate font-normal text-[#4a4136]">{summary}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(40rem,calc(100vw-2rem))] p-3">
        <div className="grid max-h-[min(32rem,70vh)] gap-4 overflow-y-auto sm:grid-cols-2">
          <div>
            <p className="px-1 pb-1.5 text-[13px] font-medium text-[#4a4136]">Status</p>
            <div className="flex flex-col gap-1">
              <Choice selected={!status} onClick={() => onStatus('')}>All orders</Choice>
              {STATUSES.map((value) => (
                <Choice key={value} selected={status === value} onClick={() => onStatus(value)}>
                  {orderStatusLabel(value)}
                </Choice>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="px-1 pb-1.5 text-[13px] font-medium text-[#4a4136]">Payment</p>
              <div className="flex flex-col gap-1">
                {PAYMENTS.map((option) => (
                  <Choice
                    key={option.label}
                    selected={method === option.value}
                    onClick={() => onMethod(option.value)}
                  >
                    {option.label}
                  </Choice>
                ))}
              </div>
            </div>

            <div>
              <p className="px-1 pb-1.5 text-[13px] font-medium text-[#4a4136]">Perfume</p>
              <p className="px-1 pb-1.5 text-[12px] text-[#6b645b]">Choose any that should be in the order.</p>
              {productsError ? (
                <p className="px-1 text-[13px] text-[#6e1118]">{productsError}</p>
              ) : products.length === 0 ? (
                <p className="px-1 text-[13px] text-[#6b645b]">No perfumes yet.</p>
              ) : (
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                  {products.map((product) => (
                    <Choice
                      key={product.id}
                      selected={productIds.includes(product.id)}
                      onClick={() => onToggleProduct(product.id)}
                    >
                      {product.name}
                    </Choice>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="px-1 pb-1.5 text-[13px] font-medium text-[#4a4136]">Sort</p>
              <p className="px-1 pb-1.5 text-[12px] text-[#6b645b]">
                Click more than one. The first click is the main sort. Click again to remove it.
              </p>
              <div className="flex flex-col gap-1">
                {ORDER_SORTS.map((option) => {
                  const rank = sorts.indexOf(option.key)
                  return (
                    <Choice
                      key={option.key}
                      selected={rank >= 0}
                      onClick={() => onToggleSort(option.key)}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        {option.label}
                        {rank >= 0 && <span className="tabular-nums">{rank + 1}</span>}
                      </span>
                    </Choice>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end border-t border-[#c9bdaa] pt-3">
          <Button type="button" variant="outline" size="sm" className="border-[#c9bdaa]" onClick={onClear}>
            Clear filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
