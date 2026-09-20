/**
 * Cart state — localStorage-backed mock checkout.
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

const CartContext = createContext(null)
const STORAGE_KEY = 'scentinova-cart-v2'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { trackAddToCart } = useCatalog()
  const [items, setItems] = useState(loadCart)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

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
        return sum + i.price * i.qty
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
