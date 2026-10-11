/**
 * Admin product form - the product's own discount, as a percentage off or a fixed price.
 * AdminProductForm converts the form strings to the API shape on save.
 */
import { formatPrice } from '../../data/products'
import {
  DISCOUNT_PERCENT_MAX,
  DISCOUNT_PERCENT_MIN,
  discountPreview,
} from '../../lib/productDiscount'

const OPTIONS = [
  { value: 'NONE', label: 'No discount' },
  { value: 'PERCENT', label: 'Percentage off' },
  { value: 'PRICE', label: 'Discounted price' },
]

export default function ProductDiscountEditor({ value, price, onChange, error }) {
  const set = (key) => (next) => onChange({ ...value, [key]: next })
  const preview = discountPreview(value, price)
  const regular = Number(price)
  const isPercent = value.type === 'PERCENT'

  return (
    <div className="space-y-4">
      <div>
        <span className="admin-label" id="discount-label">
          Discount
        </span>
        <p className="mt-1 text-[13px] admin-muted">
          Lower this perfume&apos;s price for everyone. Shoppers see the old price struck through
          and the saving is applied automatically at checkout.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="discount-label"
        className="inline-flex flex-wrap border border-[#e0d6c4] bg-[#fffcf7]"
      >
        {OPTIONS.map((opt) => {
          const selected = value.type === opt.value
          return (
            <label
              key={opt.value}
              className={`cursor-pointer px-4 py-2 text-[14px] transition-colors ${
                selected ? 'bg-[#1b1917] text-[#f7f1e6]' : 'text-[#4a4136] hover:bg-[#f3ebdc]'
              }`}
            >
              <input
                type="radio"
                name="discount-type"
                value={opt.value}
                checked={selected}
                onChange={() => set('type')(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          )
        })}
      </div>

      {value.type !== 'NONE' && (
        <div className="space-y-3 border border-[#e0d6c4] bg-[#fffcf7] p-4">
          <div>
            <label htmlFor="discount-amount" className="admin-label">
              {isPercent ? 'Percent off' : 'Price customers pay (INR)'}
            </label>
            <div className="relative mt-1.5 max-w-[12rem]">
              <span
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[15px] admin-muted ${
                  isPercent ? 'right-3' : 'left-3'
                }`}
                aria-hidden
              >
                {isPercent ? '%' : '₹'}
              </span>
              <input
                id="discount-amount"
                className="admin-input"
                style={{
                  marginTop: 0,
                  ...(isPercent ? { paddingRight: '1.75rem' } : { paddingLeft: '1.75rem' }),
                }}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={isPercent ? '20' : regular > 0 ? String(Math.floor(regular * 0.8)) : '0'}
                value={isPercent ? value.percent : value.price}
                onChange={(e) => set(isPercent ? 'percent' : 'price')(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby="discount-help"
              />
            </div>
            {error ? (
              <p id="discount-help" className="mt-1 text-[13px] text-[#6e1118]">
                {error}
              </p>
            ) : (
              <p id="discount-help" className="mt-1 text-[13px] admin-muted">
                {isPercent
                  ? `Whole number from ${DISCOUNT_PERCENT_MIN} to ${DISCOUNT_PERCENT_MAX}. The result is rounded to the nearest rupee.`
                  : 'Whole rupees, lower than the regular price.'}
              </p>
            )}
          </div>

          {preview ? (
            <p className="text-[15px] text-[#1b1917]" aria-live="polite">
              Customers pay <strong>{formatPrice(preview.price)}</strong>{' '}
              <span className="admin-muted line-through">{formatPrice(regular)}</span>{' '}
              <span className="font-medium text-[#6e1118]">
                ({preview.percentOff}% off, save {formatPrice(preview.saving)})
              </span>
            </p>
          ) : (
            <p className="text-[13px] admin-muted" aria-live="polite">
              {regular > 0
                ? 'Enter an amount to see what customers will pay.'
                : 'Set the regular price first.'}
            </p>
          )}

          <p className="text-[12px] admin-muted">
            If a festival sale from Offers &amp; sales gives a lower price, that price is used
            instead. Discounts never add up.
          </p>
        </div>
      )}
    </div>
  )
}
