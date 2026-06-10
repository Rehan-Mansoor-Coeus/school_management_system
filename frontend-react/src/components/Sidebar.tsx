import { type ComponentType } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSidebarSection } from '../hooks/useSidebarSection'
import {
  Award,
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  Clock,
  CreditCard,
  GraduationCap,
  Home,
  LayoutDashboard,
  Library,
  Mail,
  Megaphone,
  Package,
  Puzzle,
  ScrollText,
  Settings,
  Shield,
  UserCog,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'
import { useLettersI18n } from '../hooks/useLettersI18n'
import { useAuth } from '../context/AuthContext'
import { ACCESS_CONTROL_PERMISSIONS, MODULE_MENU_PERMISSIONS } from '../utils/accessControl'

type SidebarItem = {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
  permissions?: string[]
}

type ModuleItem = SidebarItem & { key: string }

const navItems: SidebarItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
]

const accessItems: SidebarItem[] = [
  {
    label: 'Users',
    path: '/users',
    icon: Users,
    permissions: ['view_users', 'manage_users', 'view_customers', 'view_students', 'view_teachers', 'view_staff'],
  },
  {
    label: 'Roles & Permissions',
    path: '/roles-permissions',
    icon: UserCog,
    permissions: ['view_roles', 'manage_roles', 'view_permissions'],
  },
  { label: 'Modules', path: '/modules', icon: Puzzle, permissions: ['manage_modules', 'modules.view'] },
  { label: 'General Settings', path: '/general-settings', icon: Settings, permissions: ['manage_modules', 'modules.view'] },
  { label: 'Institution Requests', path: '/institution-requests', icon: Building2, permissions: ['institutions.view', 'institutions.create'] },
]

