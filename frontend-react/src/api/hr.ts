import api from './client'

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  message?: string
}

export type QueryParams = Record<string, string | number | boolean | undefined>

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  return payload.data
}

export async function fetchHrDashboard() {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/hr/dashboard')
  return unwrapData(data)
}

export async function fetchHrStaff(params?: QueryParams) {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/staff', { params })
  return unwrapData(data)
}

export async function fetchNextStaffCode() {
  const { data } = await api.get<ApiEnvelope<{ staff_code: string }>>('/hr/staff/next-code')
  return unwrapData(data)
}

export async function fetchHrStaffMember(id: number) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/hr/staff/${id}`)
  return unwrapData(data)
}

export async function createHrStaff(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/staff', payload)
  return unwrapData(data)
}

export async function updateHrStaff(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/hr/staff/${id}`, payload)
  return unwrapData(data)
}

export async function searchHrUsers(query: string) {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/users/search', { params: { q: query } })
  return {
    users: data.data,
    nextStaffCode: (data as { next_staff_code?: string }).next_staff_code,
  }
}

export async function fetchHrCategories() {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/categories')
  return unwrapData(data)
}

export async function createHrCategory(payload: { name: string; code?: string; description?: string }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/categories', payload)
  return unwrapData(data)
}

export async function updateHrCategory(id: number, payload: { name?: string; description?: string; is_active?: boolean }) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/hr/categories/${id}`, payload)
  return unwrapData(data)
}

export async function deleteHrCategory(id: number) {
  const { data } = await api.delete<ApiEnvelope<boolean>>(`/hr/categories/${id}`)
  return unwrapData(data)
}

export async function fetchHrPositionRates() {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/position-rates')
  return unwrapData(data)
}

export async function createHrPositionRate(payload: { position: string; daily_rate: number }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/position-rates', payload)
  return unwrapData(data)
}

export async function updateHrPositionRate(id: number, payload: { position?: string; daily_rate?: number; is_active?: boolean }) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/hr/position-rates/${id}`, payload)
  return unwrapData(data)
}

export async function deleteHrPositionRate(id: number) {
  const { data } = await api.delete<ApiEnvelope<boolean>>(`/hr/position-rates/${id}`)
  return unwrapData(data)
}

export async function fetchHrAllowanceTypes() {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/allowance-types')
  return unwrapData(data)
}

export async function createHrAllowanceType(payload: { name: string; code?: string; default_amount?: number }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/allowance-types', payload)
  return unwrapData(data)
}

export async function updateHrAllowanceType(id: number, payload: { name?: string; default_amount?: number; is_active?: boolean }) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/hr/allowance-types/${id}`, payload)
  return unwrapData(data)
}

export async function deleteHrAllowanceType(id: number) {
  const { data } = await api.delete<ApiEnvelope<boolean>>(`/hr/allowance-types/${id}`)
  return unwrapData(data)
}

export async function fetchHrDeductionTypes() {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/deduction-types')
  return unwrapData(data)
}

export async function createHrDeductionType(payload: { name: string; code?: string; default_amount?: number }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/deduction-types', payload)
  return unwrapData(data)
}

export async function updateHrDeductionType(id: number, payload: { name?: string; default_amount?: number; is_active?: boolean }) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/hr/deduction-types/${id}`, payload)
  return unwrapData(data)
}

export async function deleteHrDeductionType(id: number) {
  const { data } = await api.delete<ApiEnvelope<boolean>>(`/hr/deduction-types/${id}`)
  return unwrapData(data)
}

export async function fetchHrJobs(params?: QueryParams) {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/jobs', { params })
  return unwrapData(data)
}

export async function fetchHrJobDetail(id: number) {
  const { data } = await api.get<ApiEnvelope<{ job: Record<string, unknown>; staff: any[] }>>(`/hr/jobs/${id}`)
  return unwrapData(data)
}

export async function createHrJob(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/jobs', payload)
  return unwrapData(data)
}

export async function updateHrJob(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/hr/jobs/${id}`, payload)
  return unwrapData(data)
}

export async function assignHrJobStaff(id: number, payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/hr/jobs/${id}/staff`, payload)
  return unwrapData(data)
}

