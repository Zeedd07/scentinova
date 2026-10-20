/**
 * Scentinova - luxury perfume boutique.
 * Storefront + protected /admin (MongoDB via API).
 */
import { lazy, Suspense, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { CatalogProvider } from './context/CatalogContext'
import MotionProvider from './components/MotionProvider'
import SmoothScroll, { useLenis } from './components/SmoothScroll'
import { pinnedHeaderHeight, smoothScrollTo } from './lib/smoothScroll'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import TrackOrderPage from './pages/TrackOrderPage'
import AboutPage from './pages/AboutPage'

const AdminApp = lazy(() => import('./AdminApp'))

function AdminLoading() {
  return (
    <div className="admin-shell flex items-center justify-center" aria-busy="true">
      <p className="admin-eyebrow">Loading admin…</p>
    </div>
  )
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const lenis = useLenis()
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      const timer = window.setTimeout(() => {
        const el = document.getElementById(id)
        if (!el) return
        const top = el.getBoundingClientRect().top + window.scrollY - pinnedHeaderHeight(64)
        if (lenis) lenis.scrollTo(top, { duration: 1 })
        else smoothScrollTo(top)
      }, 120)
      return () => window.clearTimeout(timer)
    }
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else {
      window.scrollTo({
        top: 0,
        behavior: 'instant' in window ? 'instant' : 'auto',
      })
    }
  }, [pathname, hash, lenis])
  return null
}

function Storefront() {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-ivory text-charcoal">
        <ScrollToTop />
        <Navbar />
        <CartDrawer />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/order-confirmation/:orderNumber"
              element={<OrderConfirmationPage />}
            />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  )
}

function AppShell() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) {
    return (
      <>
        <ScrollToTop />
        <Suspense fallback={<AdminLoading />}>
          <AdminApp />
        </Suspense>
      </>
    )
  }

  return <Storefront />
}

export default function App() {
  return (
    <BrowserRouter>
      <MotionProvider>
        <CatalogProvider>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </CatalogProvider>
      </MotionProvider>
    </BrowserRouter>
  )
}
