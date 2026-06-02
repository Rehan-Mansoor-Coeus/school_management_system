import { useState } from 'react'
import { NavLink } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'
import { useAuth } from '../context/AuthContext'
import LettersSidebarSection from './letters/LettersSidebarSection'
import {
  Award,
  BedDouble,
  Bell,
  BookMarked,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  Library,
  Network,
  Presentation,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

const accessItems: { label: string; path: string; icon: LucideIcon }[] = [
  { label: 'Users', path: '/users', icon: Users },
  { label: 'Teachers', path: '/teachers', icon: Presentation },
  { label: 'Students', path: '/students', icon: GraduationCap },
  { label: 'Roles', path: '/roles', icon: ShieldCheck },
  { label: 'Permissions', path: '/permissions', icon: KeyRound },
  { label: 'Modules', path: '/modules', icon: SlidersHorizontal },
]

const moduleItems: { key: string; label: string; path: string; icon: LucideIcon }[] = [
  { key: 'admissions', label: 'Admissions', path: '/admissions', icon: UserPlus },
  { key: 'attendance', label: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { key: 'results', label: 'Results', path: '/results', icon: Award },
  { key: 'fees', label: 'Fees & Payments', path: '/fees', icon: CreditCard },
  { key: 'hr', label: 'HR & Payroll', path: '/hr', icon: Briefcase },
  { key: 'assets', label: 'Assets', path: '/assets', icon: Boxes },
  { key: 'library', label: 'Library', path: '/library', icon: Library },
  { key: 'hostel', label: 'Hostel', path: '/hostel', icon: BedDouble },
  { key: 'canteen', label: 'Canteen', path: '/canteen', icon: Utensils },
  { key: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell },
  { key: 'audit', label: 'Audit Logs', path: '/audit', icon: ScrollText },
]

const academicsChildren: { key: string; label: string; path: string; icon: LucideIcon }[] = [
  { key: 'institutions', label: 'Institutions', path: '/institutions', icon: Building2 },
  { key: 'departments', label: 'Departments', path: '/departments', icon: Network },
  { key: 'academics', label: 'Programmes', path: '/academics/programmes', icon: BookOpen },
  { key: 'academics', label: 'Subjects', path: '/academics/subjects', icon: BookMarked },
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
    'flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition',
    nested ? 'pl-6' : '',
    isActive ? 'bg-[#2a4a73] text-[#eab308]' : 'text-white hover:bg-[#2a4a73]/70',
  ].join(' ')
}

export default function Sidebar() {
  const { t } = useTimesheetI18n()
  const { institution, enabledModules } = useAuth()
  const [accessOpen, setAccessOpen] = useState(true)
  const [modulesOpen, setModulesOpen] = useState(true)

  const safeEnabledModules = Array.isArray(enabledModules) ? enabledModules : []
  const visibleModuleItems = moduleItems.filter((item) => safeEnabledModules.includes(item.key))
  const visibleAcademicsChildren = academicsChildren.filter((item) => safeEnabledModules.includes(item.key))
  const [adminOpen, setAdminOpen] = useState(true)
  const [academicsOpen, setAcademicsOpen] = useState(true)

  const institutionName = institution?.name || 'School Management'
  const institutionSubtitle = institution?.acronym || ''

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-[#1e3a5f] px-4 py-6 text-white">
      <div className="mb-6 shrink-0">
        {institution?.logo_url ? (
          <img src={institution.logo_url} alt={institutionName} className="mb-3 h-12 w-auto max-w-full object-contain" />
        ) : null}
        <div className="text-2xl font-bold tracking-tight text-[#eab308]">{institutionName}</div>
        {institutionSubtitle ? (
          <div className="text-sm text-blue-100">{institutionSubtitle}</div>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
        <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
          {({ isActive }) => (
            <>
              <LayoutDashboard className={`mr-2 h-4 w-4 shrink-0 ${isActive ? 'text-[#eab308]' : 'text-blue-200'}`} aria-hidden="true" />
              Dashboard
            </>
          )}
        </NavLink>

        <button
          type="button"
          onClick={() => setAccessOpen(v => !v)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
            Access Control
          </span>
          <span className={`transition ${accessOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {accessOpen && accessItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive, true)}>
              {({ isActive }) => (
                <>
                  <Icon className={`mr-2 h-4 w-4 shrink-0 ${isActive ? 'text-[#eab308]' : 'text-blue-200'}`} aria-hidden="true" />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}

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

        {safeEnabledModules.includes('letters') && <LettersSidebarSection />}

        {visibleAcademicsChildren.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setAcademicsOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                Academics
              </span>
              <span className={`transition ${academicsOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {academicsOpen &&
              visibleAcademicsChildren.map((child) => {
                const Icon = child.icon
                return (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) => linkClass(isActive, true)}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`mr-2 h-4 w-4 shrink-0 ${isActive ? 'text-[#eab308]' : 'text-blue-200'}`} aria-hidden="true" />
                        {child.label}
                      </>
                    )}
                  </NavLink>
                )
              })}
          </>
        )}

        <button
          type="button"
          onClick={() => setModulesOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
        >
          <span className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
            Modules
          </span>
          <span className={`transition ${modulesOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {modulesOpen && (
          <div className="space-y-1 pl-4">
            {visibleModuleItems.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-400">No modules enabled.</div>
            ) : (
              visibleModuleItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => linkClass(isActive, true)}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`mr-2 h-4 w-4 shrink-0 ${isActive ? 'text-[#eab308]' : 'text-blue-200'}`} aria-hidden="true" />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                )
              })
            )}
          </div>
        )}
      </nav>
    </aside>
  )
}
