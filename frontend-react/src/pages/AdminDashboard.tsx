import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CreditCard,
  GraduationCap,
  Loader2,
  Puzzle,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'
import DashboardStatCard from '../components/ui/DashboardStatCard'
import { fetchInstitutionDashboard, type InstitutionDashboard } from '../api/superadmin'
import { useAuth } from '../context/AuthContext'
import { formatApiError } from '../utils/apiError'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminDashboard() {
  const { user, canAccess } = useAuth()
  const [data, setData] = useState<InstitutionDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchInstitutionDashboard()
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .catch((err) => {
        if (!cancelled) setError(formatApiError(err, 'Unable to load your school dashboard.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your school dashboard…
      </div>
    )
  }

  if (error || !data) {
    return <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || 'No data.'}</div>
  }

  const { institution, license, stats } = data
  const expiringSoon = license.days_remaining != null && license.days_remaining <= 30 && !license.is_expired

  const statCards = [
    { key: 'users', label: 'Total users', value: stats.total_users, icon: Users, to: '/users' },
    { key: 'students', label: 'Students', value: stats.students, icon: GraduationCap, to: '/users/students' },
    { key: 'teachers', label: 'Teachers', value: stats.teachers, icon: Users, to: '/users/teachers' },
    { key: 'staff', label: 'Staff', value: stats.staff, icon: Users, to: '/users/staff' },
    { key: 'admins', label: 'Administrators', value: stats.admins, icon: ShieldCheck, to: '/users' },
    { key: 'modules', label: 'Modules enabled', value: stats.modules_enabled, icon: BookOpen, to: '/modules' },
  ]

  const quickLinks = [
    canAccess({ permissions: ['users.view', 'view_users', 'manage_users'] }) && { label: 'Users', to: '/users', description: 'Manage accounts, students, and staff', icon: Users },
    canAccess({ permissions: ['roles.view', 'view_roles', 'manage_roles'] }) && { label: 'Roles & Permissions', to: '/roles-permissions', description: 'Control access for your school', icon: UserCog },
    canAccess({ permissions: ['modules.view', 'modules.manage', 'manage_modules'] }) && { label: 'Modules', to: '/modules', description: 'Enable features for your school', icon: Puzzle },
    canAccess({ permissions: ['institutions.view', 'institutions.edit'] }) && { label: 'School profile', to: '/institutions', description: 'Branding and institution settings', icon: Building2 },
  ].filter(Boolean) as Array<{ label: string; to: string; description: string; icon: typeof Users }>

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-blue-100">Welcome back{user?.name ? `, ${user.name}` : ''}</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
              <Building2 className="h-6 w-6" /> {institution.name}
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              {institution.code} · {institution.type}
              {institution.city ? ` · ${institution.city}` : ''}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-blue-100">
              <CreditCard className="h-4 w-4" /> Subscription
            </div>
            <div className="mt-1 font-semibold capitalize">
              {license.plan} · {license.status}
            </div>
            <div className="text-xs text-blue-100">Expires {formatDate(license.expires_at)}</div>
          </div>
        </div>
      </div>

      {license.is_expired && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4" /> Your school's license expired on {formatDate(license.expires_at)}. Contact the platform administrator to renew.
        </div>
      )}
      {expiringSoon && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4" /> Your license expires in {license.days_remaining} day(s) on {formatDate(license.expires_at)}.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <DashboardStatCard key={card.key} label={card.label} value={card.value} icon={card.icon} to={card.to} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Quick access</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your school's people, roles, and modules.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <li key={link.to}>
                <Link to={link.to} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:border-[#1e3a5f]/30 hover:bg-slate-50">
                  <Icon className="mt-0.5 h-5 w-5 text-[#1e3a5f]" />
                  <span>
                    <span className="block font-medium text-slate-900">{link.label}</span>
                    <span className="block text-sm text-slate-500">{link.description}</span>
                  </span>
                </Link>
              </li>
            )
          })}
          {quickLinks.length === 0 && <li className="text-sm text-slate-500">Use the sidebar to open modules enabled for your account.</li>}
        </ul>
      </div>
    </div>
  )
}
