/**
 * Catalog + analytics + mock orders — localStorage-backed admin source of truth.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { PRODUCTS as SEED_PRODUCTS } from '../data/products'

const PRODUCTS_KEY = 'aurum-admin-products-v1'
const ANALYTICS_KEY = 'aurum-admin-analytics-v1'
const ORDERS_KEY = 'aurum-admin-orders-v1'

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function withDefaults(p) {
  return {
    active: true,
    stock: 48,
    ...p,
    notes: {
      top: p.notes?.top ?? [],
      heart: p.notes?.heart ?? [],
      base: p.notes?.base ?? [],
    },
    gallery: p.gallery?.length ? p.gallery : p.image ? [p.image] : [],
  }
}

function seedAnalytics(products) {
  const out = {}
  products.forEach((p, i) => {
    const views = 180 + ((i * 97) % 420)
    const addToCarts = Math.round(views * (0.08 + (i % 5) * 0.02))
    const purchases = Math.round(addToCarts * (0.35 + (i % 4) * 0.05))
    out[p.id] = {
      views,
      addToCarts,
      purchases,
      revenue: purchases * p.price,
    }
  })
  return out
}

function seedOrders(products) {
  const picks = products.slice(0, 4)
  const now = Date.now()
  return [
    {
      id: 'ord-demo-1',
      createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      status: 'Shipped',
      email: 'claire@atelier.fr',
      name: 'Claire Moreau',
      address: '12 Rue des Ateliers, 75003 Paris',
      items: [
        { id: picks[0]?.id, name: picks[0]?.name, qty: 1, price: picks[0]?.price },
        { id: picks[1]?.id, name: picks[1]?.name, qty: 2, price: picks[1]?.price },
      ].filter((i) => i.id),
      total:
        (picks[0]?.price ?? 0) + (picks[1]?.price ?? 0) * 2,
    },
    {
      id: 'ord-demo-2',
      createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
      status: 'Packed',
      email: 'james@studio.co',
      name: 'James Whit',
      address: '88 King St, London',
      items: [
        { id: picks[2]?.id, name: picks[2]?.name, qty: 1, price: picks[2]?.price },
      ].filter((i) => i.id),
      total: picks[2]?.price ?? 0,
    },
    {
      id: 'ord-demo-3',
      createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
      status: 'New',
      email: 'aisha@mail.com',
      name: 'Aisha Khan',
      address: 'Dubai Marina, UAE',
      items: [
        { id: picks[0]?.id, name: picks[0]?.name, qty: 1, price: picks[0]?.price },
        { id: picks[3]?.id, name: picks[3]?.name, qty: 1, price: picks[3]?.price },
      ].filter((i) => i.id),
      total: (picks[0]?.price ?? 0) + (picks[3]?.price ?? 0),
    },
  ]
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return { ok: true }
  } catch (err) {
    console.error('localStorage write failed', key, err)
    return {
      ok: false,
      error:
        'Could not save (storage full). Use a smaller image or an image URL path like /products/name.png.',
    }
  }
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(() => {
    const saved = loadJson(PRODUCTS_KEY, null)
    if (Array.isArray(saved) && saved.length) return saved.map(withDefaults)
    return SEED_PRODUCTS.map(withDefaults)
  })

  const [analytics, setAnalytics] = useState(() => {
    const saved = loadJson(ANALYTICS_KEY, null)
    if (saved && typeof saved === 'object') return saved
    return seedAnalytics(SEED_PRODUCTS)
  })

  const [orders, setOrders] = useState(() => {
    const saved = loadJson(ORDERS_KEY, null)
    if (Array.isArray(saved)) return saved
    return seedOrders(SEED_PRODUCTS)
  })

  useEffect(() => {
    persist(PRODUCTS_KEY, products)
  }, [products])

  useEffect(() => {
    persist(ANALYTICS_KEY, analytics)
  }, [analytics])

  useEffect(() => {
    persist(ORDERS_KEY, orders)
  }, [orders])

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

  const bumpAnalytics = useCallback((id, patch) => {
    setAnalytics((prev) => {
      const cur = prev[id] ?? {
        views: 0,
        addToCarts: 0,
        purchases: 0,
        revenue: 0,
      }
      return { ...prev, [id]: { ...cur, ...patch(cur) } }
    })
  }, [])

  const trackView = useCallback(
    (id) => {
      if (!id) return
      bumpAnalytics(id, (c) => ({ views: c.views + 1 }))
    },
    [bumpAnalytics],
  )

  const trackAddToCart = useCallback(
    (id, qty = 1) => {
      if (!id) return
      bumpAnalytics(id, (c) => ({ addToCarts: c.addToCarts + qty }))
    },
    [bumpAnalytics],
  )

  const saveProduct = useCallback((input, existingId = null) => {
    const name = input.name?.trim() || 'Untitled'
    const baseSlug = input.slug?.trim() || slugify(name)
    const id =
      existingId ||
      input.id ||
      `p-${slugify(name) || 'perfume'}-${Date.now().toString(36)}`

    let savedProduct = null
    let write = { ok: true }

    setProducts((prev) => {
      let slug = baseSlug || id
      const clash = prev.some((p) => p.slug === slug && p.id !== id)
      if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

      const image = input.image || input.gallery?.[0] || '/products/aurum.png'

      savedProduct = withDefaults({
        ...input,
        id,
        name,
        slug,
        price: toNumber(input.price, 0),
        stock: toNumber(input.stock, 0),
        featured: Boolean(input.featured),
        active: input.active !== false,
        badge: input.badge || null,
        image,
        gallery: input.gallery?.length ? input.gallery : [image],
        notes: {
          top: parseNotes(input.notes?.top),
          heart: parseNotes(input.notes?.heart),
          base: parseNotes(input.notes?.base),
        },
      })

      const idx = prev.findIndex((p) => p.id === id)
      const next =
        idx === -1
          ? [...prev, savedProduct]
          : prev.map((p, i) => (i === idx ? savedProduct : p))

      write = persist(PRODUCTS_KEY, next)
      return write.ok ? next : prev
    })

    if (write.ok) {
      setAnalytics((a) => {
        if (a[id]) return a
        const nextA = {
          ...a,
          [id]: { views: 0, addToCarts: 0, purchases: 0, revenue: 0 },
        }
        persist(ANALYTICS_KEY, nextA)
        return nextA
      })
    }

    return {
      ok: write.ok,
      id,
      product: savedProduct,
      error: write.ok ? null : write.error,
    }
  }, [])

  const deleteProduct = useCallback((id) => {
    let write = { ok: true }
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id)
      write = persist(PRODUCTS_KEY, next)
      return write.ok ? next : prev
    })
    if (write.ok) {
      setAnalytics((prev) => {
        const copy = { ...prev }
        delete copy[id]
        persist(ANALYTICS_KEY, copy)
        return copy
      })
    }
    return { ok: write.ok, error: write.error || null }
  }, [])

  const resetCatalog = useCallback(() => {
    const seeded = SEED_PRODUCTS.map(withDefaults)
    const a = seedAnalytics(SEED_PRODUCTS)
    const o = seedOrders(SEED_PRODUCTS)
    setProducts(seeded)
    setAnalytics(a)
    setOrders(o)
    persist(PRODUCTS_KEY, seeded)
    persist(ANALYTICS_KEY, a)
    persist(ORDERS_KEY, o)
  }, [])

  const placeOrder = useCallback((order) => {
    const id = `ord-${Date.now().toString(36)}`
    const record = {
      id,
      createdAt: new Date().toISOString(),
      status: 'New',
      ...order,
    }
    setOrders((prev) => [record, ...prev])

    record.items?.forEach((item) => {
      bumpAnalytics(item.id, (c) => ({
        purchases: c.purchases + item.qty,
        revenue: c.revenue + item.price * item.qty,
      }))
      setProducts((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, stock: Math.max(0, (p.stock ?? 0) - item.qty) }
            : p,
        ),
      )
    })

    return id
  }, [bumpAnalytics])

  const updateOrderStatus = useCallback((id, status) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o)),
    )
  }, [])

  const stats = useMemo(() => {
    const rows = products.map((p) => {
      const a = analytics[p.id] ?? {
        views: 0,
        addToCarts: 0,
        purchases: 0,
        revenue: 0,
      }
      const cartRate = a.views ? (a.addToCarts / a.views) * 100 : 0
      const buyRate = a.addToCarts ? (a.purchases / a.addToCarts) * 100 : 0
      return { product: p, ...a, cartRate, buyRate }
    })

    const totals = rows.reduce(
      (acc, r) => {
        acc.views += r.views
        acc.addToCarts += r.addToCarts
        acc.purchases += r.purchases
        acc.revenue += r.revenue
        return acc
      },
      { views: 0, addToCarts: 0, purchases: 0, revenue: 0 },
    )

    const byCategory = {}
    rows.forEach((r) => {
      const cat = r.product.category || 'Other'
      if (!byCategory[cat]) {
        byCategory[cat] = { revenue: 0, purchases: 0, views: 0 }
      }
      byCategory[cat].revenue += r.revenue
      byCategory[cat].purchases += r.purchases
      byCategory[cat].views += r.views
    })

    const topSellers = [...rows].sort((a, b) => b.revenue - a.revenue)
    const slowMovers = [...rows].sort((a, b) => a.purchases - b.purchases)
    const lowStock = products.filter((p) => (p.stock ?? 0) <= 8)

    return { rows, totals, byCategory, topSellers, slowMovers, lowStock }
  }, [products, analytics])

  const value = {
    products,
    activeProducts,
    featuredProducts,
    analytics,
    orders,
    stats,
    getBySlug,
    getById,
    saveProduct,
    deleteProduct,
    resetCatalog,
    trackView,
    trackAddToCart,
    placeOrder,
    updateOrderStatus,
  }

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  )
}

function parseNotes(value) {
  if (Array.isArray(value)) {
    return value.map((n) => String(n).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
  }
  return []
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}
