/**
 * Admin product form - category picker. Lists the starter categories plus every category
 * already used by a product, and lets the admin type a new one.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORIES } from '../../data/products'
import { adminFetchProductCategories } from '../../services/productApi'

const CATEGORY_MAX = 40
const NEW_OPTION = '__new__'
const STARTER = CATEGORIES.filter((c) => c !== 'All')

function mergeCategories(...lists) {
  const byKey = new Map()
  for (const name of lists.flat()) {
    const clean = String(name || '').trim()
    if (clean && !byKey.has(clean.toLowerCase())) byKey.set(clean.toLowerCase(), clean)
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b))
}

export default function CategoryField({ value, onChange, error }) {
  const [used, setUsed] = useState([])
  const [adding, setAdding] = useState(false)
  const previous = useRef(value)
  const inputRef = useRef(null)

  useEffect(() => {
    let alive = true
    adminFetchProductCategories()
      .then((list) => {
        if (alive && Array.isArray(list)) setUsed(list)
      })
      .catch(() => {
        // Starter categories still work if the list can't load
      })
    return () => {
      alive = false
    }
  }, [])

  const options = useMemo(
    () => mergeCategories(STARTER, used, adding ? [] : [value]),
    [used, adding, value],
  )

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const startAdding = () => {
    previous.current = value
    setAdding(true)
    onChange('')
  }

  /** Reuse the existing spelling when the typed name matches a category already in the list. */
  const tidy = (raw) => {
    const typed = String(raw || '').trim().replace(/\s+/g, ' ')
    return options.find((o) => o.toLowerCase() === typed.toLowerCase()) || typed
  }

  const cancelAdding = () => {
    setAdding(false)
    onChange(previous.current || options[0] || '')
  }

  const backToList = () => {
    const typed = tidy(inputRef.current?.value)
    if (!typed) return cancelAdding()
    setAdding(false)
    onChange(typed)
  }

  const normalise = (e) => {
    const next = tidy(e.target.value)
    if (next !== e.target.value) onChange(next)
  }

  return (
    <div>
      <Label htmlFor="product-category" className="mb-1.5 text-[13px] font-medium text-[#4a4136]">
        Category
      </Label>
      {adding ? (
        <>
          <Input
            id="product-category"
            ref={inputRef}
            placeholder="New category, e.g. Aquatic"
            maxLength={CATEGORY_MAX}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={normalise}
            onKeyDown={(e) => {
              if (e.key === 'Escape') cancelAdding()
            }}
            aria-invalid={Boolean(error)}
            aria-describedby="product-category-help"
          />
          <p id="product-category-help" className="mt-1 text-[12px] admin-muted">
            {error ? (
              <span className="text-[#6e1118]">{error}</span>
            ) : (
              'Saved with this perfume, then offered in the list for every product.'
            )}{' '}
            <Button type="button" variant="link" className="min-h-10 text-[12px] sm:min-h-0" onClick={backToList}>
              Choose from list
            </Button>
          </p>
        </>
      ) : (
        <Select
          value={value}
          onValueChange={(next) => (next === NEW_OPTION ? startAdding() : onChange(next))}
        >
          <SelectTrigger id="product-category" className="w-full" aria-invalid={Boolean(error)}>
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent position="popper">
            {options.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectItem value={NEW_OPTION} className="text-[#7a5f2c]">
              + Add new category…
            </SelectItem>
          </SelectContent>
        </Select>
      )}
      {error && !adding && <p className="mt-1 text-[12px] text-[#6e1118]">{error}</p>}
    </div>
  )
}
