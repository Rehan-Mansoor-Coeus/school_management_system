import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'
import { useAuth } from '../hooks/useAuth'

const accessItems = [
  { label: 'Users', path: '/users' },
  { label: 'Roles', path: '/roles' },
  { label: 'Permissions', path: '/permissions' },
]

const employeeItems = [
  { labelKey: 'createActivity', path: '/timesheets/activities/create', icon: '➕' },
  { labelKey: 'fillTimeSheet', path: '/timesheets/fill', icon: '🕐' },
  { labelKey: 'workingWeek', path: '/timesheets/working-week', icon: '📅' },
]

const adminItems = [
  { labelKey: 'timeSheetReport', path: '/timesheets/admin/reports' },
  { labelKey: 'overtimeReport', path: '/timesheets/admin/overtime-report' },
  { labelKey: 'manageAll', path: '/timesheets/admin/manage-all' },
  { labelKey: 'categories', path: '/timesheets/admin/categories' },
]

function linkClass(isActive: boolean, nested = false) {
  return [
    'block rounded-xl px-4 py-2.5 text-sm font-medium transition',
    nested ? 'pl-6' : '',
    isActive ? 'bg-[#2a4a73] text-[#eab308]' : 'text-white hover:bg-[#2a4a73]/70',
  ].join(' ')
}

export default function Sidebar() {
  const { t } = useTimesheetI18n()
  const { institution } = useAuth()
  const [accessOpen, setAccessOpen] = useState(true)
  const [adminOpen, setAdminOpen] = useState(true)

  const institutionName = institution?.name || 'School Management'
  const institutionSubtitle = institution?.acronym || ''

  return (
    <aside className="h-full w-full bg-[#1e3a5f] px-4 py-6 text-white sm:w-72">
      <div className="mb-10">
        {institution?.logo_url ? (
          <img src={institution.logo_url} alt={institutionName} className="mb-3 h-12 w-auto max-w-full object-contain" />
        ) : null}
        <div className="text-2xl font-bold tracking-tight text-[#eab308]">{institutionName}</div>
        {institutionSubtitle ? (
          <div className="text-sm text-blue-100">{institutionSubtitle}</div>
        ) : null}
      </div>

      <nav className="space-y-2">
        <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
          Dashboard
        </NavLink>

        <button
          type="button"
          onClick={() => setAccessOpen(v => !v)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
        >
          <span>Access Control</span>
          <span className={`transition ${accessOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {accessOpen && accessItems.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive, true)}>
            {item.label}
          </NavLink>
        ))}

        <div className="pt-4 text-xs font-semibold uppercase tracking-wider text-blue-200">
          {t('timesheetsEmployee')}
        </div>

        {employeeItems.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
            <span className="mr-2 text-[#eab308]">{item.icon}</span>
            {t(item.labelKey)}
          </NavLink>
        ))}

        <div className="pt-4 text-xs font-semibold uppercase tracking-wider text-blue-200">
          {t('operations')}
        </div>

        <button
          type="button"
          onClick={() => setAdminOpen(v => !v)}
          className="flex w-full items-center justify-between rounded-xl bg-[#2a4a73] px-4 py-3 text-left text-sm font-semibold text-white"
        >
          <span><span className="mr-2 text-[#eab308]">📊</span>{t('timeSheetAdmin')}</span>
          <span className={`transition ${adminOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {adminOpen && adminItems.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive, true)}>
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
