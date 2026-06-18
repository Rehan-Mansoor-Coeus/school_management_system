import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTasksI18n } from '../../../hooks/useTasksI18n'

const tabs = [
  { path: '/tasks', key: 'dashboard', end: true, permissions: ['tasks.view', 'tasks.assign', 'tasks.manage'] },
  { path: '/tasks/all', key: 'allTasks', permissions: ['tasks.view', 'tasks.manage'] },
  { path: '/tasks/create', key: 'create', permissions: ['tasks.create', 'tasks.manage'] },
  { path: '/tasks/scheduled', key: 'scheduled', permissions: ['tasks.manage'] },
  { path: '/tasks/settings', key: 'settings', permissions: ['tasks.manage'] },
  { path: '/tasks/my', key: 'myTasks', permissions: ['tasks.view', 'tasks.assign', 'tasks.manage'] },
  { path: '/tasks/pending', key: 'pending', permissions: ['tasks.view', 'tasks.manage'] },
]

export default function TasksLayout() {
  const { canAccess } = useAuth()
  const { t } = useTasksI18n()
  const visibleTabs = tabs.filter((tab) => canAccess({ permissions: tab.permissions }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('moduleTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('moduleSubtitle')}</p>
      </div>

      {visibleTabs.length > 0 && (
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {t(tab.key)}
            </NavLink>
          ))}
        </nav>
      )}

      <Outlet />
    </div>
  )
}
