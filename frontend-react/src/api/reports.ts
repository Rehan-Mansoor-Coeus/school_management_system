import api from './client'

export type StudentReportSummary = {
  id: number
  registration_number: string
  status: string
  user?: { name?: string; email?: string }
  programme?: { name?: string; code?: string }
}

export type StudentReport = {
  student: Record<string, unknown>
  application: Record<string, unknown> | null
  fees: {
    total_billed: number
    total_paid: number
    total_owing: number
    application_payments: number
    invoices: unknown[]
  }
  registered_subjects: unknown[]
  results: unknown[]
}

function unwrap<T>(payload: { success?: boolean; data?: T } | T): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export async function searchStudentReports(query?: string) {
  const { data } = await api.get('/reports/students', { params: { q: query || undefined } })
  return unwrap<StudentReportSummary[]>(data)
}

export async function fetchStudentReport(studentId: number) {
  const { data } = await api.get(`/reports/students/${studentId}`)
  return unwrap<StudentReport>(data)
}
