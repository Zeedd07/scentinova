/**
 * Admin login - maison cream / charcoal / gold.
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { ApiClientError } from '../../services/apiClient'

const labelClass = 'text-[12px] tracking-[0.18em] text-muted uppercase'

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
    <div className="flex min-h-dvh items-center justify-center bg-[#f7f3eb] px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <p className="text-center text-[11px] tracking-[0.4em] text-bronze uppercase">
          Scentinova
        </p>
        <h1 className="mt-3 text-center font-display text-3xl text-charcoal sm:text-4xl">
          Admin <span className="text-bronze">sign in</span>
        </h1>
        <p className="mt-3 text-center text-sm text-muted">
          Secure access to the maison catalog.
        </p>

        <Card className="mt-8 rounded-none border-[#e0d6c4] py-0 shadow-none sm:mt-10">
          <CardContent className="p-5 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              {error && (
                <p
                  role="alert"
                  className="border border-[#6e1118]/30 bg-[#6e1118]/5 px-3 py-2 text-sm text-[#6e1118]"
                >
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="admin-email" className={labelClass}>
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className={labelClass}>
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full text-[12px] tracking-[0.22em] uppercase sm:h-12"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-bronze hover:underline">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  )
}
