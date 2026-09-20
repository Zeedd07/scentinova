/**
 * Admin login — maison cream / charcoal / gold.
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { ApiClientError } from '../../services/apiClient'

export default function AdminLogin() {
  const { login, isAuthenticated, bootstrapping } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!bootstrapping && isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Could not sign in. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3eb] px-6">
      <div className="w-full max-w-md">
        <p className="text-center text-[11px] tracking-[0.4em] text-[#7a6438] uppercase">
          Scentinova
        </p>
        <h1 className="mt-3 text-center font-display text-4xl text-[#171512]">
          Admin <span className="italic text-[#9a7b3c]">sign in</span>
        </h1>
        <p className="mt-3 text-center text-sm text-[#766f66]">
          Secure access to the maison catalog.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-10 space-y-5 border border-[#e0d6c4] bg-[#fffcf7] p-8"
        >
          {error && (
            <p className="border border-[#6e1118]/30 bg-[#6e1118]/5 px-3 py-2 text-sm text-[#6e1118]">
              {error}
            </p>
          )}
          <label className="block">
            <span className="text-[12px] tracking-[0.18em] text-[#766f66] uppercase">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-[#d8d0c2] bg-white px-3 py-2.5 text-[#171512] outline-none focus:border-[#b4975a]"
            />
          </label>
          <label className="block">
            <span className="text-[12px] tracking-[0.18em] text-[#766f66] uppercase">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border border-[#d8d0c2] bg-white px-3 py-2.5 text-[#171512] outline-none focus:border-[#b4975a]"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-[#171512] bg-[#171512] px-4 py-3 text-[12px] tracking-[0.22em] text-[#faf9f6] uppercase transition hover:bg-[#2a2218] disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-[#9a7b3c] hover:underline">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  )
}
