import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { appCompactCreditLine } from '../config/appMeta'
import { formatApiError } from '../utils/apiError'

type SetupInfo = {
  institution_name: string
  contact_person: string
  email: string
  phone: string
}

export default function SetupInstitutionAdminPage() {
  const { token = '' } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [info, setInfo] = useState<SetupInfo | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/public/institution-admin-setup/${encodeURIComponent(token)}`, {
          baseURL: `${window.location.origin}/api`,
        })
        if (cancelled) return
        const data = res.data as SetupInfo
        setInfo(data)
        setName(data.contact_person || '')
        setEmail(data.email || '')
        const baseUser = (data.email || data.contact_person || 'admin')
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9._-]/g, '')
          .slice(0, 24)
        setUsername(baseUser || 'admin')
      } catch (err) {
        if (!cancelled) setError(formatApiError(err, 'This setup link is invalid or has expired.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (token) load()
    return () => { cancelled = true }
  }, [token])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post(`/public/institution-admin-setup/${encodeURIComponent(token)}`, {
        name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        password,
        password_confirmation: passwordConfirmation,
      }, {
        baseURL: `${window.location.origin}/api`,
      })
      setDone(true)
      setTimeout(() => navigate('/admin'), 2500)
    } catch (err) {
      setError(formatApiError(err, 'Could not create administrator account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#16375f] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <h1 className="text-center text-xl font-extrabold text-[#1e3a5f]">Set up Admin account</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          {info ? info.institution_name : 'Institution administrator'}
        </p>

        {loading && <p className="mt-6 text-center text-sm text-slate-500">Loading…</p>}

        {!loading && error && !info && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {done && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Administrator created. Redirecting to sign in…
          </div>
        )}

        {!loading && info && !done && (
          <form onSubmit={submit} className="mt-6 space-y-3">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
            <input
              className="w-full rounded-xl border border-slate-200 bg-[#f3efe6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-[#f3efe6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-[#f3efe6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-[#f3efe6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              required
              minLength={8}
            />
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-[#f3efe6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Confirm password"
              required
              minLength={8}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#1e3a5f] py-3 text-sm font-bold text-white hover:bg-[#162d4a] disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create Admin account'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/admin" className="font-medium text-[#1e3a5f] hover:underline">Back to sign in</Link>
        </p>
      </div>
      <p className="mt-6 max-w-md px-2 text-center text-[11px] text-blue-100/90">{appCompactCreditLine()}</p>
    </div>
  )
}
