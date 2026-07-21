import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Building2,
  GraduationCap,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'

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
  readCachedProfile,
} from '../utils/authSession'
import { formatApiError } from '../utils/apiError'
import { FormField, formInputClass } from '../components/ui/FormField'

const systemFeatures = [
  {
    icon: GraduationCap,
    title: 'Admissions & enrollment',
    description:
      'Apply online, upload documents, pay fees, and track approval through registry, department, and finance.',
  },
  {
    icon: Users,
    title: 'Students & staff',
    description:
      'Manage users, roles, permissions, and institution-wide access from one secure platform.',
  },
  {
    icon: Wallet,
    title: 'Fees & finance',
    description:
      'Track registration fees, tuition, semester balances, and payment verification.',
  },
  {
    icon: BookOpen,
    title: 'Academics',
    description:
      'Programmes, subjects, semesters, and course registration with HOD approval.',
  },
  {
    icon: Building2,
    title: 'Institution operations',
    description:
      'Hostel, canteen, library, letters, timesheets, and other modules configured per institution.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure access',
    description:
      'Role-based dashboards, audit-ready workflows, and bilingual support (English / French).',
  },
]

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('session') === 'expired'
  const signupSuccess = searchParams.get('signup') === 'success'
  const { setAuth, clearAuth, user } = useAuth()

  useEffect(() => {
    // Stale profile keys after partial expiry break the next login (CORS / wrong portal).
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
      // Ensure no leftover institution context from a previous SA switch.
      clearStoredSession()
      clearAuth()

      const res = await api.post('/auth/login', {
        login: login.trim(),
        password,
      })

      const token = res.data.token

      if (!token) {
        throw new Error('Login response missing token')
      }

      localStorage.setItem('token', token)
      applyToken(token)

      let profile = profileFromAuthResponse(res.data as Record<string, unknown>)

      // Platform SA always starts with no institution selected.
      if (profile.roleType === 'platform_super_admin') {
        profile = {
          ...profile,
          contextType: 'platform',
          actingAsSuperAdmin: false,
          activeInstitution: null,
          activeInstitutionId: null,
          institution: null,
        }
      }

      if (!profile.user) {
        profile = await fetchAuthProfile()
      } else {
        persistProfile(profile)
      }

      bumpAuthEpoch()
      setAuth(profile)

      const redirect = searchParams.get('redirect')
      const defaultHome = homePathForProfile(profile)
      const safeRedirect =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//')
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
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73] p-10 text-white lg:flex">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-200">
              School Management System
            </p>

            <h1 className="mt-4 text-3xl font-bold leading-tight">
              One platform for admissions, academics, and campus operations
            </h1>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100">
              Sign in to manage applications, review documents, verify payments,
              register courses, and access modules enabled for your institution.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {systemFeatures.map((feature) => {
              const Icon = feature.icon

              return (
                <div key={feature.title} className="flex gap-3 rounded-2xl bg-white/10 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">{feature.title}</h2>
                    <p className="mt-1 text-sm text-blue-100">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-8 text-xs text-blue-200">
            Need help? Contact your institution administrator for account access.
          </p>
        </div>

        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#1e3a5f]">
                School Management System
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">Sign in to continue</h1>

              <p className="mt-2 text-sm text-slate-500">
                Admissions, fees, academics, hostel, canteen, library, and more — all in one place.
              </p>
            </div>

            <form
              onSubmit={submit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>

              <p className="mt-1 text-sm text-slate-500">
                Use your email, username, or phone number and password. Your portal opens from your account roles.
              </p>

              {signupSuccess && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Account created successfully. Sign in with your username or phone and password.
                </div>
              )}

              {sessionExpired && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Your session has expired. Please sign in again.
                </div>
              )}

              {searchParams.get('reset') === 'success' && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Password updated successfully. Sign in with your new password.
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="mt-5 space-y-4">
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
                  Forgot username or password?
                </Link>
              </div>

              <p className="mt-4 text-center text-sm text-slate-600">
                New student?{' '}
                <Link to="/signup" className="font-medium text-[#1e3a5f] hover:underline">
                  Create an account
                </Link>
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
              <span className="font-medium text-slate-600">{appVersionLabel()}</span>
              <br />
              {appDevelopedByLabel()}
              <br />
              {appCopyrightLabel()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
