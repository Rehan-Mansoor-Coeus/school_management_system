import type { AuthUser } from '../context/AuthContext'

export const ADMIN_ROLES = ['admin', 'institution-admin', 'super-admin'] as const

export const PLATFORM_SUPER_ADMIN_ROLES = ['super-admin', 'system-super-admin'] as const

export const ADMISSIONS_FULL_ACCESS_PERMISSIONS = [
  'admissions.manage',
  'admissions.view',
  'admissions.registry.review',
  'admissions.department.review',
  'admissions.registrar.admit',
  'admissions.finance.verify',
  'admissions.hod.approve',
] as const

export function isPlatformSuperAdminRole(roles: string[]): boolean {
  return roles.some((role) => PLATFORM_SUPER_ADMIN_ROLES.includes(role as (typeof PLATFORM_SUPER_ADMIN_ROLES)[number]))
}

export function hasFullAdmissionsAccess(userPermissions: string[], userRoles: string[]): boolean {
  if (isPlatformSuperAdminRole(userRoles)) return true
  if (userRoles.some((role) => ['institution-admin', 'admin'].includes(role))) return true
  return userPermissions.includes('admissions.manage')
}

export function filterAssignableRoles<T extends { name: string }>(roles: T[], userRoles: string[]): T[] {
  if (isPlatformSuperAdminRole(userRoles)) {
    return roles
  }

  return roles.filter((role) => !PLATFORM_SUPER_ADMIN_ROLES.includes(role.name as (typeof PLATFORM_SUPER_ADMIN_ROLES)[number]))
}

export function resolveUserRoles(user: AuthUser | null): string[] {
  if (!user || !Array.isArray(user.roles)) return []
  return user.roles
    .map((role) => (typeof role === 'string' ? role : role?.name))
    .filter((name): name is string => Boolean(name))
}

export function isAdminRole(roles: string[]): boolean {
  return roles.some((role) => ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]))
}

export function canAccessMenu(options: {
  permissions?: string[]
  roles?: string[]
  userPermissions: string[]
  userRoles: string[]
}): boolean {
  const { permissions = [], roles = [], userPermissions, userRoles } = options

  if (hasFullAdmissionsAccess(userPermissions, userRoles)) {
    const admissionsOnly = permissions.every((p) => p.startsWith('admissions.'))
    if (admissionsOnly && permissions.length > 0) return true
  }

  if (permissions.length > 0 && permissions.some((p) => userPermissions.includes(p))) return true
  if (roles.length > 0 && roles.some((r) => userRoles.includes(r))) return true
  return permissions.length === 0 && roles.length === 0
}

export const MODULE_MENU_PERMISSIONS: Record<string, string[]> = {
  admissions: [
    'admissions.apply',
    'admissions.view',
    'admissions.manage',
    'admissions.registry.review',
    'admissions.department.review',
    'admissions.registrar.admit',
    'admissions.finance.verify',
    'admissions.courses.register',
    'admissions.hod.approve',
  ],
  timesheets: [
    'view_timesheet_menu',
    'fill_timesheet',
    'create_timesheet_activity',
    'view_own_timesheet',
    'timesheets.view_own',
    'timesheets.manage',
    'view_all_timesheets',
    'timesheets.report',
    'timesheets.review',
  ],
  letters: ['view_letters_menu', 'create_letters', 'view_announcements', 'create_announcements'],
  academics: ['academics.view', 'academics.create', 'academics.edit', 'academics.delete', 'academics.manage'],
  institutions: ['institutions.view', 'institutions.create', 'institutions.edit'],
  departments: ['institutions.view', 'institutions.create', 'institutions.edit'],
  attendance: ['attendance.view', 'attendance.manage'],
  results: ['results.view', 'results.manage'],
  fees: ['fees.view', 'fees.manage', 'admissions.finance.verify'],
  hr: ['hr.view', 'hr.manage', 'hr.payroll.approve', 'hr.finance'],
  tasks: ['tasks.view', 'tasks.create', 'tasks.manage', 'tasks.assign'],
  tasks: ['tasks.view', 'tasks.create', 'tasks.assign', 'tasks.manage'],
  assets: ['assets.view', 'assets.manage'],
  library: ['library.view', 'library.manage'],
  hostel: ['hostel.view', 'hostel.manage', 'hostel.allocate', 'hostel.payments', 'hostel.maintenance', 'hostel.clearance'],
  canteen: ['canteen.view', 'canteen.manage', 'canteen.verify', 'canteen.reports'],
  character_certificates: [
    'character_certificates.view',
    'character_certificates.manage',
    'character_certificates.finance_clear',
    'character_certificates.library_clear',
    'character_certificates.issue',
  ],
  notifications: ['notifications.view', 'notifications.manage'],
  audit: ['audit.view', 'audit.manage'],
}

export const CHARACTER_CERT_STAFF_PERMISSIONS = [
  'character_certificates.manage',
  'character_certificates.issue',
  'character_certificates.finance_clear',
  'character_certificates.library_clear',
] as const

export function characterCertificatesHomePath(
  canAccess: (options: { permissions?: string[] }) => boolean,
): string {
  if (canAccess({ permissions: [...CHARACTER_CERT_STAFF_PERMISSIONS] })) {
    return '/character-certificates'
  }
  if (canAccess({ permissions: ['character_certificates.view'] })) {
    return '/character-certificates/my'
  }
  return '/'
}

export const ACCESS_CONTROL_PERMISSIONS = [
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  'view_users',
  'create_users',
  'edit_users',
  'delete_users',
  'manage_users',
  'roles.view',
  'roles.create',
  'roles.edit',
  'roles.delete',
  'roles.manage',
  'view_roles',
  'create_roles',
  'edit_roles',
  'delete_roles',
  'manage_roles',
  'permissions.view',
  'permissions.create',
  'permissions.edit',
  'permissions.delete',
  'permissions.manage',
  'view_permissions',
  'assign_permissions',
  'manage_modules',
  'modules.view',
  'view_students',
  'view_teachers',
  'view_staff',
  'view_customers',
]
