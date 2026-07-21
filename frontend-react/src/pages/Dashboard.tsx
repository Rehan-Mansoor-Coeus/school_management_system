import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StaffDashboardOverview from '../components/dashboard/StaffDashboardOverview'
import StudentAdmissionsStats from '../modules/admissions/components/StudentAdmissionsStats'
import SuperAdminDashboard from './superadmin/SuperAdminDashboard'
import AdminDashboard from './AdminDashboard'
import { PLATFORM_SUPER_ADMIN_ROLES, INSTITUTION_SUPER_ADMIN_ROLES, ADMIN_ROLES } from '../utils/accessControl'

export default function Dashboard() {
  const {
    hasAnyRole,
    isPlatformSuperAdmin,
    isPlatformContext,
    isInstitutionContext,
    actingAsSuperAdmin,
    roleType,
    activeInstitutionId,
  } = useAuth()

  const isElevatedAdmin =
    isPlatformSuperAdmin
    || actingAsSuperAdmin
    || roleType === 'platform_super_admin'
    || hasAnyRole([...PLATFORM_SUPER_ADMIN_ROLES, ...INSTITUTION_SUPER_ADMIN_ROLES, ...ADMIN_ROLES])

  // Platform super admins always use the platform home unless explicitly switched into a school.
  if (isPlatformSuperAdmin && isPlatformContext) {
    if (typeof window !== 'undefined' && window.location.pathname === '/dashboard') {
      return <Navigate to="/super-admin/dashboard" replace />
    }
    return <SuperAdminDashboard />
  }

  // Super admin switched into an institution, or any school admin (not platform SA).
  if ((isPlatformSuperAdmin && isInstitutionContext)
    || (actingAsSuperAdmin && activeInstitutionId)
    || (!isPlatformSuperAdmin && hasAnyRole(['admin', 'institution-admin', ...INSTITUTION_SUPER_ADMIN_ROLES]))) {
    return <AdminDashboard />
  }

  if (isPlatformSuperAdmin || roleType === 'platform_super_admin') {
    return <SuperAdminDashboard />
  }

  // Only true students — never treat elevated admins as students via admissions.apply.
  if (!isElevatedAdmin && hasAnyRole(['student'])) {
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
