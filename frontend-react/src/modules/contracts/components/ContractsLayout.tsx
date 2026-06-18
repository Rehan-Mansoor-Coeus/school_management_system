import { NavLink, Outlet } from 'react-router-dom'
import { FileStack, FileText, LayoutDashboard, PlusCircle } from 'lucide-react'

const tabs = [
  { label: 'Dashboard', path: '/contracts', icon: LayoutDashboard, end: true },
  { label: 'All Contracts', path: '/contracts/list', icon: FileStack },
  { label: 'Templates', path: '/contracts/templates', icon: FileText },
  { label: 'Generate', path: '/contracts/generate', icon: PlusCircle },
]

export default function ContractsLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Contract Management</h1>
        <p className="text-sm text-slate-500">Digital contract generation, signing, approval, and storage.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          )
        })}
      </div>

      <Outlet />
    </div>
  )
}
