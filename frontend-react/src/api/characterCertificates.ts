import api from './client'

const base = '/character-certificates'

export const fetchCharacterCertificates = (params?: { search?: string; status?: string; page?: number }) =>
  api.get(base, { params })

export const fetchMyCharacterCertificates = () => api.get(`${base}/my`)

export const fetchCharacterCertificateReference = () => api.get(`${base}/reference`)

export const fetchCharacterCertificate = (id: number) => api.get(`${base}/${id}`)

export const createCharacterCertificate = (payload: Record<string, unknown>) => api.post(base, payload)

export const updateCharacterCertificate = (id: number, payload: Record<string, unknown>) => api.put(`${base}/${id}`, payload)

export const financeClearance = (id: number, payload: { cleared: boolean; notes?: string }) =>
  api.post(`${base}/${id}/finance-clearance`, payload)

export const libraryClearance = (id: number, payload: { cleared: boolean; notes?: string }) =>
  api.post(`${base}/${id}/library-clearance`, payload)

export const issueCharacterCertificate = (id: number) => api.post(`${base}/${id}/issue`)

export const voidCharacterCertificate = (id: number) => api.post(`${base}/${id}/void`)

export function characterCertificatePdfUrl(id: number): string {
  const apiBase = import.meta.env.VITE_API_URL || '/api'
  return `${apiBase}${base}/${id}/pdf`
}

export function formatCharacterCertError(error: unknown, fallback: string): string {
  const payload = (error as { response?: { data?: { message?: string } } })?.response?.data
  return payload?.message || fallback
}
