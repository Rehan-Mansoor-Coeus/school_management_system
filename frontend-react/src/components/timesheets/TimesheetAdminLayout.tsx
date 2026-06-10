import { Outlet } from 'react-router-dom'
import { BarChart3, Timer, FolderKanban, Tags } from 'lucide-react'
import { useTimesheetI18n } from '../../hooks/useTimesheetI18n'
import { useAuth } from '../../context/AuthContext'
import ColoredModuleTabsNav from '../ui/ColoredModuleTabsNav'

const adminTabs = [
  { labelKey: 'timeSheetReport', path: '/timesheets/admin/reports', permissions: ['view_timesheet_reports', 'timesheets.report', 'timesheets.view_timesheet_reports'], icon: BarChart3, color: 'blue' as const },
  { labelKey: 'overtimeReport', path: '/timesheets/admin/overtime-report', permissions: ['view_overtime_reports', 'view_timesheet_reports', 'timesheets.report'], icon: Timer, color: 'orange' as const },
  { labelKey: 'manageAll', path: '/timesheets/admin/manage-all', permissions: ['view_all_timesheets', 'timesheets.manage', 'timesheets.review'], icon: FolderKanban, color: 'indigo' as const },
  { labelKey: 'categories', path: '/timesheets/admin/categories', permissions: ['manage_timesheet_categories', 'timesheets.manage'], icon: Tags, color: 'emerald' as const },
]

export default function TimesheetAdminLayout() {
  const { t } = useTimesheetI18n()
  const { canAccess } = useAuth()
  const tabs = adminTabs
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
        <h1 className="text-2xl font-bold text-slate-900">{t('timeSheetAdmin')}</h1>
        <p className="mt-1 text-sm text-slate-500">Reports, approvals, and timesheet administration.</p>
      </div>

      <ColoredModuleTabsNav items={tabs} />
      <Outlet />
    </div>
  )
}
