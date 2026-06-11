import { Outlet } from 'react-router-dom'
import { ClipboardList, CalendarDays, Clock } from 'lucide-react'
import { useTimesheetI18n } from '../../hooks/useTimesheetI18n'
import { useAuth } from '../../context/AuthContext'
import ColoredModuleTabsNav from '../ui/ColoredModuleTabsNav'

const employeeTabs = [
  { labelKey: 'createActivity', path: '/timesheets/activities/create', permissions: ['create_timesheet_activity', 'timesheets.create_entry', 'timesheets.manage'], icon: ClipboardList, color: 'emerald' as const },
  { labelKey: 'fillTimeSheet', path: '/timesheets/fill', permissions: ['fill_timesheet', 'timesheets.create_entry', 'timesheets.view_own'], icon: CalendarDays, color: 'blue' as const },
  { labelKey: 'workingWeek', path: '/timesheets/working-week', permissions: ['manage_own_working_week', 'timesheets.manage'], icon: Clock, color: 'violet' as const },
]

export default function TimesheetEmployeeLayout() {
  const { t } = useTimesheetI18n()
  const { canAccess } = useAuth()
  const tabs = employeeTabs
    .filter((tab) => canAccess({ permissions: tab.permissions }))
    .map((tab) => ({
      label: t(tab.labelKey),
      path: tab.path,
      icon: tab.icon,
      color: tab.color,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('timesheetsEmployee')}</h1>
        <p className="mt-1 text-sm text-slate-500">Create activities, fill timesheets, and manage your working week.</p>
      </div>

      <ColoredModuleTabsNav items={tabs} />
      <Outlet />
    </div>
  )
}
