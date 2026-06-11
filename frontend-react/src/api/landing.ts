import api from './client'

export type PublicSettings = {
  student_registration_fee: number
  registration_fee_currency: string
  registration_fee_period: string
  registration_fee_label: string
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

export function fetchInstitutionRequests(params?: { status?: string; page?: number }) {
  return api.get('/institution-requests', { params })
}

export function approveInstitutionRequest(id: number, admin_notes?: string) {
  return api.post(`/institution-requests/${id}/approve`, { admin_notes })
}

export function rejectInstitutionRequest(id: number, admin_notes?: string) {
  return api.post(`/institution-requests/${id}/reject`, { admin_notes })
}
