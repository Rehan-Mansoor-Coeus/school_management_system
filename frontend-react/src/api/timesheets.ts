import api from './client'

function asList(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (Array.isArray(body.data)) return body.data
    if (Array.isArray(body.items)) return body.items
  }
  return []
}

function asPaginatedItems(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (Array.isArray(body.data)) return body.data
  }
  return []
}

export function formatTimesheetError(error: unknown, fallback = 'Unable to complete timesheet request'): string {
  const payload = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
  if (payload?.errors) {
    const joined = Object.values(payload.errors).flat().filter(Boolean)
    if (joined.length > 0) return joined.join(' ')
  }
  return payload?.message || fallback
}

// Categories
export async function fetchTimesheetCategories() {
  const { data } = await api.get('/timesheets/categories')
  return asList(data)
}

export async function createTimesheetCategory(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/categories', payload)
  return data
}

export async function updateTimesheetCategory(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put(`/timesheets/categories/${id}`, payload)
  return data
}

export async function deleteTimesheetCategory(id: number) {
  const { data } = await api.delete(`/timesheets/categories/${id}`)
  return data
}

// Activities
export async function fetchTimesheetActivities(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/activities', { params })
  return asList(data)
}

export async function createTimesheetActivity(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/activities', payload)
  return data
}

export async function updateTimesheetActivity(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put(`/timesheets/activities/${id}`, payload)
  return data
}

export async function deleteTimesheetActivity(id: number) {
  const { data } = await api.delete(`/timesheets/activities/${id}`)
  return data
}

// Working week
export async function fetchWorkingWeek(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/working-week', { params })
  const body = (data || {}) as { days?: unknown[]; summary?: Record<string, unknown> }
  return {
    days: Array.isArray(body.days) ? body.days : [],
    summary: body.summary || {},
  }
}

export async function saveWorkingWeek(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/working-week', payload)
  const body = (data || {}) as { days?: unknown[]; summary?: Record<string, unknown>; message?: string }
  return {
    days: Array.isArray(body.days) ? body.days : [],
    summary: body.summary || {},
    message: body.message,
  }
}

// Entries
export async function fetchTimesheetEntries(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/entries', { params })
  return asPaginatedItems(data)
}

export async function createTimesheetEntry(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/entries', payload)
  return data
}

export async function updateTimesheetEntry(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put(`/timesheets/entries/${id}`, payload)
  return data
}

export async function deleteTimesheetEntry(id: number) {
  const { data } = await api.delete(`/timesheets/entries/${id}`)
  return data
}

// Admin
export async function fetchManageAllEntries(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/admin/manage-all', { params })
  const body = (data || {}) as { entries?: unknown; total_hours?: number }
  return {
    entries: asPaginatedItems(body.entries),
    total_hours: body.total_hours ?? 0,
  }
}

export async function approveTimesheetEntry(id: number) {
  const { data } = await api.post(`/timesheets/admin/entries/${id}/approve`)
  return data
}

export async function rejectTimesheetEntry(id: number, payload?: Record<string, unknown>) {
  const { data } = await api.post(`/timesheets/admin/entries/${id}/reject`, payload)
  return data
}

export async function fetchTimesheetAdminReport(params: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/admin/report', { params })
  const body = (data || {}) as { reports?: unknown[] }
  return { reports: Array.isArray(body.reports) ? body.reports : [] }
}

export async function fetchOvertimeReport(params: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/admin/overtime-report', { params })
  const body = (data || {}) as { reports?: unknown[] }
  return { reports: Array.isArray(body.reports) ? body.reports : [] }
}

export async function fetchTimesheetDashboard() {
  const { data } = await api.get('/timesheets/dashboard')
  return data as Record<string, unknown>
}

export async function fetchUsers() {
  const { data } = await api.get('/users')
  return asList(data)
}

// Legacy weekly flow
export async function fetchMyTimesheets(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/mine', { params })
  return asList(data)
}

export async function createOrGetWeeklyTimesheet(payload: Record<string, unknown> | string) {
  const body = typeof payload === 'string' ? { week_start_date: payload } : payload
  const { data } = await api.post('/timesheets/weekly', body)
  return data
}

export async function addTimesheetEntry(timesheetId: number, payload: Record<string, unknown>) {
  const { data } = await api.post(`/timesheets/${timesheetId}/entries`, payload)
  return data
}

export async function submitTimesheet(timesheetId: number) {
  const { data } = await api.post(`/timesheets/${timesheetId}/submit`)
  return data
}

export async function fetchTimesheetReports(params: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/reports', { params })
  const body = (data || {}) as { rows?: unknown[] }
  return { rows: Array.isArray(body.rows) ? body.rows : asList(data) }
}

export async function fetchWorkingSchedules(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/schedules', { params })
  return asList(data)
}

export async function upsertWorkingSchedule(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/schedules', payload)
  return data
}

export async function fetchShiftTypes(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/shift-types', { params })
  return asList(data)
}

export async function createShiftType(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/shift-types', payload)
  return data
}

export async function updateShiftType(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put(`/timesheets/shift-types/${id}`, payload)
  return data
}

export async function fetchTimesheetReferences(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/references', { params })
  return data
}

export async function fetchTeacherAvailabilities(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/teacher-availabilities', { params })
  return asList(data)
}

export async function createTeacherAvailability(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/teacher-availabilities', payload)
  return data
}

export async function fetchStaffWorkSchedules(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/staff-work-schedules', { params })
  return asList(data)
}

export async function fetchCoursePlans(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/course-plans', { params })
  return asList(data)
}

export async function createCoursePlan(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/course-plans', payload)
  return data
}

export async function generateTimetableSuggestion(planId: number, payload?: Record<string, unknown>) {
  const { data } = await api.post(`/timesheets/course-plans/${planId}/suggest-timetable`, payload)
  return data
}

export async function acceptTimetableSuggestion(suggestionId: number) {
  const { data } = await api.post(`/timesheets/timetable-suggestions/${suggestionId}/accept`)
  return data
}

export async function fetchTeacherSchedules(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/teacher-schedules', { params })
  return asList(data)
}

export async function fetchMyTeachingSchedules(params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/my-teaching-schedules', { params })
  return asList(data)
}

export async function createTeacherSchedule(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/teacher-schedules', payload)
  return data
}

export async function submitTeachingEntry(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/teaching-entries', payload)
  return data
}

export async function submitStaffEntry(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/staff-entries', payload)
  return data
}

export async function fetchEntryApprovals() {
  const { data } = await api.get('/timesheets/entry-approvals')
  const body = (data || {}) as { teaching?: unknown[]; staff?: unknown[] }
  return {
    teaching: Array.isArray(body.teaching) ? body.teaching : [],
    staff: Array.isArray(body.staff) ? body.staff : [],
  }
}

export async function reviewTimesheetEntry(payload: Record<string, unknown>) {
  const { data } = await api.post('/timesheets/entry-approvals/review', payload)
  return data
}

export async function fetchExtendedReports(type: string, params?: Record<string, unknown>) {
  const { data } = await api.get('/timesheets/extended-reports', { params: { ...params, type } })
  const body = (data || {}) as { rows?: unknown[] }
  return { rows: Array.isArray(body.rows) ? body.rows : asList(data) }
}
