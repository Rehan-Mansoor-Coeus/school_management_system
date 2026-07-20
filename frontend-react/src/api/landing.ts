import api from './client'

export type PublicSettings = {
  per_student_license_fee: number
  per_student_license_currency: string
  per_student_license_period: string
  per_student_license_label: string
  /** @deprecated Use per_student_license_* — kept for older clients */
  student_registration_fee?: number
  registration_fee_currency?: string
  registration_fee_period?: string
  registration_fee_label?: string
}

export type InstitutionPlatformSettings = {
  institution_id: number
  institution_name?: string
  student_registration_fee: number
  registration_fee_currency: string
  registration_fee_period: string
  currency?: string
}

export type PublicInstitutionSummary = {
  id: number
  name: string
  code?: string
  type?: string
  city?: string
  country?: string
  logo_url?: string | null
  currency?: string
  registration_fee?: { amount: number; currency: string; label: string }
  description?: string
}

export type PublicInstitutionDetail = {
  institution: PublicInstitutionSummary
  registration_fee: { amount: number; currency: string; label: string }
  programmes: Array<{ id: number; name: string; code?: string; description?: string; level?: string; registration_fee?: number }>
  courses: Array<{ id: number; name: string; code?: string; description?: string }>
  admission_requirements: string[]
}

export function fetchPublicSettings() {
  return api.get<PublicSettings>('/public/settings')
}

export function fetchPublicInstitutions(params?: { search?: string; page?: number; per_page?: number }) {
  return api.get('/public/institutions', { params })
}

export function fetchPublicInstitution(id: number) {
  return api.get<PublicInstitutionDetail>(`/public/institutions/${id}`)
}

export function fetchPublicProgrammeCourses(institutionId: number, programmeId: number) {
  return api.get<{ programme: { id: number; name: string; code?: string; level?: string; description?: string }; courses: Array<{ id: number; name: string; code?: string; description?: string; is_required?: boolean; semester?: { semester_number?: number; level_number?: number } | null }> }>(
    `/public/institutions/${institutionId}/programmes/${programmeId}/courses`,
  )
}

export function submitInstitutionRequest(payload: Record<string, unknown>) {
  return api.post('/public/institution-requests', payload)
}

export function submitSupportTicket(payload: Record<string, unknown>) {
  return api.post('/public/support-tickets', payload)
}

export function fetchGeneralSettings() {
  return api.get('/general-settings')
}

export function updateGeneralSettings(payload: Record<string, unknown>) {
  return api.put('/general-settings', payload)
}

export function fetchInstitutionPlatformSettings() {
  return api.get<InstitutionPlatformSettings>('/my-institution/platform-settings')
}

export function updateInstitutionPlatformSettings(payload: {
  student_registration_fee: number
  registration_fee_currency: string
  registration_fee_period?: string
}) {
  return api.put('/my-institution/platform-settings', payload)
}

export type InstitutionRequestHubTab = 'all' | 'awaiting' | 'pending_payment' | 'approved'

export type InstitutionRequestHubRow = {
  kind: 'request' | 'institution'
  id: number
  request_id?: number | null
  institution_id?: number | null
  name: string
  code?: string | null
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  country?: string | null
  student_population?: number | null
  status?: string | null
  is_active?: boolean
  license?: {
    license_status?: string
    payment_status?: string
    total_amount?: number
    amount_paid?: number
    balance?: number
    currency?: string
    plan_name?: string
    plan?: { name?: string; code?: string; license_type?: string }
    license_type?: string
  } | null
  created_at?: string | null
}

export type InstitutionRequestHubResponse = {
  data: InstitutionRequestHubRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  tab: InstitutionRequestHubTab
}

export function fetchInstitutionRequests(params?: { status?: string; page?: number }) {
  return api.get('/institution-requests', { params })
}

export function fetchInstitutionRequestsHub(params: {
  tab: InstitutionRequestHubTab
  page?: number
  search?: string
  per_page?: number
}) {
  return api.get<InstitutionRequestHubResponse>('/institution-requests/hub', { params })
}

export function approveInstitutionRequest(
  id: number,
  payload: { license_plan_id: number; admin_notes?: string; type?: string },
) {
  return api.post(`/institution-requests/${id}/approve`, payload)
}

export function rejectInstitutionRequest(id: number, admin_notes?: string) {
  return api.post(`/institution-requests/${id}/reject`, { admin_notes })
}
