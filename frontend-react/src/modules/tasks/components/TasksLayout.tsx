import { Outlet } from 'react-router-dom'
import { LayoutDashboard, ListTodo, PlusCircle, CalendarClock, Settings, User, Clock } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useTasksI18n } from '../../../hooks/useTasksI18n'
import ColoredModuleTabsNav, { type TabColor } from '../../../components/ui/ColoredModuleTabsNav'

const tabs = [
  { path: '/tasks', key: 'dashboard', end: true, permissions: ['tasks.view', 'tasks.assign', 'tasks.manage'], icon: LayoutDashboard, color: 'navy' as TabColor },
  { path: '/tasks/all', key: 'allTasks', permissions: ['tasks.view', 'tasks.manage'], icon: ListTodo, color: 'blue' as TabColor },
  { path: '/tasks/create', key: 'create', permissions: ['tasks.create', 'tasks.manage'], icon: PlusCircle, color: 'emerald' as TabColor },
  { path: '/tasks/scheduled', key: 'scheduled', permissions: ['tasks.manage'], icon: CalendarClock, color: 'amber' as TabColor },
  { path: '/tasks/settings', key: 'settings', permissions: ['tasks.manage'], icon: Settings, color: 'slate' as TabColor },
  { path: '/tasks/my', key: 'myTasks', permissions: ['tasks.view', 'tasks.assign', 'tasks.manage'], icon: User, color: 'purple' as TabColor },
  { path: '/tasks/pending', key: 'pending', permissions: ['tasks.view', 'tasks.manage'], icon: Clock, color: 'orange' as TabColor },
]

export default function TasksLayout() {
  const { canAccess } = useAuth()
  const { t } = useTasksI18n()
  const visibleTabs = tabs
    .filter((tab) => canAccess({ permissions: tab.permissions }))
    .map((tab) => ({
      label: t(tab.key),
      path: tab.path,
      end: tab.end,
      icon: tab.icon,
      color: tab.color,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('moduleTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('moduleSubtitle')}</p>
      </div>

      <ColoredModuleTabsNav items={visibleTabs} />
      <Outlet />
    </div>
  )
}
