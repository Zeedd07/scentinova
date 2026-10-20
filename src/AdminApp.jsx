/**
 * Admin panel routes. Loaded on demand so storefront visitors never download the admin or its charts.
 */
import { Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './context/AdminAuthContext'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminOverview from './pages/admin/AdminOverview'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminMediaLibrary from './pages/admin/AdminMediaLibrary'
import AdminOffers from './pages/admin/AdminOffers'

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id" element={<AdminProductForm />} />
          <Route path="media" element={<AdminMediaLibrary />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  )
}

function AdminNotFound() {
  return (
    <div className="space-y-2">
      <h2 className="admin-title">Page not found</h2>
      <p className="admin-muted">This admin page does not exist.</p>
    </div>
  )
}
