import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom'
import { Users, GraduationCap, Briefcase, UserCog, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ColoredModuleTabsNav from '../ui/ColoredModuleTabsNav'
import UsersPage from '../../pages/Users'

const linkDefs = [

  { path: '/users', label: 'All Users', end: true, permissions: ['view_users', 'manage_users'], icon: Users, color: 'blue' as const },
  { path: '/users/customers', label: 'Customers', permissions: ['view_customers', 'manage_users'], icon: User, color: 'teal' as const },
  { path: '/users/students', label: 'Students', permissions: ['view_students', 'manage_users'], icon: GraduationCap, color: 'indigo' as const },
  { path: '/users/teachers', label: 'Teachers', permissions: ['view_teachers', 'manage_users'], icon: Briefcase, color: 'emerald' as const },
  { path: '/users/staff', label: 'Staff', permissions: ['view_staff', 'manage_users'], icon: UserCog, color: 'violet' as const },

]

function UsersIndexPage() {
  const { canAccess } = useAuth()

  if (canAccess({ permissions: ['users.view', 'view_users', 'manage_users'] })) {
    return <UsersPage />
  }

  const firstTab = linkDefs.find(
    (link) => link.path !== '/users' && canAccess({ permissions: link.permissions })
  )

  if (firstTab) {
    return <Navigate to={firstTab.path} replace />
  }

  return <Navigate to="/dashboard" replace />
}

export default function UsersLayout() {
  const { canAccess } = useAuth()
  const location = useLocation()

  const visibleLinks = linkDefs.filter((link) => canAccess({ permissions: link.permissions }))
  const showTabs = visibleLinks.length > 0 && !location.pathname.endsWith('/add')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Manage accounts, roles, and people by type.</p>
      </div>

      {showTabs && (
        <ColoredModuleTabsNav
          items={visibleLinks.map((link) => ({
            label: link.label,
            path: link.path,
            end: link.end,
            icon: link.icon,
            color: link.color,
          }))}
        />
      )}

      <Outlet />
    </div>
  )
}

export { UsersIndexPage }
