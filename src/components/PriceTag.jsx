/**
 * Price with an optional sale: sale price, the original struck through, and a "% off" badge.
 */
import { formatPrice } from '../data/products'

const JUSTIFY = { start: 'justify-start', center: 'justify-center', end: 'justify-end' }

export default function PriceTag({
  price,
  salePrice,
  percentOff,
  className = '',
  originalClassName = 'text-[0.7em] text-muted',
  badge = true,
  align = 'center',
}) {
  const onSale = salePrice != null && price != null && Number(salePrice) < Number(price)
  if (!onSale) return <span className={className}>{formatPrice(price)}</span>

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 ${JUSTIFY[align] || JUSTIFY.center}`}>
      <span className={className}>
        <span className="sr-only">Sale price </span>
        {formatPrice(salePrice)}
      </span>
      <s className={originalClassName}>
        <span className="sr-only">Original price </span>
        {formatPrice(price)}
      </s>
      {badge && percentOff != null && (
        <span className="self-center bg-scent-red px-1.5 py-0.5 text-[9px] leading-none tracking-[0.18em] text-warm-white uppercase sm:text-[10px]">
          {percentOff}% off
        </span>
      )}
    </span>
  )
}
