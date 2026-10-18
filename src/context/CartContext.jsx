/**
 * Cart state - localStorage-backed mock checkout.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useCatalog } from './CatalogContext'
import { productSizes } from '../lib/productSizes'

const CartContext = createContext(null)
const STORAGE_KEY = 'scentinova-cart-v2'

function sameLine(line, id, sizeMl) {
  return line.id === id && (line.sizeMl ?? null) === (sizeMl ?? null)
}

/** One cart line for a chosen bottle size. */
function lineFrom(product, size, qty, image) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: size.price,
    pricePaise: size.pricePaise,
    salePrice: size.sale?.price ?? null,
    salePercent: size.sale?.percentOff ?? null,
    image: image || product.image,
    size: size.label,
    sizeMl: size.ml,
    qty,
  }
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { trackAddToCart, products, loading } = useCatalog()
  const [items, setItems] = useState(loadCart)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // Remap cart lines to current Mongo product ids (by slug) after catalog loads
  useEffect(() => {
    if (loading || !products?.length) return
    setItems((prev) => {
      if (!prev.length) return prev
      let changed = false
      const next = []
      for (const line of prev) {
        const match =
          products.find((p) => p.id === line.id) ||
          products.find((p) => p.slug === line.slug)
        if (!match) {
          changed = true
          continue
        }
        const sizes = productSizes(match)
        const size = sizes.find((s) => s.ml === line.sizeMl) || sizes[0]
        const fresh = lineFrom(match, size, line.qty, match.image || line.image)
        if (
          fresh.id !== line.id ||
          fresh.name !== line.name ||
          fresh.price !== line.price ||
          fresh.pricePaise !== line.pricePaise ||
          fresh.salePrice !== (line.salePrice ?? null) ||
          fresh.salePercent !== (line.salePercent ?? null) ||
          fresh.size !== line.size ||
          fresh.sizeMl !== line.sizeMl
        ) {
          changed = true
          next.push(fresh)
        } else {
          next.push(line)
        }
      }
      return changed ? next : prev
    })
  }, [loading, products])

  const addItem = useCallback(
    (product, qty = 1, size) => {
      const chosen = size || productSizes(product)[0]
      if (!chosen) return
      setItems((prev) => {
        const existing = prev.find((i) => sameLine(i, product.id, chosen.ml))
        if (existing) {
          return prev.map((i) =>
            sameLine(i, product.id, chosen.ml) ? { ...i, qty: i.qty + qty } : i,
          )
        }
        return [...prev, lineFrom(product, chosen, qty)]
      })
      trackAddToCart(product.id, qty)
      setDrawerOpen(true)
    },
    [trackAddToCart],
  )

  const removeItem = useCallback((id, sizeMl) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, id, sizeMl)))
  }, [])

  const setQty = useCallback((id, qty, sizeMl) => {
    setItems((prev) =>
      prev
        .map((i) => (sameLine(i, id, sizeMl) ? { ...i, qty: Math.max(0, qty) } : i))
        .filter((i) => i.qty > 0),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items],
  )

  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => {
        if (i.price == null) return sum
        return sum + (i.salePrice ?? i.price) * i.qty
      }, 0),
    [items],
  )

  const savings = useMemo(
    () =>
      items.reduce((sum, i) => {
        if (i.price == null || i.salePrice == null) return sum
        return sum + (i.price - i.salePrice) * i.qty
      }, 0),
    [items],
  )

  const hasPricedItems = useMemo(
    () => items.some((i) => i.price != null),
    [items],
  )

  const value = {
    items,
    count,
    subtotal,
    savings,
    hasPricedItems,
    drawerOpen,
    setDrawerOpen,
    addItem,
    removeItem,
    setQty,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
