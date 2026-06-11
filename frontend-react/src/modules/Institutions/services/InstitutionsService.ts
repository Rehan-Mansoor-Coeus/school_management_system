import api from '../../../api/client'
import type { Institution, InstitutionSettings, PaginatedResponse } from '../types'

export type InstitutionListParams = {
  search?: string
  type?: string
  country?: string
  page?: number
  per_page?: number
}

export async function fetchInstitutions(params: InstitutionListParams) {
  return api.get<PaginatedResponse<Institution>>('/institutions', { params })
}

export async function fetchInstitution(id: number) {
  return api.get<Institution>(`/institutions/${id}`)
}

export async function createInstitution(payload: FormData) {
  return api.post('/institutions', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export async function updateInstitution(id: number, payload: FormData) {
  return api.post(`/institutions/${id}?_method=PUT`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export async function deleteInstitution(id: number) {
  return api.delete(`/institutions/${id}`)
}

export async function fetchInstitutionSettings(id: number) {
  return api.get<InstitutionSettings>(`/institutions/${id}/settings`)
}

export async function updateInstitutionSettings(id: number, data: Partial<InstitutionSettings>) {
  return api.put(`/institutions/${id}/settings`, data)
}

export async function uploadInstitutionFile(id: number, kind: 'logo' | 'letterhead' | 'signature' | 'footer', file: File) {
  const form = new FormData()
  form.append('file', file)

  const endpointMap: Record<typeof kind, string> = {
    logo: `/institutions/${id}/upload-logo`,
    letterhead: `/institutions/${id}/upload-letterhead`,
    signature: `/institutions/${id}/upload-signature`,
    footer: `/institutions/${id}/upload-footer`,
  }

  return api.post(endpointMap[kind], form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

