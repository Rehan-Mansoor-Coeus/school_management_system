import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  Search,
  Settings2,
  Users,
  XCircle,
} from 'lucide-react'
import DashboardStatCard from '../../components/ui/DashboardStatCard'
import {
  createSchool,
  fetchPlatformOverview,
  fetchSchools,
  switchIntoInstitution,
  updateSchoolLicense,
  type PlatformOverview,
  type SchoolSummary,
} from '../../api/superadmin'
import { formatApiError } from '../../utils/apiError'
import { useAuth } from '../../context/AuthContext'
import { profileFromAuthResponse } from '../../utils/authSession'

const PLAN_OPTIONS = ['free', 'basic', 'standard', 'premium', 'enterprise']
const STATUS_OPTIONS = ['active', 'trial', 'suspended', 'expired']

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
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

function ExpiryCell({ school }: { school: SchoolSummary }) {
  const { expires_at, days_remaining, is_expired } = school.license
  if (!expires_at) return <span className="text-slate-400">No expiry</span>
  if (is_expired) {
    return <span className="text-rose-600">Expired {formatDate(expires_at)}</span>
  }
  const soon = days_remaining != null && days_remaining <= 30
  return (
    <span className={soon ? 'text-amber-600' : 'text-slate-600'}>
      {formatDate(expires_at)}
      {days_remaining != null && <span className="ml-1 text-xs text-slate-400">({days_remaining}d)</span>}
    </span>
  )
}

type LicenseForm = {
  subscription_plan: string
  subscription_status: string
  subscription_expires_at: string
  max_users: string
  is_active: boolean
}

function toDateInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [overview, setOverview] = useState<PlatformOverview | null>(null)
  const [switchingId, setSwitchingId] = useState<number | null>(null)
  const [schools, setSchools] = useState<SchoolSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [licenseTarget, setLicenseTarget] = useState<SchoolSummary | null>(null)
  const [licenseForm, setLicenseForm] = useState<LicenseForm | null>(null)
  const [savingLicense, setSavingLicense] = useState(false)
  const [licenseError, setLicenseError] = useState('')

  const [showCreate, setShowCreate] = useState(false)

  const switchIntoSchool = async (school: SchoolSummary) => {
    setSwitchingId(school.id)
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
      // One atomic auth update so ProtectedRoute/dashboard never see a half-switched student state.
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

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewRes, schoolsRes] = await Promise.all([
        fetchPlatformOverview(),
        fetchSchools(search ? { search } : undefined),
      ])
      setOverview(overviewRes.data)
      setSchools(schoolsRes.data.data)
    } catch (err) {
      setError(formatApiError(err, 'Unable to load platform data.'))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const handle = setTimeout(load, 250)
    return () => clearTimeout(handle)
  }, [load])

  function openLicense(school: SchoolSummary) {
    setLicenseTarget(school)
    setLicenseError('')
    setLicenseForm({
      subscription_plan: school.license.plan || 'free',
      subscription_status: school.license.status || 'active',
      subscription_expires_at: toDateInput(school.license.expires_at),
      max_users: school.license.max_users != null ? String(school.license.max_users) : '',
      is_active: school.is_active,
    })
  }

  async function saveLicense() {
    if (!licenseTarget || !licenseForm) return
    setSavingLicense(true)
    setLicenseError('')
    try {
      await updateSchoolLicense(licenseTarget.id, {
        subscription_plan: licenseForm.subscription_plan,
        subscription_status: licenseForm.subscription_status,
        subscription_expires_at: licenseForm.subscription_expires_at || null,
        max_users: licenseForm.max_users === '' ? null : Number(licenseForm.max_users),
        is_active: licenseForm.is_active,
      })
      setLicenseTarget(null)
      setLicenseForm(null)
      await load()
    } catch (err) {
      setLicenseError(formatApiError(err, 'Could not update license.'))
    } finally {
      setSavingLicense(false)
    }
  }

  const kpis = useMemo(() => {
    if (!overview) return []
    return [
      { key: 'schools', label: 'Total schools', value: overview.total_schools, icon: Building2, hint: 'Across the platform' },
      { key: 'active', label: 'Active schools', value: overview.active_schools, icon: CheckCircle2, hint: 'Currently enabled' },
      { key: 'expiring', label: 'Expiring in 30 days', value: overview.expiring_soon, icon: AlertTriangle, hint: 'Renew soon' },
      { key: 'expired', label: 'Expired licenses', value: overview.expired_licenses, icon: XCircle, hint: 'Need attention' },
      { key: 'users', label: 'Total users', value: overview.total_users, icon: Users, hint: 'All accounts' },
      { key: 'students', label: 'Total students', value: overview.total_students, icon: Users, hint: 'Enrolled learners' },
    ]
  }, [overview])

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-blue-100">Platform administration</p>
            <h1 className="mt-1 text-2xl font-semibold">Super Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Manage every school on the platform — licenses, plans, expiry dates, and administrators. Open a school to
              switch into its workspace and create its admins.
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

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <DashboardStatCard key={kpi.key} label={kpi.label} value={kpi.value} icon={kpi.icon} hint={kpi.hint} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div>
            <h2 className="font-semibold text-slate-900">Schools</h2>
            <p className="text-sm text-slate-500">All institutions registered on the platform.</p>
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
            <Loader2 className="h-4 w-4 animate-spin" /> Loading schools…
          </div>
        ) : schools.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No schools found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">License expiry</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{school.name}</div>
                      <div className="text-xs text-slate-500">
                        {school.code} · {school.city || school.country || school.type}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-700">
                        {school.license.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={school.license.status} isActive={school.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryCell school={school} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {school.stats.total_users}
                      {school.license.max_users != null && (
                        <span className="text-xs text-slate-400"> / {school.license.max_users}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openLicense(school)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> License
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
                        >
                          <Settings2 className="h-3.5 w-3.5" /> Details
                        </button>
                        <button
                          type="button"
                          disabled={switchingId === school.id}
                          onClick={() => switchIntoSchool(school)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#1e3a5f] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2d4a73] disabled:opacity-60"
                        >
                          {switchingId === school.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Building2 className="h-3.5 w-3.5" />}
                          Switch Institution
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

      {licenseTarget && licenseForm && (
        <LicenseModal
          school={licenseTarget}
          form={licenseForm}
          setForm={setLicenseForm}
          onClose={() => {
            setLicenseTarget(null)
            setLicenseForm(null)
          }}
          onSave={saveLicense}
          saving={savingLicense}
          error={licenseError}
        />
      )}

      {showCreate && (
        <CreateSchoolModal
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false)
            await load()
          }}
        />
      )}
    </div>
  )
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function fieldClass() {
  return 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'
}

function LicenseModal({
  school,
  form,
  setForm,
  onClose,
  onSave,
  saving,
  error,
}: {
  school: SchoolSummary
  form: LicenseForm
  setForm: (updater: (prev: LicenseForm | null) => LicenseForm | null) => void
  onClose: () => void
  onSave: () => void
  saving: boolean
  error: string
}) {
  const update = (patch: Partial<LicenseForm>) => setForm((prev) => (prev ? { ...prev, ...patch } : prev))
  return (
    <ModalShell title={`License · ${school.name}`} onClose={onClose}>
      {error && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Plan</label>
          <select className={fieldClass()} value={form.subscription_plan} onChange={(e) => update({ subscription_plan: e.target.value })}>
            {PLAN_OPTIONS.map((plan) => (
              <option key={plan} value={plan} className="capitalize">
                {plan}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select className={fieldClass()} value={form.subscription_status} onChange={(e) => update({ subscription_status: e.target.value })}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">License expiry</label>
          <input type="date" className={fieldClass()} value={form.subscription_expires_at} onChange={(e) => update({ subscription_expires_at: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Max users (seat limit)</label>
          <input
            type="number"
            min={0}
            placeholder="Unlimited"
            className={fieldClass()}
            value={form.max_users}
            onChange={(e) => update({ max_users: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.is_active} onChange={(e) => update({ is_active: e.target.checked })} />
          School is active (users can sign in)
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d4a73] disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save license
        </button>
      </div>
    </ModalShell>
  )
}

function CreateSchoolModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', code: '', type: 'school', country: '', city: '', subscription_plan: 'free' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }))

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await createSchool(form)
      onCreated()
    } catch (err) {
      setError(formatApiError(err, 'Could not create school.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Create new school" onClose={onClose}>
      {error && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">School name *</label>
          <input className={fieldClass()} value={form.name} onChange={(e) => update({ name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Code *</label>
            <input className={fieldClass()} value={form.code} onChange={(e) => update({ code: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select className={fieldClass()} value={form.type} onChange={(e) => update({ type: e.target.value })}>
              {['university', 'college', 'school', 'vocational', 'technical', 'training'].map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Country</label>
            <input className={fieldClass()} value={form.country} onChange={(e) => update({ country: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
            <input className={fieldClass()} value={form.city} onChange={(e) => update({ city: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Plan</label>
          <select className={fieldClass()} value={form.subscription_plan} onChange={(e) => update({ subscription_plan: e.target.value })}>
            {PLAN_OPTIONS.map((plan) => (
              <option key={plan} value={plan} className="capitalize">
                {plan}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving || !form.name || !form.code}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d4a73] disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create school
        </button>
      </div>
    </ModalShell>
  )
}
