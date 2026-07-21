import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, Loader2, Plus, Search, Settings2, UserPlus } from 'lucide-react'
import {
  createSchool,
  createSchoolAdmin,
  fetchSchools,
  switchIntoInstitution,
  updateSchoolLicense,
  type SchoolSummary,
} from '../../api/superadmin'
import { fetchLicensePlans, type LicensePlan } from '../../api/licensing'
import { formatApiError } from '../../utils/apiError'
import { useAuth } from '../../context/AuthContext'
import { bumpAuthEpoch, profileFromAuthResponse } from '../../utils/authSession'

const STATUS_OPTIONS = ['active', 'trial', 'suspended', 'expired', 'pending_payment', 'grace_period', 'overdue']

function planCodeOf(school: SchoolSummary): string {
  const lic = school.license
  if (lic?.plan && typeof lic.plan === 'object') return lic.plan.code || 'free'
  return lic?.plan_code || (typeof lic?.plan === 'string' ? lic.plan : 'free')
}

function planNameOf(school: SchoolSummary): string {
  const lic = school.license
  if (lic?.plan && typeof lic.plan === 'object') return lic.plan.name || lic.plan.code || 'Free'
  return lic?.plan_name || planCodeOf(school)
}

function licenseStatusOf(school: SchoolSummary): string {
  return school.license?.license_status || school.license?.status || 'active'
}