export async function updateHrJobStaff(jobId: number, rowId: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/hr/jobs/${jobId}/staff/${rowId}`, payload)
  return unwrapData(data)
}

export async function removeHrJobStaff(jobId: number, rowId: number) {
  const { data } = await api.delete<ApiEnvelope<boolean>>(`/hr/jobs/${jobId}/staff/${rowId}`)
  return unwrapData(data)
}

export async function syncHrJobTimesheet(id: number) {
  const { data } = await api.post<ApiEnvelope<{ updated: number }>>(`/hr/jobs/${id}/sync-timesheet`)
  return unwrapData(data)
}

export async function fetchHrPayrollRuns(params?: QueryParams) {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/payroll-runs', { params })
  return unwrapData(data)
}

export async function fetchHrPayrollRun(id: number) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/hr/payroll-runs/${id}`)
  return unwrapData(data)
}

export async function createHrPayrollFromJob(jobId: number) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/hr/payroll-runs/from-job/${jobId}`)
  return unwrapData(data)
}

export async function createHrMonthlyPayroll(payload: { period_start: string; period_end: string; title?: string }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/payroll-runs/monthly', payload)
  return unwrapData(data)
}

export async function updateHrPayrollItem(runId: number, itemId: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/hr/payroll-runs/${runId}/items/${itemId}`, payload)
  return unwrapData(data)
}

export async function submitHrPayrollReview(id: number, notes?: string) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/hr/payroll-runs/${id}/submit-review`, { notes })
  return unwrapData(data)
}

export async function approveHrPayroll(id: number, notes?: string) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/hr/payroll-runs/${id}/approve`, { notes })
  return unwrapData(data)
}

export async function forwardHrPayrollToFinance(id: number, notes?: string) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/hr/payroll-runs/${id}/forward-finance`, { notes })
  return unwrapData(data)
}

export async function rejectHrPayroll(id: number, notes?: string) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/hr/payroll-runs/${id}/reject`, { notes })
  return unwrapData(data)
}

export async function fetchHrPayslips() {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/payslips')
  return unwrapData(data)
}

export async function generateHrPayslip(itemId: number) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/hr/payslips/generate/${itemId}`)
  return unwrapData(data)
}

export async function fetchHrPayslipDetail(itemId: number) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/hr/payslips/detail/${itemId}`)
  return unwrapData(data)
}

export async function verifyHrPayslip(code: string) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/hr/payslips/verify/${encodeURIComponent(code)}`)
  return unwrapData(data)
}

export async function fetchHrFinanceItems(params?: QueryParams) {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/finance', { params })
  return unwrapData(data)
}

export async function updateHrFinanceItem(id: number, payload: { status: string; amount?: number; notes?: string }) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/hr/finance/${id}`, payload)
  return unwrapData(data)
}

export async function fetchHrAdvances(params?: QueryParams) {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/advances', { params })
  return unwrapData(data)
}

export async function createHrAdvance(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/advances', payload)
  return unwrapData(data)
}

export async function fetchHrSummaryReport(month?: string) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/hr/reports/summary', { params: month ? { month } : undefined })
  return unwrapData(data)
}

export async function fetchHrStaffHistory(staffId: number) {
  const { data } = await api.get<ApiEnvelope<any[]>>(`/hr/reports/staff-history/${staffId}`)
  return unwrapData(data)
}

export async function fetchHrTimesheets(params?: QueryParams) {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/timesheet', { params })
  return unwrapData(data)
}

export async function createHrTimesheetEntry(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/timesheet', payload)
  return unwrapData(data)
}

export async function fetchHrLetterTemplates(params?: QueryParams) {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/letters/templates', { params })
  return unwrapData(data)
}

export async function createHrLetterTemplate(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/letters/templates', payload)
  return unwrapData(data)
}

export async function updateHrLetterTemplate(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/hr/letters/templates/${id}`, payload)
  return unwrapData(data)
}

export async function deleteHrLetterTemplate(id: number) {
  const { data } = await api.delete<ApiEnvelope<boolean>>(`/hr/letters/templates/${id}`)
  return unwrapData(data)
}

export async function previewHrLetter(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/letters/preview', payload)
  return unwrapData(data)
}

export async function sendHrLetter(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/hr/letters/send', payload)
  return unwrapData(data)
}

export async function fetchHrLetterHistory(params?: QueryParams) {
  const { data } = await api.get<ApiEnvelope<any[]>>('/hr/letters/history', { params })
  return unwrapData(data)
}

export function formatHrError(error: unknown, fallback = 'Unable to complete HR request'): string {
  const payload = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
  if (payload?.errors) {
    const joined = Object.values(payload.errors).flat().filter(Boolean)
    if (joined.length > 0) {
      return joined.join(' ')
    }
  }
  return payload?.message || fallback
}
