/**
 * Admin auth — access token in memory, refresh via HttpOnly cookie.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as authApi from '../services/authApi'
import { clearAccessToken } from '../services/apiClient'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)

    ;(async () => {
      try {
        const data = await authApi.refreshSession({ signal: controller.signal })
        if (!cancelled) setUser(data.user)
      } catch {
        clearAccessToken()
        if (!cancelled) setUser(null)
      } finally {
        window.clearTimeout(timeout)
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      clearAccessToken()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      bootstrapping,
      login,
      logout,
    }),
    [user, bootstrapping, login, logout],
  )

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
