import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  applyToken,
  clearStoredSession,
  fetchAuthProfile,
  readCachedProfile,
} from '../utils/authSession'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const { setAuth } = useAuth()

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const token = localStorage.getItem('token')
      if (!token) {
        if (!cancelled) {
          setAuthed(false)
          setLoading(false)
        }
        return
      }

      applyToken(token)
      const cached = readCachedProfile()

      // Show the app immediately when we have a cached profile; refresh in background.
      if (cached.user) {
        setAuth(cached)
        setAuthed(true)
        setLoading(false)
      }

      try {
        const profile = await fetchAuthProfile()
        if (cancelled) return
        setAuth(profile)
        setAuthed(true)
        setSessionExpired(false)
        setBootstrapError(null)
      } catch (error: any) {
        if (cancelled) return

        const status = error?.response?.status
        if (status === 401) {
          clearStoredSession()
          setAuth({ user: null, permissions: [], enabledModules: [], institution: null })
          setAuthed(false)
          setSessionExpired(true)
          return
        }

        if (status === 429) {
          if (!cached.user) {
            setBootstrapError('Too many requests. Wait a minute and try again.')
            setAuthed(false)
          }
          return
        }

        // Network/API misconfiguration: keep cached session if we have one.
        if (cached.user) {
          setAuthed(true)
          setBootstrapError('Could not refresh session. Showing cached data.')
          return
        }

        const message = error?.code === 'ECONNABORTED'
          ? 'API server timed out. Check that Laravel is running and VITE_API_BASE is correct.'
          : error?.code === 'INVALID_API_RESPONSE'
            ? 'API returned HTML instead of JSON. Ensure /api is proxied to Laravel (production nginx).'
            : error?.message === 'Network Error'
              ? 'Cannot reach API server. Is Laravel running?'
              : 'Unable to verify session.'

        setBootstrapError(message)
        setAuthed(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [setAuth])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-slate-600">
        Loading…
      </div>
    )
  }

  if (bootstrapError && !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-900">Connection problem</h2>
          <p className="mt-2 text-sm text-red-800">{bootstrapError}</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm text-white"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!authed) {
    return <Navigate to={sessionExpired ? '/admin?session=expired' : '/admin'} replace />
  }

  return children
}
