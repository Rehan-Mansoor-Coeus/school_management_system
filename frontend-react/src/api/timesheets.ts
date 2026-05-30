import api from './client'

// Categories
export const fetchTimesheetCategories = () => api.get('/timesheets/categories')
export const createTimesheetCategory = (payload: any) => api.post('/timesheets/categories', payload)
export const updateTimesheetCategory = (id: number, payload: any) => api.put(`/timesheets/categories/${id}`, payload)
export const deleteTimesheetCategory = (id: number) => api.delete(`/timesheets/categories/${id}`)

// Activities
export const fetchTimesheetActivities = (params?: any) => api.get('/timesheets/activities', { params })
export const createTimesheetActivity = (payload: any) => api.post('/timesheets/activities', payload)
export const updateTimesheetActivity = (id: number, payload: any) => api.put(`/timesheets/activities/${id}`, payload)
export const deleteTimesheetActivity = (id: number) => api.delete(`/timesheets/activities/${id}`)

// Working week
export const fetchWorkingWeek = (params?: any) => api.get('/timesheets/working-week', { params })
export const saveWorkingWeek = (payload: any) => api.post('/timesheets/working-week', payload)

// Entries
export const fetchTimesheetEntries = (params?: any) => api.get('/timesheets/entries', { params })
export const createTimesheetEntry = (payload: any) => api.post('/timesheets/entries', payload)
export const updateTimesheetEntry = (id: number, payload: any) => api.put(`/timesheets/entries/${id}`, payload)
export const deleteTimesheetEntry = (id: number) => api.delete(`/timesheets/entries/${id}`)

// Admin
export const fetchManageAllEntries = (params?: any) => api.get('/timesheets/admin/manage-all', { params })
export const approveTimesheetEntry = (id: number) => api.post(`/timesheets/admin/entries/${id}/approve`)
export const rejectTimesheetEntry = (id: number, payload?: any) => api.post(`/timesheets/admin/entries/${id}/reject`, payload)
export const fetchTimesheetAdminReport = (params: any) => api.get('/timesheets/admin/report', { params })
export const fetchOvertimeReport = (params: any) => api.get('/timesheets/admin/overtime-report', { params })

// Users list for filters
export const fetchUsers = () => api.get('/users')
