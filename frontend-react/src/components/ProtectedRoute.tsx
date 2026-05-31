import React from 'react'
import { Navigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const { setAuth } = useAuth()
  const checkedRef = useRef(false)

  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    const token = localStorage.getItem('token')
    if (!token) {
      setAuthed(false)
      setLoading(false)
      return
    }

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    api
      .get('/auth/user')
      .then((res) => {
        const user = res.data?.user ?? res.data
        const enabledModules = res.data?.enabled_modules ?? []
        const permissions = res.data?.permissions ?? []
        localStorage.setItem('me', JSON.stringify(user))
        localStorage.setItem('permissions', JSON.stringify(permissions))
        localStorage.setItem('enabled_modules', JSON.stringify(enabledModules))
        setAuth({ user, permissions, enabledModules })
        setAuthed(true)
        setSessionExpired(false)
        setRateLimited(false)
      })
      .catch((error) => {
        const status = error?.response?.status
        if (status === 429) {
          setRateLimited(true)
          setAuthed(false)
          return
        }
        if (status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('me')
          localStorage.removeItem('permissions')
          localStorage.removeItem('enabled_modules')
          delete api.defaults.headers.common['Authorization']
          setAuth({ user: null, permissions: [], enabledModules: [] })
          setSessionExpired(true)
        }
        setAuthed(false)
      })
      .finally(() => setLoading(false))
  }, [setAuth])

  if (loading) return <div className="p-6">Loading...</div>

  if (rateLimited) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-amber-900">Too many requests</h2>
          <p className="mt-2 text-sm text-amber-800">
            The server is temporarily rate-limiting requests. Wait a minute and refresh the page.
          </p>
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
    return <Navigate to={sessionExpired ? '/login?session=expired' : '/login'} replace />
  }

  return children
}
