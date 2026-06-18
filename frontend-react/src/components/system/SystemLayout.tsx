import { NavLink, Outlet } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const tabDefs = [
  {
    label: 'General Settings',
    path: '/system/general-settings',
    end: true,
    permissions: ['manage_modules', 'modules.view'],
    icon: Settings,
  },
]

function tabClass(isActive: boolean) {
  return [
    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition',
    isActive ? 'bg-[#1e3a5f] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
  ].join(' ')
}

export default function SystemLayout() {
  const { canAccess } = useAuth()
  const tabs = tabDefs.filter((tab) => canAccess({ permissions: tab.permissions }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System</h1>
        <p className="mt-1 text-sm text-slate-500">Platform configuration and global settings.</p>
      </div>

      {tabs.length > 0 && (
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink key={tab.path} to={tab.path} end={tab.end} className={({ isActive }) => tabClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} aria-hidden="true" />
                    {tab.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      )}

      <Outlet />
    </div>
  )
}