const moduleItems: ModuleItem[] = [
  { key: 'attendance', label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
  { key: 'results', label: 'Results', path: '/results', icon: Award },
  { key: 'fees', label: 'Fees & Payments', path: '/fees', icon: Wallet },
  { key: 'hr', label: 'HR & Payroll', path: '/hr', icon: CreditCard },
  { key: 'assets', label: 'Assets', path: '/assets', icon: Package },
  { key: 'hostel', label: 'Hostel', path: '/hostel', icon: Home },
  { key: 'canteen', label: 'Canteen', path: '/canteen', icon: UtensilsCrossed },
  { key: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell },
  { key: 'audit', label: 'Audit Logs', path: '/audit', icon: ScrollText },
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

function SidebarLink({ item, nested = false }: { item: SidebarItem; nested?: boolean }) {
  const Icon = item.icon
  return (
    <NavLink to={item.path} end={item.path === '/dashboard'} className={({ isActive }) => linkClass(isActive, nested)}>
      {({ isActive }) => (
        <>
          <Icon className={iconClass(isActive)} aria-hidden="true" />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { t } = useTimesheetI18n()
  const { t: tLetters } = useLettersI18n()
  const { institution, enabledModules, canAccess, hasPermission } = useAuth()
  const location = useLocation()

  const safeEnabledModules = Array.isArray(enabledModules) ? enabledModules : []

  const canUseModule = (key: string) => {
    if (!safeEnabledModules.includes(key)) return false
    const permissions = MODULE_MENU_PERMISSIONS[key]
    if (!permissions?.length) return true
    return canAccess({ permissions })
  }

  const visibleAccessItems = accessItems.filter((item) => canAccess({ permissions: item.permissions }))
  const showAccessControl = canAccess({ permissions: ACCESS_CONTROL_PERMISSIONS }) && visibleAccessItems.length > 0

  const showTimesheetEmployee = safeEnabledModules.includes('timesheets') && canAccess({
    permissions: ['create_timesheet_activity', 'fill_timesheet', 'manage_own_working_week', 'timesheets.create_entry', 'timesheets.view_own', 'timesheets.manage'],
  })
  const showTimesheetAdmin = safeEnabledModules.includes('timesheets') && canAccess({
    permissions: ['view_timesheet_reports', 'view_all_timesheets', 'manage_timesheet_categories', 'timesheets.report', 'timesheets.manage', 'timesheets.review'],
  })
  const showOperations = showTimesheetEmployee || showTimesheetAdmin

  const canViewLetters = hasPermission('view_letters_menu') || hasPermission('create_letters')
  const canViewAnnouncements = hasPermission('view_announcements') || hasPermission('create_announcements')
  const showLettersModule = safeEnabledModules.includes('letters') && (canViewLetters || canViewAnnouncements)

  const showLibrary = safeEnabledModules.includes('library') && canAccess({
    permissions: ['view_library_menu', 'view_library_reports', 'borrow_books', 'approve_borrow_requests'],
  })

  const showAcademics = ['institutions', 'departments', 'academics', 'admissions', 'character_certificates'].some((key) => canUseModule(key))

  const visibleModuleItems = moduleItems.filter((item) => canUseModule(item.key))
  const showModulesSection = visibleModuleItems.length > 0

  const [accessOpen, setAccessOpen] = useSidebarSection(false, ['/users', '/roles-permissions', '/roles', '/permissions', '/modules'])
  const [operationsOpen, setOperationsOpen] = useSidebarSection(false, ['/timesheets'])
  const [lettersOpen, setLettersOpen] = useSidebarSection(false, ['/letters'])
  const [modulesOpen, setModulesOpen] = useSidebarSection(false, visibleModuleItems.map((item) => item.path))

  const institutionName = institution?.name || 'School Management'
  const institutionSubtitle = institution?.acronym || ''

  const employeePath = '/timesheets/fill'
  const adminPath = '/timesheets/admin/reports'
  const academicsPath = '/institutions'
  const academicsActive = ['/institutions', '/departments', '/academics', '/admissions', '/character-certificates'].some((p) =>
    location.pathname.startsWith(p)
  )

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-[#1e3a5f] px-4 py-6 text-white">
      <div className="mb-6 shrink-0">
        {institution?.logo_url ? (
          <img src={institution.logo_url} alt={institutionName} className="mb-3 h-12 w-auto max-w-full object-contain" />
        ) : null}
        <div className="text-2xl font-bold tracking-tight text-[#eab308]">{institutionName}</div>
        {institutionSubtitle ? <div className="text-sm text-blue-100">{institutionSubtitle}</div> : null}
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

        {showOperations && (
          <>
            <button
              type="button"
              onClick={() => setOperationsOpen((v) => !v)}
              className="mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <BarChart3 className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                {t('operations')}
              </span>
              <span className={`transition ${operationsOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {operationsOpen && (
              <div className="space-y-1">
                {showTimesheetEmployee && (
                  <NavLink to={employeePath} className={({ isActive }) => linkClass(isActive, true)}>
                    {({ isActive }) => (
                      <>
                        <Clock className={iconClass(isActive)} aria-hidden="true" />
                        <span className="truncate">{t('timesheetsEmployee')}</span>
                      </>
                    )}
                  </NavLink>
                )}
                {showTimesheetAdmin && (
                  <NavLink to={adminPath} className={({ isActive }) => linkClass(isActive, true)}>
                    {({ isActive }) => (
                      <>
                        <BarChart3 className={iconClass(isActive)} aria-hidden="true" />
                        <span className="truncate">{t('timeSheetAdmin')}</span>
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            )}
          </>
        )}

        {showLettersModule && (
          <>
            <button
              type="button"
              onClick={() => setLettersOpen((v) => !v)}
              className="mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                {tLetters('moduleTitle')}
              </span>
              <span className={`transition ${lettersOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {lettersOpen && (
              <div className="space-y-1">
                {canViewAnnouncements && (
                  <NavLink to="/letters/announcements" className={({ isActive }) => linkClass(isActive, true)}>
                    {({ isActive }) => (
                      <>
                        <Megaphone className={iconClass(isActive)} aria-hidden="true" />
                        <span className="truncate">{tLetters('announcementsSection')}</span>
                      </>
                    )}
                  </NavLink>
                )}
                {canViewLetters && (
                  <NavLink to="/letters/listing" className={({ isActive }) => linkClass(isActive, true)}>
                    {({ isActive }) => (
                      <>
                        <Mail className={iconClass(isActive)} aria-hidden="true" />
                        <span className="truncate">{tLetters('lettersSection')}</span>
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            )}
          </>
        )}

        {showLibrary && (
          <NavLink to="/library" className={({ isActive }) => linkClass(isActive)}>
            {({ isActive }) => (
              <>
                <Library className={iconClass(isActive)} aria-hidden="true" />
                <span className="truncate">Library</span>
              </>
            )}
          </NavLink>
        )}

        {showAcademics && (
          <NavLink to={academicsPath} className={() => linkClass(academicsActive)}>
            {({ isActive }) => (
              <>
                <GraduationCap className={iconClass(isActive)} aria-hidden="true" />
                <span className="truncate">Academics</span>
              </>
            )}
          </NavLink>
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
            {modulesOpen && visibleModuleItems.map((item) => (
              <SidebarLink key={item.path} item={item} nested />
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
