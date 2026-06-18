import api from './client'
import axios from 'axios'

const publicApi = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE || '/api',
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

export type ApiEnvelope<T> = { success: boolean; data: T; message?: string | null }

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    return (payload as ApiEnvelope<T>).data
  }
  return payload as T
}

export function formatContractError(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message || err?.message || fallback
}

export async function fetchContractDashboard() {
  const { data } = await api.get<ApiEnvelope<{ stats: Record<string, number>; charts: Record<string, unknown> }>>('/contracts/dashboard')
  return unwrap(data)
}

export async function fetchContracts(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get<ApiEnvelope<{ data: unknown[]; total?: number }>>('/contracts', { params })
  const body = unwrap(data)
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return body as { data: unknown[]; total?: number; current_page?: number }
  }
  return { data: Array.isArray(body) ? body : [], total: 0 }
}

export async function fetchContract(id: number) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/contracts/${id}`)
  return unwrap(data)
}

export async function fetchContractTemplates(params?: Record<string, string | undefined>) {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/contracts/templates', { params })
  return unwrap(data)
}

export async function createContractTemplate(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/contracts/templates', payload)
  return unwrap(data)
}

export async function updateContractTemplate(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/contracts/templates/${id}`, payload)
  return unwrap(data)
}

export async function cloneContractTemplate(id: number) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/contracts/templates/${id}/clone`)
  return unwrap(data)
}

export async function archiveContractTemplate(id: number) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/contracts/templates/${id}/archive`)
  return unwrap(data)
}

export async function generateContract(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/contracts/generate', payload)
  return unwrap(data)
}

export async function generateBulkContracts(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<unknown[]>>('/contracts/generate/bulk', payload)
  return unwrap(data)
}

export async function sendContract(id: number, payload?: { channels?: string[]; expires_days?: number }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/contracts/${id}/send`, payload || {})
  return unwrap(data)
}

export async function approveContract(id: number, comments?: string) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/contracts/${id}/approve`, { comments })
  return unwrap(data)
}

export async function rejectContract(id: number, reason: string) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/contracts/${id}/reject`, { reason })
  return unwrap(data)
}

export async function renewContract(id: number, payload: { start_date?: string; end_date?: string }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/contracts/${id}/renew`, payload)
  return unwrap(data)
}

export async function downloadContractPdf(id: number) {
  const response = await api.get(`/contracts/${id}/download`, { responseType: 'blob' })
  return response.data as Blob
}

// ---- Document Types ----

export async function fetchDocumentTypes(params?: Record<string, string | undefined>) {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/contracts/document-types', { params })
  return unwrap(data)
}

export async function fetchDocumentType(id: number) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/contracts/document-types/${id}`)
  return unwrap(data)
}

export async function createDocumentType(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/contracts/document-types', payload)
  return unwrap(data)
}

export async function updateDocumentType(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/contracts/document-types/${id}`, payload)
  return unwrap(data)
}

export async function deleteDocumentType(id: number) {
  const { data } = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/contracts/document-types/${id}`)
  return unwrap(data)
}

// ---- Document Workflow Settings (expiry alerts / license settings) ----

export type DocumentWorkflowSettings = {
  institution_id: number
  expiry_alerts_enabled: boolean
  expiry_alert_days: number[]
  expiry_alert_channels: string[]
  expiry_alert_recipients: string | null
}

export async function fetchDocumentSettings() {
  const { data } = await api.get<ApiEnvelope<DocumentWorkflowSettings>>('/contracts/settings')
  return unwrap(data)
}

export async function updateDocumentSettings(payload: Partial<DocumentWorkflowSettings>) {
  const { data } = await api.put<ApiEnvelope<DocumentWorkflowSettings>>('/contracts/settings', payload)
  return unwrap(data)
}

export async function verifyDocument(code: string) {
  const { data } = await publicApi.get<ApiEnvelope<Record<string, unknown>>>(`/contracts/verify/${code}`)
  return unwrap(data)
}

export async function fetchPublicContractSign(token: string) {
  const { data } = await publicApi.get<ApiEnvelope<Record<string, unknown>>>(`/contracts/sign/${token}`)
  return unwrap(data)
}

export async function submitPublicContractSign(payload: {
  token: string
  signature_data: string
  signer_fields?: Record<string, string>
  agreed: boolean
}) {
  const { data } = await publicApi.post<ApiEnvelope<Record<string, unknown>>>('/contracts/sign', payload)
  return data
}

export async function uploadPublicContractDocument(formData: FormData) {
  const { data } = await publicApi.post<ApiEnvelope<Record<string, unknown>>>('/contracts/sign/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
