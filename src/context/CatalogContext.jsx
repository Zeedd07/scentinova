/**
 * Catalog — MongoDB via Scentinova API (storefront source of truth).
 * Cart remains localStorage; orders/analytics go to the backend.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { fetchProducts } from '../services/productApi'
import { createOrder } from '../services/orderApi'
import { trackEvent } from '../services/analyticsApi'
import { ApiClientError } from '../services/apiClient'

const LEGACY_KEYS = [
  'scentinova-admin-products-v4',
  'scentinova-admin-analytics-v4',
  'scentinova-admin-orders-v4',
]

function clearLegacyCatalogStorage() {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}

const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    clearLegacyCatalogStorage()
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { products: list } = await fetchProducts({ limit: 100 })
        if (!alive) return
        setProducts(Array.isArray(list) ? list : [])
      } catch (err) {
        if (!alive) return
        const message =
          err instanceof ApiClientError
            ? err.message
            : 'The Scentinova service is temporarily unavailable. Please try again.'
        setError(message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const refreshProducts = useCallback(async () => {
    setError(null)
    try {
      const { products: list } = await fetchProducts({ limit: 100 })
      setProducts(Array.isArray(list) ? list : [])
      return { ok: true }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'The Scentinova service is temporarily unavailable. Please try again.'
      setError(message)
      return { ok: false, error: message }
    }
  }, [])

  const activeProducts = useMemo(
    () => products.filter((p) => p.active !== false),
    [products],
  )

  const getBySlug = useCallback(
    (slug) => products.find((p) => p.slug === slug) ?? null,
    [products],
  )

  const getById = useCallback(
    (id) => products.find((p) => p.id === id) ?? null,
    [products],
  )

  const featuredProducts = useMemo(
    () => activeProducts.filter((p) => p.featured),
    [activeProducts],
  )

  const trackView = useCallback((id) => {
    if (!id) return
    trackEvent('product_view', { productId: id }).catch(() => {})
  }, [])

  const trackAddToCart = useCallback((id, qty = 1) => {
    if (!id) return
    trackEvent('add_to_cart', {
      productId: id,
      metadata: { quantity: qty },
    }).catch(() => {})
  }, [])

  const placeOrder = useCallback(async (payload) => {
    const order = await createOrder(payload)
    return order
  }, [])

  const value = {
    products,
    activeProducts,
    featuredProducts,
    loading,
    error,
    refreshProducts,
    getBySlug,
    getById,
    trackView,
    trackAddToCart,
    placeOrder,
    // Admin compatibility stubs — real admin uses AdminData / API services
    analytics: {},
    orders: [],
    stats: {
      rows: [],
      totals: { views: 0, addToCarts: 0, purchases: 0, revenue: 0 },
      byCategory: {},
      topSellers: [],
      slowMovers: [],
      lowStock: [],
    },
    saveProduct: async () => ({ ok: false, error: 'Use admin API' }),
    deleteProduct: async () => ({ ok: false, error: 'Use admin API' }),
    resetCatalog: async () => {},
    updateOrderStatus: async () => {},
  }

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  )
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}
