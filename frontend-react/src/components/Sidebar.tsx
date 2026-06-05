import { type ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { useSidebarSection } from '../hooks/useSidebarSection'
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock,
  CreditCard,
  GraduationCap,
  Home,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  Library,
  LineChart,
  ListChecks,
  Package,
  PlusCircle,
  Puzzle,
  ScrollText,
  Shield,
  Tags,
  Timer,
  UserCog,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'
import { useAdmissionsI18n } from '../hooks/useAdmissionsI18n'
import { useAuth } from '../context/AuthContext'
import LettersSidebarSection from './letters/LettersSidebarSection'
import { ACCESS_CONTROL_PERMISSIONS, MODULE_MENU_PERMISSIONS } from '../utils/accessControl'

type SidebarItem = {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
  permissions?: string[]
}

type ModuleItem = SidebarItem & { key: string }

const navItems: SidebarItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
]

const accessItems: SidebarItem[] = [
  {
    label: 'Users',
    path: '/users',
    icon: Users,
    permissions: ['view_users', 'manage_users', 'view_customers', 'view_students', 'view_teachers', 'view_staff'],
  },
  { label: 'Roles', path: '/roles', icon: UserCog, permissions: ['view_roles', 'manage_roles'] },
  { label: 'Permissions', path: '/permissions', icon: KeyRound, permissions: ['view_permissions', 'manage_roles'] },
  { label: 'Modules', path: '/modules', icon: Puzzle, permissions: ['manage_modules', 'modules.view'] },
]

