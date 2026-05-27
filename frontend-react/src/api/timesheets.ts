import api from './client'

export const fetchTimesheetActivities = () => api.get('/timesheets/activities')
export const createTimesheetActivity = (payload: any) => api.post('/timesheets/activities', payload)

export const fetchMyTimesheets = () => api.get('/timesheets/mine')
export const createOrGetWeeklyTimesheet = (week_start_date: string) =>
  api.post('/timesheets/weekly', { week_start_date })
export const addTimesheetEntry = (timesheetId: number, payload: any) =>
  api.post(`/timesheets/${timesheetId}/entries`, payload)
export const submitTimesheet = (timesheetId: number) => api.post(`/timesheets/${timesheetId}/submit`)

export const fetchTimesheetApprovals = (status?: string) =>
  api.get('/timesheets/approvals', { params: status ? { status } : {} })
export const approveTimesheet = (timesheetId: number) => api.post(`/timesheets/${timesheetId}/approve`)
export const rejectTimesheet = (timesheetId: number, reason: string) =>
  api.post(`/timesheets/${timesheetId}/reject`, { reason })
export const requestCorrection = (timesheetId: number, reason: string) =>
  api.post(`/timesheets/${timesheetId}/request-correction`, { reason })

export const fetchTimesheetReports = (params: { range: 'weekly' | 'monthly'; from: string; to: string }) =>
  api.get('/timesheets/reports', { params })

export const fetchWorkingSchedules = (staff_id?: number) =>
  api.get('/timesheets/schedules', { params: staff_id ? { staff_id } : {} })
export const upsertWorkingSchedule = (payload: any) => api.post('/timesheets/schedules', payload)

export const fetchTimesheetDashboard = () => api.get('/timesheets/dashboard')

export const fetchShiftTypes = () => api.get('/timesheets/shift-types')
export const createShiftType = (payload: any) => api.post('/timesheets/shift-types', payload)
export const updateShiftType = (id: number, payload: any) => api.put(`/timesheets/shift-types/${id}`, payload)

export const fetchTimesheetReferences = () => api.get('/timesheets/references')
export const createTimesheetReference = (payload: any) => api.post('/timesheets/references', payload)

export const fetchTeacherAvailabilities = (teacher_id?: number) =>
  api.get('/timesheets/teacher-availabilities', { params: teacher_id ? { teacher_id } : {} })
export const createTeacherAvailability = (payload: any) => api.post('/timesheets/teacher-availabilities', payload)
export const fetchAvailableTeachers = (params: any) => api.get('/timesheets/available-teachers', { params })

export const fetchStaffWorkSchedules = (staff_id?: number) =>
  api.get('/timesheets/staff-work-schedules', { params: staff_id ? { staff_id } : {} })
export const createStaffWorkSchedule = (payload: any) => api.post('/timesheets/staff-work-schedules', payload)

export const fetchCoursePlans = () => api.get('/timesheets/course-plans')
export const createCoursePlan = (payload: any) => api.post('/timesheets/course-plans', payload)
export const generateTimetableSuggestion = (planId: number) =>
  api.post(`/timesheets/course-plans/${planId}/suggest-timetable`)
export const acceptTimetableSuggestion = (suggestionId: number, payload: any) =>
  api.post(`/timesheets/timetable-suggestions/${suggestionId}/accept`, payload)

export const fetchTeacherSchedules = (params?: any) => api.get('/timesheets/teacher-schedules', { params })
export const fetchMyTeachingSchedules = () => api.get('/timesheets/my-teaching-schedules')
export const createTeacherSchedule = (payload: any) => api.post('/timesheets/teacher-schedules', payload)

export const fetchTeachingEntries = () => api.get('/timesheets/teaching-entries')
export const submitTeachingEntry = (payload: any) => api.post('/timesheets/teaching-entries', payload)
export const fetchStaffEntries = () => api.get('/timesheets/staff-entries')
export const submitStaffEntry = (payload: any) => api.post('/timesheets/staff-entries', payload)

export const fetchEntryApprovals = () => api.get('/timesheets/entry-approvals')
export const reviewTimesheetEntry = (payload: any) => api.post('/timesheets/entry-approvals/review', payload)

export const fetchExtendedReports = (type: string) => api.get('/timesheets/extended-reports', { params: { type } })

export const fetchTimesheetNotifications = () => api.get('/timesheets/notifications')
