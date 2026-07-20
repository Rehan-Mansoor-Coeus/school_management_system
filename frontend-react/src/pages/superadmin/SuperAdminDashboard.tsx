import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  Users,
  XCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import DashboardStatCard from '../../components/ui/DashboardStatCard'
import { fetchPlatformOverview, fetchSchools, type PlatformOverview, type SchoolSummary } from '../../api/superadmin'
import { formatApiError } from '../../utils/apiError'

const PLAN_COLORS = ['#1e3a5f', '#eab308', '#0ea5e9', '#10b981', '#f97316', '#8b5cf6']

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<PlatformOverview | null>(null)
  const [schools, setSchools] = useState<SchoolSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewRes, schoolsRes] = await Promise.all([fetchPlatformOverview(), fetchSchools()])
      setOverview(overviewRes.data)
      setSchools(schoolsRes.data.data || [])
    } catch (err) {
      setError(formatApiError(err, 'Unable to load platform overview.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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

  const planChartData = useMemo(() => {
    if (!overview?.plans) return []
    return Object.entries(overview.plans).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
  }, [overview])

  const schoolUsageData = useMemo(() => {
    return schools
      .slice()
      .sort((a, b) => (b.stats.total_users || 0) - (a.stats.total_users || 0))
      .slice(0, 8)
      .map((school) => ({
        name: school.code || school.name.slice(0, 12),
        users: school.stats.total_users || 0,
        students: school.stats.students || 0,
      }))
  }, [schools])

  const statusChartData = useMemo(() => {
    if (!overview) return []
    return [
      { name: 'Active', value: overview.active_schools },
      { name: 'Inactive', value: overview.inactive_schools },
      { name: 'Expiring soon', value: overview.expiring_soon },
      { name: 'Expired', value: overview.expired_licenses },
    ].filter((row) => row.value > 0)
  }, [overview])

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-blue-100">Platform administration</p>
            <h1 className="mt-1 text-2xl font-semibold">Super Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Platform-wide overview of schools, licenses, users, and students. Manage institutions from the Institutions tab.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/super-admin/institutions')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#eab308] px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#d4a107]"
          >
            <Building2 className="h-4 w-4" /> Manage institutions
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((kpi) => (
              <DashboardStatCard key={kpi.key} label={kpi.label} value={kpi.value} icon={kpi.icon} hint={kpi.hint} />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">Schools by license plan</h2>
              <p className="mt-1 text-sm text-slate-500">Distribution of subscription plans across institutions.</p>
              <div className="mt-4 h-64">
                {planChartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No plan data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={planChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {planChartData.map((entry, index) => (
                          <Cell key={entry.name} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">Users &amp; students by school</h2>
              <p className="mt-1 text-sm text-slate-500">Top schools by total user accounts.</p>
              <div className="mt-4 h-64">
                {schoolUsageData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No school usage data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={schoolUsageData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" name="Users" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="students" name="Students" fill="#eab308" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {statusChartData.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">License health</h2>
              <p className="mt-1 text-sm text-slate-500">Active, inactive, expiring, and expired schools.</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Schools" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
