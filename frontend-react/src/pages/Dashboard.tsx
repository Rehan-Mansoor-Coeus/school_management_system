import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StaffDashboardOverview from '../components/dashboard/StaffDashboardOverview'
import StudentAdmissionsStats from '../modules/admissions/components/StudentAdmissionsStats'
import SuperAdminDashboard from './superadmin/SuperAdminDashboard'
import AdminDashboard from './AdminDashboard'
import { PLATFORM_SUPER_ADMIN_ROLES } from '../utils/accessControl'

export default function Dashboard() {
  const { hasAnyRole, canAccess, isPlatformSuperAdmin, isPlatformContext, isInstitutionContext } = useAuth()

  // Platform super admins in platform context use the dedicated platform home.
  if (isPlatformSuperAdmin && isPlatformContext) {
    if (typeof window !== 'undefined' && window.location.pathname === '/dashboard') {
      return <Navigate to="/super-admin/dashboard" replace />
    }
    return <SuperAdminDashboard />
  }

  // Super admin who switched into an institution gets the school dashboard.
  if (isPlatformSuperAdmin && isInstitutionContext) {
    return <AdminDashboard />
  }

  if (hasAnyRole([...PLATFORM_SUPER_ADMIN_ROLES])) {
    return <SuperAdminDashboard />
  }

  if (hasAnyRole(['admin', 'institution-admin'])) {
    return <AdminDashboard />
  }

  const isStudent = hasAnyRole(['student']) || canAccess({ permissions: ['admissions.apply'] })

  if (isStudent) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your applications, fees, enrollment status, and next steps at a glance.
          </p>
        </div>
        <StudentAdmissionsStats />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Institution overview, pending tasks, and quick links for your role.
        </p>
      </div>
      <StaffDashboardOverview />
    </div>
  )
}
