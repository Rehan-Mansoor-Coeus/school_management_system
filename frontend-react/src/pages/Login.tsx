import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, MessageCircle, User } from 'lucide-react'

import api from '../api/client'
import {
  appCopyrightLabel,
  appDevelopedByLabel,
  appVersionLabel,
} from '../config/appMeta'
import { useAuth } from '../context/AuthContext'
import {
  applyToken,
  bumpAuthEpoch,
  clearOrphanedSessionIfNoToken,
  clearStoredSession,
  fetchAuthProfile,
  homePathForProfile,
  persistProfile,
  profileFromAuthResponse,
  profileHasPlatformSuperAdminRole,
  readCachedProfile,
} from '../utils/authSession'
import { formatApiError } from '../utils/apiError'

function OkusomaSpinLogo() {
  return (
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-[#1e3a5f]/25 bg-white p-2 shadow-sm">
      <div className="okusoma-logo-spin flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73]">
        <img
          src="/alpha-bridge-logo.png"
          alt="Okusoma"
          className="h-14 w-14 object-contain brightness-0 invert"
        />
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('session') === 'expired'
  const signupSuccess = searchParams.get('signup') === 'success'
  const { setAuth, clearAuth, user } = useAuth()

  useEffect(() => {
    if (sessionExpired || !localStorage.getItem('token')) {
      clearOrphanedSessionIfNoToken()
      if (sessionExpired) {
        clearStoredSession()
        clearAuth()
      }
    }

    const token = localStorage.getItem('token')
    if (token && user) {
      const cached = readCachedProfile()
      navigate(homePathForProfile(cached), { replace: true })
    }
  }, [sessionExpired, clearAuth, navigate, user])

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    setSubmitting(true)
    setError('')

    try {
      clearStoredSession()
      clearAuth()

      const loginUrl = `${window.location.origin}/api/auth/login`
      const res = await api.post(loginUrl, {
        login: login.trim(),
        password,
      }, {
        baseURL: '',
        timeout: 60_000,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })

      const token = res.data.token

      if (!token) {
        throw new Error('Login response missing token')
      }

      localStorage.setItem('token', token)
      applyToken(token)

      let profile = profileFromAuthResponse(res.data as Record<string, unknown>)

      if (profileHasPlatformSuperAdminRole(profile)) {
        profile = {
          ...profile,
          roleType: 'platform_super_admin',
          contextType: 'platform',
          actingAsSuperAdmin: false,
          activeInstitution: null,
          activeInstitutionId: null,
          institution: null,
          enabledModules: [],
        }
      }

      if (!profile.user) {
        profile = await fetchAuthProfile()
      }
      if (profileHasPlatformSuperAdminRole(profile)) {
        profile = {
          ...profile,
          roleType: 'platform_super_admin',
          contextType: 'platform',
          actingAsSuperAdmin: false,
          activeInstitution: null,
          activeInstitutionId: null,
          institution: null,
          enabledModules: [],
        }
      }
      persistProfile(profile)

      bumpAuthEpoch()
      setAuth(profile)

      const redirect = searchParams.get('redirect')
      const defaultHome = homePathForProfile(profile)
      const safeRedirect =
        redirect
        && redirect.startsWith('/')
        && !redirect.startsWith('//')
        && !(profileHasPlatformSuperAdminRole(profile) && !redirect.startsWith('/super-admin'))
          ? redirect
          : defaultHome

      navigate(safeRedirect)
    } catch (err: unknown) {
      setError(formatApiError(err, 'Login failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#16375f] px-4 py-10">
      <div className="w-full max-w-[420px] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/25">
        <div className="px-8 pb-5 pt-8 text-center">
          <OkusomaSpinLogo />
          <h1 className="mt-5 text-2xl font-extrabold tracking-wide text-[#1e3a5f]">
            OKUSOMA
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to the dashboard</p>
        </div>

        <div className="mx-8 border-t border-[#1e3a5f]/20" />

        <form onSubmit={submit} className="px-8 pb-6 pt-6">
          {signupSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Account created successfully. Sign in with your username or phone and password.
            </div>
          )}

          {sessionExpired && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your session has expired. Please sign in again.
            </div>
          )}

          {searchParams.get('reset') === 'success' && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Password updated successfully. Sign in with your new password.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <label className="mb-3 flex items-center gap-3 rounded-2xl bg-[#f3efe6] px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#1e3a5f]/30">
            <User className="h-5 w-5 shrink-0 text-[#1e3a5f]" aria-hidden="true" />
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Username"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              required
              autoComplete="username"
            />
          </label>

          <label className="mb-5 flex items-center gap-3 rounded-2xl bg-[#f3efe6] px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#1e3a5f]/30">
            <Lock className="h-5 w-5 shrink-0 text-[#1e3a5f]" aria-hidden="true" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="shrink-0 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1e3a5f] py-3.5 text-sm font-bold text-white transition hover:bg-[#162d4a] disabled:opacity-60"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15">
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="mt-5 text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e3a5f] hover:underline"
            >
              Forgot password? Reset via WhatsApp
              <MessageCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-3 text-center text-sm text-slate-500">
            New student?{' '}
            <Link to="/signup" className="font-semibold text-[#1e3a5f] hover:underline">
              Create an account
            </Link>
          </p>

          <div className="mt-5 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e3a5f] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Homepage
            </Link>
          </div>
        </form>
      </div>

      <p className="mt-8 max-w-[420px] text-center text-[11px] leading-relaxed text-blue-100/90">
        <span className="font-semibold text-white">{appVersionLabel()}</span>
        <br />
        {appDevelopedByLabel()}
        <br />
        {appCopyrightLabel()}
      </p>
    </div>
  )
}
