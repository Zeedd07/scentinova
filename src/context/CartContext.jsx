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
import { activeSale } from '../lib/sale'

const CartContext = createContext(null)
const STORAGE_KEY = 'scentinova-cart-v2'

/** Display-only sale price for a cart line; checkout always re-prices on the server. */
function saleFields(product) {
  const sale = activeSale(product)
  return { salePrice: sale?.price ?? null, salePercent: sale?.percentOff ?? null }
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
        const sale = saleFields(match)
        if (
          match.id !== line.id ||
          match.name !== line.name ||
          match.price !== line.price ||
          sale.salePrice !== (line.salePrice ?? null) ||
          sale.salePercent !== (line.salePercent ?? null)
        ) {
          changed = true
          next.push({
            ...line,
            id: match.id,
            slug: match.slug,
            name: match.name,
            price: match.price,
            ...sale,
            image: match.image || line.image,
            size: match.size || line.size,
          })
        } else {
          next.push(line)
        }
      }
      return changed ? next : prev
    })
  }, [loading, products])

  const addItem = useCallback(
    (product, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id)
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, qty: i.qty + qty } : i,
          )
        }
        return [
          ...prev,
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            ...saleFields(product),
            image: product.image,
            size: product.size,
            qty,
          },
        ]
      })
      trackAddToCart(product.id, qty)
      setDrawerOpen(true)
    },
    [trackAddToCart],
  )

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i))
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
