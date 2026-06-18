const STAFF_VIEW_PERMISSIONS = [
  'admissions.view',
  'admissions.manage',
  'admissions.registry.review',
  'admissions.department.review',
  'admissions.finance.verify',
  'admissions.registrar.admit',
  'admissions.hod.approve',
] as const

const STAFF_VIEW_ROLES = [
  'registry',
  'hod',
  'head-of-department',
  'registrar',
  'finance-officer',
  'admin',
  'institution-admin',
  'super-admin',
  'system-super-admin',
] as const

export function canViewApplicationDetails(
  canAccess: (options: { permissions?: string[]; roles?: string[] }) => boolean
) {
  return canAccess({
    permissions: [...STAFF_VIEW_PERMISSIONS],
    roles: [...STAFF_VIEW_ROLES],
  })
}
