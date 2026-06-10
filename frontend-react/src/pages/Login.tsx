import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GraduationCap, LogIn } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { applyToken, fetchAuthProfile, persistProfile, profileFromAuthResponse } from '../utils/authSession'
import { FormField, formInputClass } from '../components/ui/FormField'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('session') === 'expired'
  const { setAuth } = useAuth()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { login: login.trim(), password })
      const token = res.data.token
      if (!token) {
        throw new Error('Login response missing token')
      }

      localStorage.setItem('token', token)
      applyToken(token)

      // Login already returns user + permissions; use that first to avoid a second failing request.
      let profile = profileFromAuthResponse(res.data as Record<string, unknown>)
      if (!profile.user) {
        profile = await fetchAuthProfile()
      } else {
        persistProfile(profile)
      }

      setAuth(profile)
      const redirect = searchParams.get('redirect')
      const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard'
      navigate(safeRedirect)
    } catch (err: any) {
      const data = err?.response?.data
      const validation = data?.errors ? Object.values(data.errors).flat().join(' ') : null
      setError(
        validation
          || data?.message
          || (err?.code === 'ECONNABORTED' ? 'API server timed out. Is Laravel running on port 8000?' : null)
          || (err?.code === 'INVALID_API_RESPONSE' ? 'API returned HTML instead of JSON. Check that /api is proxied to Laravel.' : null)
          || (err?.message === 'Network Error' ? 'Cannot reach API server. Run: php artisan serve' : null)
          || err?.message
          || 'Login failed'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 px-4 py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">School Management Portal</h1>
            <p className="mt-3 text-sm text-blue-100">Sign in with your email, username, or phone number to access your dashboard.</p>
          </div>
          <p className="text-xs text-blue-100/80">New students apply through Admissions, pay fees, and receive login credentials after approval.</p>
        </div>

        <form onSubmit={submit} className="p-8 sm:p-10">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e3a5f] text-white">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
              <p className="text-sm text-slate-500">Welcome back</p>
            </div>
          </div>

          <h2 className="mb-1 hidden text-2xl font-bold text-slate-900 lg:block">Sign in</h2>
          <p className="mb-6 hidden text-sm text-slate-500 lg:block">Use email, username, or phone number</p>

          {sessionExpired && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your session has expired. Please sign in again.
            </div>
          )}
          {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="space-y-4">
            <FormField label="Email, username, or phone" required>
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="admin@test.com"
                className={formInputClass}
                required
                autoComplete="username"
              />
            </FormField>
            <FormField label="Password" required>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className={formInputClass}
                required
                autoComplete="current-password"
              />
            </FormField>
          </div>

          <div className="mt-4 text-sm">
            <Link to="/forgot-password" className="font-medium text-[#1e3a5f] hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#162d4a] disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
