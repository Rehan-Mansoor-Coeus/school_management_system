import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, Plus, Search, Shield, UserCog } from 'lucide-react'
import {
  createPlatformUser,
  fetchPlatformUsers,
  fetchSchools,
  type PlatformUser,
  type SchoolSummary,
} from '../../api/superadmin'
import { formatApiError } from '../../utils/apiError'
import { useAuth } from '../../context/AuthContext'

function fieldClass() {
  return 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'
}

type Tab = 'all' | 'super_admin' | 'institution_admin'

export default function PlatformUsersPage() {
  const { isPlatformContext, isPlatformSuperAdmin } = useAuth()
  const [tab, setTab] = useState<Tab>('all')
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [schools, setSchools] = useState<SchoolSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createMsg, setCreateMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    account_type: 'institution_admin' as 'super_admin' | 'institution_admin',
    institution_id: '',
    role: 'institution-admin',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        fetchPlatformUsers({ type: tab === 'all' ? 'all' : tab }),
        fetchSchools(),
      ])
      setUsers(usersRes.data.data || [])
      setSchools(schoolsRes.data.data || [])
    } catch (err) {
      setError(formatApiError(err, 'Unable to load users.'))
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      [u.name, u.email, u.username, u.institution?.name, u.institution?.code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [users, search])

  async function createUser() {
    setCreating(true)
    setCreateError('')
    setCreateMsg('')
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        username: form.username,
        password: form.password,
        account_type: form.account_type,
      }
      if (form.account_type === 'institution_admin') {
        payload.institution_id = Number(form.institution_id)
        payload.role = form.role
      }
      await createPlatformUser(payload)
      setCreateMsg(
        form.account_type === 'super_admin'
          ? 'Platform super admin created.'
          : 'Institution admin created and linked to the selected school.'
      )
      setForm({
        name: '',
        email: '',
        username: '',
        password: '',
        account_type: 'institution_admin',
        institution_id: '',
        role: 'institution-admin',
      })
      await load()
    } catch (err) {
      setCreateError(formatApiError(err, 'Could not create user.'))
    } finally {
      setCreating(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All admins' },
    { id: 'super_admin', label: 'Super Admins' },
    { id: 'institution_admin', label: 'Institution Admins' },
  ]


  if (!(isPlatformSuperAdmin && isPlatformContext)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-blue-100">Platform administration</p>
            <h1 className="mt-1 text-2xl font-semibold">Users</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Create platform Super Admins or institution Admins. Institution admins must be linked to a school.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCreate(true)
              setCreateError('')
              setCreateMsg('')
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#eab308] px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#d4a107]"
          >
            <Plus className="h-4 w-4" /> New user
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  tab === item.id ? 'bg-[#1e3a5f] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users"
              className="w-64 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}{user.username ? ` · ${user.username}` : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      {user.account_type === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          <Shield className="h-3 w-3" /> Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                          <UserCog className="h-3 w-3" /> Institution Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {user.institution ? `${user.institution.name} (${user.institution.code})` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.roles.join(', ')}</td>
                    <td className="px-4 py-3 capitalize text-slate-700">{user.status || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Create administrator</h3>
            {createMsg && <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{createMsg}</div>}
            {createError && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{createError}</div>}
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, account_type: 'super_admin', institution_id: '' }))}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    form.account_type === 'super_admin' ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, account_type: 'institution_admin' }))}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    form.account_type === 'institution_admin' ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Institution Admin
                </button>
              </div>
              <input className={fieldClass()} placeholder="Full name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <input className={fieldClass()} type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              <input className={fieldClass()} placeholder="Username *" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
              <input className={fieldClass()} type="text" placeholder="Password (min 8) *" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              {form.account_type === 'institution_admin' && (
                <>
                  <select
                    className={fieldClass()}
                    value={form.institution_id}
                    onChange={(e) => setForm((p) => ({ ...p, institution_id: e.target.value }))}
                  >
                    <option value="">Select institution *</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} ({school.code})
                      </option>
                    ))}
                  </select>
                  <select className={fieldClass()} value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                    <option value="institution-admin">Institution Admin</option>
                    <option value="admin">Admin</option>
                  </select>
                </>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Close
              </button>
              <button
                type="button"
                disabled={
                  creating
                  || !form.name
                  || !form.email
                  || !form.username
                  || form.password.length < 8
                  || (form.account_type === 'institution_admin' && !form.institution_id)
                }
                onClick={createUser}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />} Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
