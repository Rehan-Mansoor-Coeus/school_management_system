import api from './client'

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  message?: string
}

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  return payload.data
}

export async function clockIn(payload?: { notes?: string; source?: string }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/attendance/clock-in', payload || {})
  return unwrapData(data)
}

export async function clockOut(payload?: { notes?: string }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/attendance/clock-out', payload || {})
  return unwrapData(data)
}

export async function fetchMyAttendanceRecords(params?: { from?: string; to?: string; per_page?: number; page?: number }) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/attendance/my-records', { params })
  return unwrapData(data)
}

export async function fetchAttendanceAdminReport(params?: { user_id?: number; from?: string; to?: string; per_page?: number; page?: number }) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/attendance/admin-report', { params })
  return unwrapData(data)
}

export async function fetchAttendanceMonthlySummary(month?: string) {
  const { data } = await api.get<ApiEnvelope<{ month: string; rows: any[] }>>('/attendance/monthly-summary', {
    params: month ? { month } : undefined,
  })
  return unwrapData(data)
}

export function formatAttendanceError(error: unknown, fallback = 'Unable to complete attendance request'): string {
  const payload = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
  if (payload?.errors) {
    const joined = Object.values(payload.errors).flat().filter(Boolean)
    if (joined.length > 0) {
      return joined.join(' ')
    }
  }
  return payload?.message || fallback
}