function fieldClass() {
  return 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function toDateInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function StatusPill({ status, isActive }: { status: string; isActive: boolean }) {
  if (!isActive) {
    return <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">Deactivated</span>
  }
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    trial: 'bg-sky-100 text-sky-700',
    suspended: 'bg-amber-100 text-amber-700',
    expired: 'bg-rose-100 text-rose-700',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

export default function InstitutionsPage() {
  const navigate = useNavigate()
  const { setAuth, isPlatformContext, isPlatformSuperAdmin } = useAuth()
  const [schools, setSchools] = useState<SchoolSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [switchingId, setSwitchingId] = useState<number | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    type: 'university',
    email: '',
    phone: '',
    country: '',
    city: '',
  })

  const [plans, setPlans] = useState<LicensePlan[]>([])
  const [licenseTarget, setLicenseTarget] = useState<SchoolSummary | null>(null)
  const [licenseForm, setLicenseForm] = useState({
    license_plan_id: '' as string | number,
    subscription_plan: 'free',
    subscription_status: 'active',
    subscription_expires_at: '',
    max_users: '',
    is_active: true,
  })
  const [savingLicense, setSavingLicense] = useState(false)
  const [licenseError, setLicenseError] = useState('')

  const [adminTarget, setAdminTarget] = useState<SchoolSummary | null>(null)
  const [adminForm, setAdminForm] = useState({ name: '', email: '', username: '', password: '', role: 'institution-admin' })
  const [creatingAdmin, setCreatingAdmin] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminMsg, setAdminMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [schoolsRes, plansRes] = await Promise.all([
        fetchSchools(),
        fetchLicensePlans({ active_only: true }),
      ])
      setSchools(schoolsRes.data.data || [])
      setPlans(plansRes.data.data || [])
    } catch (err) {
      setError(formatApiError(err, 'Unable to load institutions.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return schools
    return schools.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
  }, [schools, search])

  async function createInstitution() {
    setCreating(true)
    setCreateError('')
    try {
      await createSchool(createForm)
      setShowCreate(false)
      setCreateForm({ name: '', code: '', type: 'university', email: '', phone: '', country: '', city: '' })
      await load()
    } catch (err) {
      setCreateError(formatApiError(err, 'Could not create institution.'))
    } finally {
      setCreating(false)
    }
  }

  function openLicense(school: SchoolSummary) {
    setLicenseTarget(school)
    setLicenseError('')
    const code = planCodeOf(school)
    const matched = plans.find((p) => p.code === code)
    setLicenseForm({
      license_plan_id: matched?.id || '',
      subscription_plan: code,
      subscription_status: licenseStatusOf(school),
      subscription_expires_at: toDateInput(school.license.expiry_date || school.license.expires_at),
      max_users: school.license.max_users != null ? String(school.license.max_users) : '',
      is_active: school.is_active,
    })
  }

  async function saveLicense() {
    if (!licenseTarget) return
    setSavingLicense(true)
    setLicenseError('')
    try {
      const selected = plans.find((p) => String(p.id) === String(licenseForm.license_plan_id))
      await updateSchoolLicense(licenseTarget.id, {
        license_plan_id: licenseForm.license_plan_id || undefined,
        subscription_plan: selected?.code || licenseForm.subscription_plan,
        subscription_status: licenseForm.subscription_status,
        subscription_expires_at: licenseForm.subscription_expires_at || null,
        max_users: licenseForm.max_users === '' ? null : Number(licenseForm.max_users),
        is_active: licenseForm.is_active,
      })
      setLicenseTarget(null)
      await load()
    } catch (err) {
      setLicenseError(formatApiError(err, 'Could not update license.'))
    } finally {
      setSavingLicense(false)
    }
  }

  function openCreateAdmin(school: SchoolSummary) {
    setAdminTarget(school)
    setAdminError('')
    setAdminMsg('')
    setAdminForm({ name: '', email: '', username: '', password: '', role: 'institution-admin' })
  }

  async function createAdmin() {
    if (!adminTarget) return
    setCreatingAdmin(true)
    setAdminError('')
    setAdminMsg('')
    try {
      await createSchoolAdmin(adminTarget.id, adminForm)
      setAdminMsg(`Administrator created for ${adminTarget.name}.`)
      setAdminForm({ name: '', email: '', username: '', password: '', role: 'institution-admin' })
      await load()
    } catch (err) {
      setAdminError(formatApiError(err, 'Could not create administrator.'))
    } finally {
      setCreatingAdmin(false)
    }
  }

  async function switchIntoSchool(school: SchoolSummary) {
    if (!school.is_active) {
      setError('This institution is inactive. Activate it before switching.')
      return
    }
    setSwitchingId(school.id)
    setError('')
    try {
      const res = await switchIntoInstitution(school.id)
      const profile = profileFromAuthResponse(res.data as Record<string, unknown>)
      const institution = {
        id: school.id,
        name: school.name,
        code: school.code,
        logo_url: school.logo_url,
        is_active: school.is_active,
        subscription_status: school.license.status,
        subscription_expires_at: school.license.expires_at,
      }
      bumpAuthEpoch()
      setAuth({
        ...profile,
        contextType: 'institution',
        actingAsSuperAdmin: true,
        activeInstitution: profile.activeInstitution || institution,
        activeInstitutionId: school.id,
        institution: profile.institution || institution,
        roleType: profile.roleType || 'platform_super_admin',
      })
      navigate('/dashboard')
    } catch (err) {
      setError(formatApiError(err, 'Unable to switch into this institution.'))
    } finally {
      setSwitchingId(null)
    }
  }


  if (!(isPlatformSuperAdmin && isPlatformContext)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-blue-100">Platform administration</p>
            <h1 className="mt-1 text-2xl font-semibold">Institutions</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              View every school, manage licenses, create institution admins, or switch into a school workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#eab308] px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#d4a107]"
          >
            <Plus className="h-4 w-4" /> New School
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div>
            <h2 className="font-semibold text-slate-900">All institutions</h2>
            <p className="text-sm text-slate-500">Click a school name for full details.</p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code"
              className="w-64 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading institutions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No institutions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Courses</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => navigate(`/super-admin/institutions/${school.id}`)} className="text-left">
                        <div className="font-medium text-[#1e3a5f] hover:underline">{school.name}</div>
                        <div className="text-xs text-slate-500">
                          {school.code} · {school.city || school.country || school.type}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-700">
                        {planNameOf(school)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={licenseStatusOf(school)} isActive={school.is_active} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{school.stats.total_users}</td>
                    <td className="px-4 py-3 text-slate-700">{school.stats.courses ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => openLicense(school)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          License
                        </button>
                        <button type="button" onClick={() => navigate(`/super-admin/institutions/${school.id}`)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          <Settings2 className="h-3.5 w-3.5" /> Details
                        </button>
                        <button type="button" onClick={() => openCreateAdmin(school)} className="inline-flex items-center gap-1 rounded-lg border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 px-2.5 py-1.5 text-xs font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10">
                          <UserPlus className="h-3.5 w-3.5" /> Create Admin
                        </button>
                        <button
                          type="button"
                          disabled={switchingId === school.id}
                          onClick={() => switchIntoSchool(school)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#1e3a5f] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2d4a73] disabled:opacity-60"
                        >
                          {switchingId === school.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                          Switch
                        </button>
                      </div>
                    </td>
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
            <h3 className="text-lg font-semibold text-slate-900">Create institution</h3>
            {createError && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{createError}</div>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className={fieldClass()} placeholder="Name *" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
              <input className={fieldClass()} placeholder="Code *" value={createForm.code} onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value }))} />
              <select className={fieldClass()} value={createForm.type} onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}>
                {['university', 'college', 'school', 'vocational', 'technical', 'training'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input className={fieldClass()} placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
              <input className={fieldClass()} placeholder="Phone" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} />
              <input className={fieldClass()} placeholder="City" value={createForm.city} onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))} />
              <input className={`sm:col-span-2 ${fieldClass()}`} placeholder="Country" value={createForm.country} onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" disabled={creating || !createForm.name || !createForm.code} onClick={createInstitution} className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {creating && <Loader2 className="h-4 w-4 animate-spin" />} Create
              </button>
            </div>
          </div>
        </div>
      )}

      {licenseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">License · {licenseTarget.name}</h3>
            {licenseError && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{licenseError}</div>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                className={fieldClass()}
                value={String(licenseForm.license_plan_id || '')}
                onChange={(e) => {
                  const plan = plans.find((p) => String(p.id) === e.target.value)
                  setLicenseForm((p) => ({
                    ...p,
                    license_plan_id: e.target.value,
                    subscription_plan: plan?.code || p.subscription_plan,
                  }))
                }}
              >
                <option value="">Select plan…</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              <select className={fieldClass()} value={licenseForm.subscription_status} onChange={(e) => setLicenseForm((p) => ({ ...p, subscription_status: e.target.value }))}>
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <input type="date" className={fieldClass()} value={licenseForm.subscription_expires_at} onChange={(e) => setLicenseForm((p) => ({ ...p, subscription_expires_at: e.target.value }))} />
              <input type="number" min={0} placeholder="Max users" className={fieldClass()} value={licenseForm.max_users} onChange={(e) => setLicenseForm((p) => ({ ...p, max_users: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={licenseForm.is_active} onChange={(e) => setLicenseForm((p) => ({ ...p, is_active: e.target.checked }))} />
                School is active
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setLicenseTarget(null)} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" disabled={savingLicense} onClick={saveLicense} className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {savingLicense && <Loader2 className="h-4 w-4 animate-spin" />} Save license
              </button>
            </div>
          </div>
        </div>
      )}

      {adminTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Create admin · {adminTarget.name}</h3>
            <p className="mt-1 text-sm text-slate-500">This administrator will be linked to this institution only.</p>
            {adminMsg && <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{adminMsg}</div>}
            {adminError && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{adminError}</div>}
            <div className="mt-4 grid gap-3">
              <input className={fieldClass()} placeholder="Full name *" value={adminForm.name} onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))} />
              <input className={fieldClass()} type="email" placeholder="Email *" value={adminForm.email} onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))} />
              <input className={fieldClass()} placeholder="Username *" value={adminForm.username} onChange={(e) => setAdminForm((p) => ({ ...p, username: e.target.value }))} />
              <input className={fieldClass()} type="text" placeholder="Password (min 8) *" value={adminForm.password} onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))} />
              <select className={fieldClass()} value={adminForm.role} onChange={(e) => setAdminForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="institution-admin">Institution Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setAdminTarget(null)} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Close</button>
              <button
                type="button"
                disabled={creatingAdmin || !adminForm.name || !adminForm.email || !adminForm.username || adminForm.password.length < 8}
                onClick={createAdmin}
                className="inline-flex items-center gap-2 rounded-xl bg-[#eab308] px-4 py-2 text-sm font-semibold text-[#1e3a5f] disabled:opacity-60"
              >
                {creatingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Create admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
