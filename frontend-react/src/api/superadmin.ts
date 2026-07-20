import api from './client'

export type LicenseInfo = {
  plan: string
  status: string
  started_at: string | null
  expires_at: string | null
  max_users: number | null
  license_key: string | null
  is_expired: boolean
  days_remaining: number | null
}

export type SchoolStats = {
  total_users: number
  login_accounts: number
  students: number
  teachers: number
  staff: number
  admins: number
  modules_enabled: number
  applications_total: number
  programmes: number
  departments: number
}

export type SchoolSummary = {
  id: number
  name: string
  code: string
  type: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  is_active: boolean
  logo_url: string | null
  created_at: string | null
  license: LicenseInfo
  stats: SchoolStats
}

export type SchoolAdmin = {
  id: number
  name: string
  email: string
  username: string | null
  status: string | null
  roles: string[]
  created_at: string | null
}

export type PlatformOverview = {
  total_schools: number
  active_schools: number
  inactive_schools: number
  expired_licenses: number
  expiring_soon: number
  total_users: number
  total_login_accounts: number
  total_students: number
  plans: Record<string, number>
}

export type SchoolDetail = {
  institution: SchoolSummary
  license: LicenseInfo
  stats: SchoolStats
  admins: SchoolAdmin[]
  modules: { key: string; name: string; enabled: boolean }[]
}

export function fetchPlatformOverview() {
  return api.get<PlatformOverview>('/super-admin/overview')
}

export function fetchSchools(params?: { search?: string; status?: string }) {
  return api.get<{ data: SchoolSummary[] }>('/super-admin/schools', { params })
}

export function fetchSchool(id: number) {
  return api.get<SchoolDetail>(`/super-admin/schools/${id}`)
}

export function createSchool(payload: Record<string, unknown>) {
  return api.post('/super-admin/schools', payload)
}

export function updateSchoolLicense(id: number, payload: Record<string, unknown>) {
  return api.put(`/super-admin/schools/${id}/license`, payload)
}

export function createSchoolAdmin(id: number, payload: Record<string, unknown>) {
  return api.post(`/super-admin/schools/${id}/admins`, payload)
}

export function createSchoolStudent(id: number, payload: Record<string, unknown>) {
  return api.post(`/super-admin/schools/${id}/students`, payload)
}

export type InstitutionDashboard = {
  institution: SchoolSummary
  license: LicenseInfo
  stats: SchoolStats
}

export function fetchInstitutionDashboard() {
  return api.get<InstitutionDashboard>('/institution-dashboard')
}

export function switchIntoInstitution(id: number) {
  return api.post(`/super-admin/switch-institution/${id}`)
}

export function returnToPlatform() {
  return api.post('/super-admin/return-to-platform')
}
