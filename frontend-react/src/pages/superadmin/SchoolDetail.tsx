import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Plus,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import DashboardStatCard from '../../components/ui/DashboardStatCard'
import {
  createSchoolAdmin,
  createSchoolStudent,
  fetchSchool,
  switchIntoInstitution,
  updateSchoolLicense,
  type SchoolDetail as SchoolDetailType,
} from '../../api/superadmin'
import { formatApiError } from '../../utils/apiError'
import { useAuth } from '../../context/AuthContext'
import { profileFromAuthResponse } from '../../utils/authSession'

const PLAN_OPTIONS = ['free', 'basic', 'standard', 'premium', 'enterprise']
const STATUS_OPTIONS = ['active', 'trial', 'suspended', 'expired']

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

export default function SchoolDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const schoolId = Number(id)
  const { setAuth, enterInstitutionContext } = useAuth()

  const [detail, setDetail] = useState<SchoolDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [license, setLicense] = useState({ subscription_plan: 'free', subscription_status: 'active', subscription_expires_at: '', max_users: '', is_active: true })
  const [savingLicense, setSavingLicense] = useState(false)
  const [licenseMsg, setLicenseMsg] = useState('')

  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', role: 'institution-admin' })
  const [creatingAdmin, setCreatingAdmin] = useState(false)
  const [adminMsg, setAdminMsg] = useState('')
  const [adminError, setAdminError] = useState('')

  const [studentForm, setStudentForm] = useState({ name: '', email: '', username: '', password: '' })
  const [creatingStudent, setCreatingStudent] = useState(false)
  const [studentMsg, setStudentMsg] = useState('')
  const [studentError, setStudentError] = useState('')
  const [switching, setSwitching] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchSchool(schoolId)
      setDetail(res.data)
      setLicense({
        subscription_plan: res.data.license.plan || 'free',
        subscription_status: res.data.license.status || 'active',
        subscription_expires_at: toDateInput(res.data.license.expires_at),
        max_users: res.data.license.max_users != null ? String(res.data.license.max_users) : '',
        is_active: res.data.institution.is_active,
      })
    } catch (err) {
      setError(formatApiError(err, 'Unable to load school.'))
    } finally {
      setLoading(false)
    }
  }, [schoolId])

  useEffect(() => {
    load()
  }, [load])

  async function saveLicense() {
    setSavingLicense(true)
    setLicenseMsg('')
    try {
      await updateSchoolLicense(schoolId, {
        subscription_plan: license.subscription_plan,
        subscription_status: license.subscription_status,
        subscription_expires_at: license.subscription_expires_at || null,
        max_users: license.max_users === '' ? null : Number(license.max_users),
        is_active: license.is_active,
      })
      setLicenseMsg('License updated.')
      await load()
    } catch (err) {
      setLicenseMsg(formatApiError(err, 'Could not update license.'))
    } finally {
      setSavingLicense(false)
    }
  }

  async function createAdmin() {
    setCreatingAdmin(true)
    setAdminMsg('')
    setAdminError('')
    try {
      await createSchoolAdmin(schoolId, adminForm)
      setAdminMsg(`Administrator ${adminForm.name} created.`)
      setAdminForm({ name: '', email: '', password: '', role: 'institution-admin' })
      await load()
    } catch (err) {
      setAdminError(formatApiError(err, 'Could not create administrator.'))
    } finally {
      setCreatingAdmin(false)
    }
  }

  async function createStudent() {
    setCreatingStudent(true)
    setStudentMsg('')
    setStudentError('')
    try {
      await createSchoolStudent(schoolId, studentForm)
      setStudentMsg(`Student ${studentForm.name} created. They can sign in with username "${studentForm.username}".`)
      setStudentForm({ name: '', email: '', username: '', password: '' })
      await load()
    } catch (err) {
      setStudentError(formatApiError(err, 'Could not create student.'))
    } finally {
      setCreatingStudent(false)
    }
  }

  async function switchIntoSchool() {
    if (!detail) return
    setSwitching(true)
    setError('')
    try {
      const res = await switchIntoInstitution(detail.institution.id)
      const profile = profileFromAuthResponse(res.data as Record<string, unknown>)
      enterInstitutionContext({
        id: detail.institution.id,
        name: detail.institution.name,
        code: detail.institution.code,
        logo_url: detail.institution.logo_url,
        is_active: detail.institution.is_active,
        subscription_status: detail.license.status,
        subscription_expires_at: detail.license.expires_at,
      }, profile.enabledModules)
      setAuth(profile)
      navigate('/dashboard')
    } catch (err) {
      setError(formatApiError(err, 'Unable to switch into this institution.'))
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading school…
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="space-y-4 p-6">
        <button onClick={() => navigate('/super-admin/dashboard')} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#1e3a5f]">
          <ArrowLeft className="h-4 w-4" /> Back to platform
        </button>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || 'School not found.'}</div>
      </div>
    )
  }

  const { institution, stats, license: lic } = detail

  const statCards = [
    { key: 'users', label: 'Total users', value: stats.total_users, icon: Users },
    { key: 'students', label: 'Students', value: stats.students, icon: GraduationCap },
    { key: 'teachers', label: 'Teachers', value: stats.teachers, icon: Users },
    { key: 'staff', label: 'Staff', value: stats.staff, icon: Users },
    { key: 'admins', label: 'Administrators', value: stats.admins, icon: ShieldCheck },
    { key: 'modules', label: 'Modules enabled', value: stats.modules_enabled, icon: BookOpen },
  ]

  return (
    <div className="space-y-6 p-6">
      <button onClick={() => navigate('/super-admin/dashboard')} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#1e3a5f]">
        <ArrowLeft className="h-4 w-4" /> Back to platform
      </button>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm text-blue-100">
              <Building2 className="h-4 w-4" /> Managing school
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{institution.name}</h1>
            <p className="mt-1 text-sm text-blue-100">
              {institution.code} · {institution.type}
              {institution.city ? ` · ${institution.city}` : ''}
              {institution.country ? `, ${institution.country}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-2.5 py-1 capitalize">Plan: {lic.plan}</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 capitalize">Status: {lic.status}</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1">Expiry: {formatDate(lic.expires_at)}</span>
              <span className={`rounded-full px-2.5 py-1 ${institution.is_active ? 'bg-emerald-400/20 text-emerald-100' : 'bg-rose-400/20 text-rose-100'}`}>
                {institution.is_active ? 'Active' : 'Deactivated'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={switchIntoSchool}
              disabled={switching}
              className="inline-flex items-center gap-2 rounded-xl bg-[#eab308] px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#d4a107] disabled:opacity-60"
            >
              {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Switch Institution
            </button>
            <button
              type="button"
              onClick={() => navigate(`/users?institution_id=${institution.id}`)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              <Users className="h-4 w-4" /> Open school users
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <DashboardStatCard key={card.key} label={card.label} value={card.value} icon={card.icon} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">License &amp; plan</h2>
          <p className="mt-1 text-sm text-slate-500">Adjust the subscription plan, status, expiry, and seat limit.</p>
          {licenseMsg && <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{licenseMsg}</div>}
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Plan</label>
                <select className={fieldClass()} value={license.subscription_plan} onChange={(e) => setLicense((p) => ({ ...p, subscription_plan: e.target.value }))}>
                  {PLAN_OPTIONS.map((plan) => (
                    <option key={plan} value={plan} className="capitalize">
                      {plan}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <select className={fieldClass()} value={license.subscription_status} onChange={(e) => setLicense((p) => ({ ...p, subscription_status: e.target.value }))}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} className="capitalize">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Expiry date</label>
                <input type="date" className={fieldClass()} value={license.subscription_expires_at} onChange={(e) => setLicense((p) => ({ ...p, subscription_expires_at: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Max users</label>
                <input type="number" min={0} placeholder="Unlimited" className={fieldClass()} value={license.max_users} onChange={(e) => setLicense((p) => ({ ...p, max_users: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={license.is_active} onChange={(e) => setLicense((p) => ({ ...p, is_active: e.target.checked }))} />
              School is active
            </label>
            <button
              type="button"
              onClick={saveLicense}
              disabled={savingLicense}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d4a73] disabled:opacity-60"
            >
              {savingLicense && <Loader2 className="h-4 w-4 animate-spin" />} Save license
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Administrators</h2>
          <p className="mt-1 text-sm text-slate-500">Accounts that can manage this school.</p>

          <ul className="mt-4 divide-y divide-slate-100">
            {detail.admins.length === 0 && <li className="py-3 text-sm text-slate-500">No administrators yet.</li>}
            {detail.admins.map((admin) => (
              <li key={admin.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-slate-900">{admin.name}</div>
                  <div className="text-xs text-slate-500">{admin.email}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {admin.roles.map((role) => (
                    <span key={role} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {role}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <UserPlus className="h-4 w-4" /> Create administrator
            </h3>
            {adminError && <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{adminError}</div>}
            {adminMsg && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> {adminMsg}
              </div>
            )}
            <div className="mt-3 space-y-3">
              <input className={fieldClass()} placeholder="Full name" value={adminForm.name} onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))} />
              <input className={fieldClass()} type="email" placeholder="Email" value={adminForm.email} onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))} />
              <input className={fieldClass()} type="text" placeholder="Password (min 8 chars)" value={adminForm.password} onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))} />
              <select className={fieldClass()} value={adminForm.role} onChange={(e) => setAdminForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="institution-admin">Institution Admin</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="button"
                onClick={createAdmin}
                disabled={creatingAdmin || !adminForm.name || !adminForm.email || adminForm.password.length < 8}
                className="inline-flex items-center gap-2 rounded-xl bg-[#eab308] px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#d4a107] disabled:opacity-60"
              >
                {creatingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <GraduationCap className="h-4 w-4 text-[#1e3a5f]" /> Create student for this school
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          The student is assigned to {institution.name} and can sign in with the username and password you set.
        </p>
        {studentMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {studentMsg}
          </div>
        )}
        {studentError && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{studentError}</div>}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className={fieldClass()} type="text" placeholder="Full name" value={studentForm.name} onChange={(e) => setStudentForm((p) => ({ ...p, name: e.target.value }))} />
          <input className={fieldClass()} type="email" placeholder="Email" value={studentForm.email} onChange={(e) => setStudentForm((p) => ({ ...p, email: e.target.value }))} />
          <input className={fieldClass()} type="text" placeholder="Username (for login)" value={studentForm.username} onChange={(e) => setStudentForm((p) => ({ ...p, username: e.target.value }))} />
          <input className={fieldClass()} type="text" placeholder="Password (min 8 chars)" value={studentForm.password} onChange={(e) => setStudentForm((p) => ({ ...p, password: e.target.value }))} />
          <button
            type="button"
            onClick={createStudent}
            disabled={creatingStudent || !studentForm.name || !studentForm.email || !studentForm.username || studentForm.password.length < 8}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d4a73] disabled:opacity-60 md:col-span-2 md:w-fit"
          >
            {creatingStudent ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Create student
          </button>
        </div>
      </div>
    </div>
  )
}
