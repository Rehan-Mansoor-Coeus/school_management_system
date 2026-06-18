import api from './client'

export type AuditLogRow = {
  id: string
  source: string
  action: string
  summary: string
  user_id?: number | null
  user_name: string
  user_email?: string | null
  model_type?: string | null
  model_id?: number | null
  ip_address?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
}

export type AuditLogsResponse = {
  items: AuditLogRow[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

function unwrap<T>(payload: any): T {
  if (payload && payload.success && payload.data !== undefined) return payload.data as T
  return payload as T
}

export async function fetchAuditLogs(params?: {
  search?: string
  source?: string
  action?: string
  page?: number
  per_page?: number
}): Promise<AuditLogsResponse> {
  const { data } = await api.get('/audit/logs', { params })
  return unwrap<AuditLogsResponse>(data)
}

export function formatAuditError(error: unknown, fallback = 'Request failed'): string {
  const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } ; message?: string }
  if (err.response?.data?.message) return err.response.data.message
  const errors = err.response?.data?.errors
  if (errors) {
    const first = Object.values(errors)[0]
    if (Array.isArray(first) && first[0]) return first[0]
  }
  return err.message || fallback
}
