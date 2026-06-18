import { type ComponentType } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSidebarSection } from '../hooks/useSidebarSection'
import {
  Award,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckSquare,
  Clock,
  CreditCard,
  FileStack,
  FileText,
  GraduationCap,
  Home,
  KeyRound,
  LayoutDashboard,
  Library,
  Mail,
  Megaphone,
  Package,
  Puzzle,
  ScrollText,
  Server,
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
import { publicFileUrl } from '../utils/publicFileUrl'

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

const systemItems: SidebarItem[] = [
  { label: 'General Settings', path: '/system/general-settings', icon: Settings, permissions: ['manage_modules', 'modules.view'] },
]

const accessItems: SidebarItem[] = [
  {
    label: 'Users',
    path: '/users',
    icon: Users,
    permissions: ['users.view', 'view_users', 'manage_users', 'view_customers', 'view_students', 'view_teachers', 'view_staff'],
  },
  {
    label: 'Roles & Permissions',
    path: '/roles-permissions',
    icon: UserCog,
    permissions: ['view_roles', 'manage_roles', 'view_permissions'],
  },
  { label: 'Modules', path: '/modules', icon: Puzzle, permissions: ['modules.view', 'modules.manage', 'manage_modules'] },
  { label: 'Institution Requests', path: '/institution-requests', icon: Building2, permissions: ['institutions.view', 'institutions.create'] },
  { label: 'Roles', path: '/roles', icon: UserCog, permissions: ['roles.view', 'view_roles', 'manage_roles', 'roles.manage'] },
  { label: 'Permissions', path: '/permissions', icon: KeyRound, permissions: ['permissions.view', 'view_permissions', 'manage_roles', 'permissions.manage'] },
]

const moduleItems: ModuleItem[] = [
  { key: 'attendance', label: 'Attendance', path: '/attendance', icon: Clock },
  { key: 'results', label: 'Results', path: '/results', icon: Award },
  { key: 'fees', label: 'Fees & Payments', path: '/fees', icon: Wallet },
  { key: 'hr', label: 'HR & Payroll', path: '/hr', icon: CreditCard },
  { key: 'assets', label: 'Assets', path: '/assets', icon: Package },
  { key: 'hostel', label: 'Hostel', path: '/hostel', icon: Home },
  { key: 'canteen', label: 'Canteen', path: '/canteen', icon: UtensilsCrossed },
  { key: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell },
  { key: 'audit', label: 'Audit Logs', path: '/audit', icon: ScrollText },
]

const reportItems: SidebarItem[] = [
  { label: 'Student Report', path: '/reports/students', icon: GraduationCap, permissions: ['reports.view', 'reports.students.view', 'reports.manage', 'admissions.view', 'admissions.manage'] },
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
  const { institution, enabledModules, canAccess, hasPermission, hasAnyPermission, isAdmin, userRoles } = useAuth()
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
  const showTaskManager = safeEnabledModules.includes('tasks') && canAccess({
    permissions: ['tasks.view', 'tasks.create', 'tasks.assign', 'tasks.manage'],
  })
  const visibleReportItems = reportItems.filter((item) => canAccess({ permissions: item.permissions }))
  const showReports = safeEnabledModules.includes('reports') && visibleReportItems.length > 0
  const showContracts = safeEnabledModules.includes('contracts') && canAccess({
    permissions: ['contracts.view', 'contracts.manage', 'contracts.generate', 'contracts.templates.manage'],
  })
  const showDocumentWorkflow = safeEnabledModules.includes('document_workflow') && canAccess({
    permissions: ['documents.view', 'documents.manage', 'documents.generate', 'documents.types.view', 'documents.templates.manage'],
  })
  const timetablePermissions = MODULE_MENU_PERMISSIONS.timetable
  const showTimetable = safeEnabledModules.includes('timetable') && (
    isAdmin() ||
    userRoles.includes('super-admin') ||
    userRoles.includes('system-super-admin') ||
    hasAnyPermission(timetablePermissions)
  )
  const timetableActive = location.pathname.startsWith('/timetable')
  const showOperations = showTimesheetEmployee || showTimesheetAdmin || showTaskManager

  const canViewLetters = hasPermission('view_letters_menu') || hasPermission('create_letters')
  const canViewAnnouncements = hasPermission('view_announcements') || hasPermission('create_announcements')
  const showLettersModule = safeEnabledModules.includes('letters') && (canViewLetters || canViewAnnouncements)

  const showLibrary = safeEnabledModules.includes('library') && canAccess({
    permissions: ['view_library_menu', 'view_library_reports', 'borrow_books', 'approve_borrow_requests'],
  })

  const showAcademics = ['institutions', 'departments', 'academics'].some((key) => canUseModule(key))

  const showAdmissions = canUseModule('admissions') && canAccess({
    permissions: ['admissions.view', 'admissions.apply', 'admissions.manage', 'admissions.registry.review', 'admissions.department.review', 'admissions.registrar.admit', 'admissions.finance.verify', 'admissions.courses.register', 'admissions.hod.approve'],
  })

  const showCertificates = canUseModule('character_certificates') && canAccess({
    permissions: ['character_certificates.view', 'character_certificates.manage', 'character_certificates.issue'],
  })

  const visibleModuleItems = moduleItems.filter((item) => canUseModule(item.key))
  const showModulesSection = visibleModuleItems.length > 0

  const visibleSystemItems = systemItems.filter((item) => canAccess({ permissions: item.permissions }))
  const showSystemSection = visibleSystemItems.length > 0

  const [accessOpen, setAccessOpen] = useSidebarSection(false, ['/users', '/roles-permissions', '/roles', '/permissions', '/modules'])
  const [systemOpen, setSystemOpen] = useSidebarSection(false, ['/system'])
  const [operationsOpen, setOperationsOpen] = useSidebarSection(false, ['/timesheets', '/tasks'])
  const [reportsOpen, setReportsOpen] = useSidebarSection(false, ['/reports'])
  const [contractsOpen, setContractsOpen] = useSidebarSection(false, ['/contracts'])
  const [documentWorkflowOpen, setDocumentWorkflowOpen] = useSidebarSection(false, ['/document-workflow'])
  const [lettersOpen, setLettersOpen] = useSidebarSection(false, ['/letters'])
  const [modulesOpen, setModulesOpen] = useSidebarSection(false, visibleModuleItems.map((item) => item.path))

  const institutionName = institution?.name || 'School Management'
  const institutionSubtitle = institution?.acronym || ''

  const employeePath = '/timesheets/fill'
  const adminPath = '/timesheets/admin/reports'
  const academicsPath = '/institutions'
  const academicsActive = ['/institutions', '/departments', '/academics'].some((p) => location.pathname.startsWith(p))
  const admissionsActive = location.pathname.startsWith('/admissions')
  const certificatesActive = location.pathname.startsWith('/character-certificates')

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-[#1e3a5f] px-4 py-6 text-white">
      <div className="mb-6 shrink-0">
        {institution?.logo_url ? (
          <img src={publicFileUrl(institution.logo_url) || institution.logo_url} alt={institutionName} className="mb-3 h-12 w-auto max-w-full object-contain" />
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
                {showTaskManager && (
                  <NavLink to="/tasks" className={({ isActive }) => linkClass(isActive, true)}>
                    {({ isActive }) => (
                      <>
                        <CheckSquare className={iconClass(isActive)} aria-hidden="true" />
                        <span className="truncate">Task Manager</span>
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

        {showReports && (
          <>
            <button
              type="button"
              onClick={() => setReportsOpen((v) => !v)}
              className="mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <BarChart3 className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                Reports
              </span>
              <span className={`transition ${reportsOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {reportsOpen && (
              <div className="space-y-1">
                {visibleReportItems.map((item) => (
                  <SidebarLink key={item.path} item={item} nested />
                ))}
              </div>
            )}
          </>
        )}

        {showContracts && (
          <>
            <button
              type="button"
              onClick={() => setContractsOpen((v) => !v)}
              className="mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <FileStack className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                Contract Management
              </span>
              <span className={`transition ${contractsOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {contractsOpen && (
              <div className="space-y-1">
                <NavLink to="/contracts" end className={({ isActive }) => linkClass(isActive, true)}>
                  {({ isActive }) => (
                    <>
                      <BarChart3 className={iconClass(isActive)} aria-hidden="true" />
                      <span className="truncate">Dashboard</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/contracts/list" className={({ isActive }) => linkClass(isActive, true)}>
                  {({ isActive }) => (
                    <>
                      <FileStack className={iconClass(isActive)} aria-hidden="true" />
                      <span className="truncate">All Contracts</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/contracts/templates" className={({ isActive }) => linkClass(isActive, true)}>
                  {({ isActive }) => (
                    <>
                      <FileText className={iconClass(isActive)} aria-hidden="true" />
                      <span className="truncate">Templates</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/contracts/generate" className={({ isActive }) => linkClass(isActive, true)}>
                  {({ isActive }) => (
                    <>
                      <FileStack className={iconClass(isActive)} aria-hidden="true" />
                      <span className="truncate">Generate</span>
                    </>
                  )}
                </NavLink>
              </div>
            )}
          </>
        )}

        {showDocumentWorkflow && (
          <>
            <button
              type="button"
              onClick={() => setDocumentWorkflowOpen((v) => !v)}
              className="mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <ScrollText className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                Document Workflow
              </span>
              <span className={`transition ${documentWorkflowOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {documentWorkflowOpen && (
              <div className="space-y-1">
                {[
                  { to: '/document-workflow', label: 'Dashboard', icon: BarChart3, end: true },
                  { to: '/document-workflow/templates', label: 'Templates', icon: FileText },
                  { to: '/document-workflow/generate', label: 'Generate Document', icon: FileStack },
                  { to: '/document-workflow/pending-signatures', label: 'Pending Signatures', icon: FileText },
                  { to: '/document-workflow/pending-approvals', label: 'Pending Approvals', icon: FileText },
                  { to: '/document-workflow/completed', label: 'Completed Documents', icon: FileText },
                  { to: '/document-workflow/expired', label: 'Expired Documents', icon: ScrollText },
                  { to: '/document-workflow/types', label: 'Document Types', icon: Puzzle },
                  { to: '/document-workflow/settings', label: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => linkClass(isActive, true)}>
                      {({ isActive }) => (
                        <>
                          <Icon className={iconClass(isActive)} aria-hidden="true" />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  )
                })}
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

        {showTimetable && (
          <NavLink to="/timetable" className={() => linkClass(timetableActive)}>
            {() => (
              <>
                <CalendarDays className={iconClass(timetableActive)} aria-hidden="true" />
                <span className="truncate">Time Table</span>
              </>
            )}
          </NavLink>
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
            {() => (
              <>
                <GraduationCap className={iconClass(academicsActive)} aria-hidden="true" />
                <span className="truncate">Academics</span>
              </>
            )}
          </NavLink>
        )}

        {showAdmissions && (
          <NavLink to="/admissions" className={() => linkClass(admissionsActive)}>
            {() => (
              <>
                <GraduationCap className={iconClass(admissionsActive)} aria-hidden="true" />
                <span className="truncate">Admissions</span>
              </>
            )}
          </NavLink>
        )}

        {showCertificates && (
          <NavLink to="/character-certificates" className={() => linkClass(certificatesActive)}>
            {() => (
              <>
                <Award className={iconClass(certificatesActive)} aria-hidden="true" />
                <span className="truncate">Certificates</span>
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

        {showSystemSection && (
          <>
            <button
              type="button"
              onClick={() => setSystemOpen((v) => !v)}
              className="mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-blue-100 hover:bg-[#2a4a73]/70"
            >
              <span className="flex items-center gap-2.5">
                <Server className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
                System
              </span>
              <span className={`transition ${systemOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {systemOpen && visibleSystemItems.map((item) => (
              <SidebarLink key={item.path} item={item} nested />
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
