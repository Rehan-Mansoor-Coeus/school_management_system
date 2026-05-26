import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [{ label: 'Dashboard', path: '/' }]
const accessItems = [
  { label: 'Users', path: '/users' },
  { label: 'Roles', path: '/roles' },
  { label: 'Permissions', path: '/permissions' },
]

export default function Sidebar() {
  const [accessOpen, setAccessOpen] = useState(true)

  return (
    <aside className="h-full w-72 border-r border-gray-200 bg-white px-4 py-6">
      <div className="mb-10">
        <div className="text-2xl font-bold tracking-tight text-slate-900">Admin Panel</div>
        <div className="mt-1 text-sm text-slate-500">Role-based access control</div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setAccessOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <span>Access Control</span>
          <span className={`transition ${accessOpen ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        {accessOpen && (
          <div className="space-y-1 pl-4">
            {accessItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </aside>
  )
}