const moduleItems: ModuleItem[] = [
  { key: 'admissions', label: 'Admissions', path: '/admissions', icon: UserPlus },
  { key: 'attendance', label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
  { key: 'results', label: 'Results', path: '/results', icon: Award },
  { key: 'fees', label: 'Fees & Payments', path: '/fees', icon: Wallet },
  { key: 'hr', label: 'HR & Payroll', path: '/hr', icon: CreditCard },
  { key: 'assets', label: 'Assets', path: '/assets', icon: Package },
  { key: 'library', label: 'Library', path: '/library', icon: Library },
  { key: 'hostel', label: 'Hostel', path: '/hostel', icon: Home },
  { key: 'canteen', label: 'Canteen', path: '/canteen', icon: UtensilsCrossed },
  { key: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell },
  { key: 'audit', label: 'Audit Logs', path: '/audit', icon: ScrollText },
]

const academicsChildren: ModuleItem[] = [
  { key: 'institutions', label: 'Institutions', path: '/institutions', icon: Building2 },
  { key: 'departments', label: 'Departments', path: '/departments', icon: LayoutGrid },
  { key: 'academics', label: 'Programmes', path: '/academics/programmes', icon: BookOpen },
  { key: 'academics', label: 'Subjects', path: '/academics/subjects', icon: Library },
]

const employeeItems = [
  { labelKey: 'createActivity', path: '/timesheets/activities/create', icon: PlusCircle, permissions: ['create_timesheet_activity', 'timesheets.create_entry', 'timesheets.manage'] },
  { labelKey: 'fillTimeSheet', path: '/timesheets/fill', icon: Clock, permissions: ['fill_timesheet', 'timesheets.create_entry', 'timesheets.view_own'] },
  { labelKey: 'workingWeek', path: '/timesheets/working-week', icon: CalendarDays, permissions: ['manage_own_working_week', 'timesheets.manage'] },
]

const adminItems = [
  { labelKey: 'timeSheetReport', path: '/timesheets/admin/reports', icon: LineChart, permissions: ['view_timesheet_reports', 'timesheets.report', 'timesheets.view_timesheet_reports'] },
  { labelKey: 'overtimeReport', path: '/timesheets/admin/overtime-report', icon: Timer, permissions: ['view_overtime_reports', 'view_timesheet_reports', 'timesheets.report'] },
  { labelKey: 'manageAll', path: '/timesheets/admin/manage-all', icon: ListChecks, permissions: ['view_all_timesheets', 'timesheets.manage', 'timesheets.review'] },
  { labelKey: 'categories', path: '/timesheets/admin/categories', icon: Tags, permissions: ['manage_timesheet_categories', 'timesheets.manage'] },
]

function linkClass(isActive: boolean, nested = false) {
  return [
    'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition',
    nested ? 'pl-6' : '',
    isActive ? 'bg-[#2a4a73] text-[#eab308]' : 'text-white hover:bg-[#2a4a73]/70',
  ].join(' ')
}

function iconClass(isActive: boolean) {
  return `h-4 w-4 shrink-0 ${isActive ? 'text-[#eab308]' : 'text-blue-200'}`
}

function SidebarLink({
  item,
  nested = false,
}: {
  item: SidebarItem
  nested?: boolean
}) {
  const Icon = item.icon

  return (
    <NavLink to={item.path} end={item.path === '/'} className={({ isActive }) => linkClass(isActive, nested)}>
      {({ isActive }) => (
        <>
          <Icon className={iconClass(isActive)} aria-hidden="true" />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function SidebarI18nLink({
  labelKey,
  path,
  icon: Icon,
  nested = false,
  t,
}: {
  labelKey: string
  path: string
  icon: ComponentType<{ className?: string }>
  nested?: boolean
  t: (key: string) => string
}) {
  return (
    <NavLink to={path} className={({ isActive }) => linkClass(isActive, nested)}>
      {({ isActive }) => (
        <>
          <Icon className={iconClass(isActive)} aria-hidden="true" />
          <span className="truncate">{t(labelKey)}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { t } = useTimesheetI18n()
  const { t: tAdmissions } = useAdmissionsI18n()
  const { institution, enabledModules, canAccess } = useAuth()

  const safeEnabledModules = Array.isArray(enabledModules) ? enabledModules : []

  const canUseModule = (key: string) => {
    if (!safeEnabledModules.includes(key)) return false
    const permissions = MODULE_MENU_PERMISSIONS[key]
    if (!permissions?.length) return true
    return canAccess({ permissions })
  }

  const visibleAccessItems = accessItems.filter((item) => canAccess({ permissions: item.permissions }))
  const showAccessControl = canAccess({ permissions: ACCESS_CONTROL_PERMISSIONS }) && visibleAccessItems.length > 0

  const visibleEmployeeItems = employeeItems.filter((item) => canAccess({ permissions: item.permissions }))
  const visibleAdminItems = adminItems.filter((item) => canAccess({ permissions: item.permissions }))
  const showTimesheets = safeEnabledModules.includes('timesheets') && visibleEmployeeItems.length > 0
  const showOperations = safeEnabledModules.includes('timesheets') && visibleAdminItems.length > 0

  const visibleModuleItems = moduleItems.filter((item) => canUseModule(item.key))
  const visibleAcademicsChildren = academicsChildren.filter((item) => canUseModule(item.key))
  const showAcademics = visibleAcademicsChildren.length > 0
  const showModulesSection = visibleModuleItems.length > 0

  const [accessOpen, setAccessOpen] = useSidebarSection(false, [
    '/users', '/roles', '/permissions', '/modules',
  ])
  const [timesheetOpen, setTimesheetOpen] = useSidebarSection(false, ['/timesheets'])
  const [operationsOpen, setOperationsOpen] = useSidebarSection(false, ['/timesheets/admin'])
  const [adminOpen, setAdminOpen] = useSidebarSection(false, ['/timesheets/admin'])
  const [academicsOpen, setAcademicsOpen] = useSidebarSection(false, academicsChildren.map((item) => item.path))
  const [modulesOpen, setModulesOpen] = useSidebarSection(false, visibleModuleItems.map((item) => item.path))

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
        {navItems.map((item) => (
          <SidebarLink key={item.path} item={item} />
        ))}

        {showAccessControl && (
          <>
            <button
              type="button"
              onClick={() => setAccessOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                Access Control
              </span>
              <span className={`transition ${accessOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {accessOpen && visibleAccessItems.map((item) => (
              <SidebarLink key={item.path} item={item} nested />
            ))}
          </>
        )}

        {showTimesheets && (
          <>
            <button
              type="button"
              onClick={() => setTimesheetOpen((v) => !v)}
              className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-200 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <Clock className="h-3.5 w-3.5 text-[#eab308]" aria-hidden="true" />
                {t('timesheetsEmployee')}
              </span>
              <span className={`transition ${timesheetOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {timesheetOpen && visibleEmployeeItems.map((item) => (
              <SidebarI18nLink key={item.path} labelKey={item.labelKey} path={item.path} icon={item.icon} t={t} />
            ))}
          </>
        )}

        {showOperations && (
          <>
            <button
              type="button"
              onClick={() => setOperationsOpen((v) => !v)}
              className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-200 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <BarChart3 className="h-3.5 w-3.5 text-[#eab308]" aria-hidden="true" />
                {t('operations')}
              </span>
              <span className={`transition ${operationsOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {operationsOpen && (
              <>
                <button
                  type="button"
                  onClick={() => setAdminOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl bg-[#2a4a73] px-4 py-3 text-left text-sm font-semibold text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <BarChart3 className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                    {t('timeSheetAdmin')}
                  </span>
                  <span className={`transition ${adminOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {adminOpen && visibleAdminItems.map((item) => (
                  <SidebarI18nLink key={item.path} labelKey={item.labelKey} path={item.path} icon={item.icon} nested t={t} />
                ))}
              </>
            )}
          </>
        )}

        {safeEnabledModules.includes('letters') && <LettersSidebarSection />}

        {showAcademics && (
          <>
            <button
              type="button"
              onClick={() => setAcademicsOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <GraduationCap className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                Academics
              </span>
              <span className={`transition ${academicsOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {academicsOpen && visibleAcademicsChildren.map((child) => (
              <SidebarLink key={child.path} item={child} nested />
            ))}
          </>
        )}

        {showModulesSection && (
          <>
            <button
              type="button"
              onClick={() => setModulesOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <Puzzle className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                Modules
              </span>
              <span className={`transition ${modulesOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {modulesOpen && (
              <div className="space-y-1 pl-4">
                {visibleModuleItems.map((item) => (
                  <SidebarLink
                    key={item.path}
                    item={{
                      ...item,
                      label: item.key === 'admissions' ? tAdmissions('moduleTitle') : item.label,
                    }}
                    nested
                  />
                ))}
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  )
}
