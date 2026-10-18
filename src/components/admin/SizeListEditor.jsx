/**
 * Admin product form - one row per bottle size, each with its own price.
 * The first row is the default size shown on shop cards.
 */
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SizeMediaEditor, { emptySizeMedia } from './SizeMediaEditor'

export const MAX_PRODUCT_SIZES = 6

export default function SizeListEditor({ rows, onChange, error, slug }) {
  const setRow = (index, key, value) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
  }

  return (
    <fieldset className="min-w-0">
      <legend className="admin-label">Sizes</legend>
      <p className="mt-1 text-[12px] admin-muted">
        Each size has its own price. The first one is the default on the shop.
      </p>
      <ul className="mt-3 space-y-3">
        {rows.map((row, i) => (
          <li key={i} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
            <div>
              <Label htmlFor={`size-ml-${i}`} className="text-[12px] font-medium text-[#4a4136]">
                ml{i === 0 ? ' · default' : ''}
              </Label>
              <Input
                id={`size-ml-${i}`}
                className="mt-1.5"
                inputMode="numeric"
                placeholder="50"
                value={row.ml}
                aria-label={`Size ${i + 1} ml`}
                onChange={(e) => setRow(i, 'ml', e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
              />
            </div>
            <div>
              <Label htmlFor={`size-price-${i}`} className="text-[12px] font-medium text-[#4a4136]">
                Price (INR)
              </Label>
              <Input
                id={`size-price-${i}`}
                className="mt-1.5"
                inputMode="numeric"
                placeholder="2499"
                value={row.price}
                aria-label={`Size ${i + 1} price`}
                onChange={(e) => setRow(i, 'price', e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
              />
            </div>
            <Button
              type="button"
              variant="quiet"
              className="min-h-11 self-end"
              disabled={rows.length === 1}
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            >
              Remove
            </Button>
            {i === 0 ? (
              <p className="col-span-full text-[12px] admin-muted">
                Uses the product photos and videos.
              </p>
            ) : (
              <div className="col-span-full">
                <SizeMediaEditor
                  label={row.ml ? `${row.ml}ml` : `size ${i + 1}`}
                  slug={slug}
                  media={row}
                  onChange={(media) => onChange(rows.map((item, idx) => (idx === i ? { ...item, ...media } : item)))}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      {rows.length < MAX_PRODUCT_SIZES && (
        <Button
          type="button"
          variant="quiet"
          className="mt-3"
          onClick={() => onChange([...rows, { ml: '', price: '', ...emptySizeMedia() }])}
        >
          + Add size
        </Button>
      )}
      {error && <p className="mt-1 text-[12px] text-[#6e1118]">{error}</p>}
    </fieldset>
  )
}
