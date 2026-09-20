import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, bootstrapping } = useAdminAuth()
  const location = useLocation()

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3eb]">
        <p className="text-[11px] tracking-[0.4em] text-[#7a6438] uppercase">
          SCENTINOVA · verifying session
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}
