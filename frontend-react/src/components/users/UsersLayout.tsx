import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import UsersPage from '../../pages/Users'

const linkDefs = [
  { path: '/users', label: 'All Users', end: true, permissions: ['users.view', 'view_users', 'manage_users'] },
  { path: '/users/customers', label: 'Customers', permissions: ['view_customers', 'manage_users', 'users.view'] },
  { path: '/users/students', label: 'Students', permissions: ['view_students', 'manage_users', 'users.view'] },
  { path: '/users/teachers', label: 'Teachers', permissions: ['view_teachers', 'manage_users', 'users.view'] },
  { path: '/users/staff', label: 'Staff', permissions: ['view_staff', 'manage_users', 'users.view'] },
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

  return <Navigate to="/" replace />
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
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}

      <Outlet />
    </div>
  )
}

export { UsersIndexPage }
