import api from './client'

export type ApiEnvelope<T> = { success: boolean; data: T; message?: string | null }

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    return (payload as ApiEnvelope<T>).data
  }
  return payload as T
}

import { formatApiError } from '../../utils/apiError'

export function formatTimetableError(error: unknown, fallback: string): string {
  return formatApiError(error, fallback)
}

export const DAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
}

export const ROOM_TYPE_LABELS: Record<string, string> = {
  lecture_hall: 'Lecture Hall',
  laboratory: 'Laboratory',
  workshop: 'Workshop',
  computer_lab: 'Computer Lab',
  seminar_room: 'Seminar Room',
}

type Params = Record<string, string | number | boolean | undefined | null>

function clean(params?: Params) {
  if (!params) return undefined
  const out: Record<string, string | number | boolean> = {}
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out[k] = v
  })
  return out
}

// ---- Options ----
export type TimetableOptions = {
  teachers: Array<{ id: number; name: string; email?: string; department_id?: number | null }>
  departments: Array<{ id: number; name: string; code?: string }>
  programmes: Array<{ id: number; name: string; code?: string; department_id?: number | null }>
  programme_semesters: Array<{ id: number; programme_id: number; name: string; semester_number?: number; academic_year?: string | null }>
  classrooms: Array<{ id: number; name: string; room_type: string; capacity?: number }>
  courses: Array<{ id: number; code: string; name: string; department_id?: number | null; programme_id?: number | null; programme_semester_id?: number | null; contact_hours?: number }>
  room_types: string[]
}

export async function fetchTimetableOptions() {
  const { data } = await api.get<ApiEnvelope<TimetableOptions>>('/timetable/options')
  return unwrap(data)
}

// ---- Courses ----
export async function fetchCourses(params?: Params) {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/timetable/courses', { params: clean(params) })
  return unwrap(data)
}
export async function createCourse(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/timetable/courses', payload)
  return unwrap(data)
}
export async function updateCourse(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/timetable/courses/${id}`, payload)
  return unwrap(data)
}
export async function deleteCourse(id: number) {
  const { data } = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/timetable/courses/${id}`)
  return unwrap(data)
}

// ---- Assignments ----
export async function fetchAssignments(params?: Params) {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/timetable/assignments', { params: clean(params) })
  return unwrap(data)
}
export async function createAssignment(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/timetable/assignments', payload)
  return unwrap(data)
}
export async function updateAssignment(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/timetable/assignments/${id}`, payload)
  return unwrap(data)
}
export async function deleteAssignment(id: number) {
  const { data } = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/timetable/assignments/${id}`)
  return unwrap(data)
}

// ---- Classrooms ----
export async function fetchClassrooms(params?: Params) {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/timetable/classrooms', { params: clean(params) })
  return unwrap(data)
}
export async function createClassroom(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/timetable/classrooms', payload)
  return unwrap(data)
}
export async function updateClassroom(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/timetable/classrooms/${id}`, payload)
  return unwrap(data)
}
export async function deleteClassroom(id: number) {
  const { data } = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/timetable/classrooms/${id}`)
  return unwrap(data)
}

// ---- Availability ----
export async function fetchAvailability(teacherId: number) {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/timetable/availability', { params: { teacher_id: teacherId } })
  return unwrap(data)
}
export async function saveAvailability(payload: { teacher_id: number; days: Array<{ day_of_week: number; is_available: boolean; start_time?: string | null; end_time?: string | null }> }) {
  const { data } = await api.post<ApiEnvelope<unknown[]>>('/timetable/availability', payload)
  return unwrap(data)
}

// ---- Workload ----
export type WorkloadRow = {
  teacher_id: number
  teacher_name: string
  courses: Array<{ assignment_id: number; course_id: number; code?: string; name?: string; expected_contact_hours: number; completed_contact_hours: number }>
  course_count: number
  expected_hours: number
  completed_hours: number
  remaining_hours: number
  weekly_hours: number
  max_weekly_hours: number
  over_limit: boolean
}
export async function fetchWorkload(params?: Params) {
  const { data } = await api.get<ApiEnvelope<WorkloadRow[]>>('/timetable/workload', { params: clean(params) })
  return unwrap(data)
}

// ---- Timetable entries ----
export async function fetchEntries(params?: Params) {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/timetable/entries', { params: clean(params) })
  return unwrap(data)
}
export async function createEntry(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/timetable/entries', payload)
  return data
}
export async function updateEntry(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/timetable/entries/${id}`, payload)
  return data
}
export async function deleteEntry(id: number) {
  const { data } = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/timetable/entries/${id}`)
  return unwrap(data)
}
export async function approveEntry(id: number, status = 'approved') {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/timetable/entries/${id}/approve`, { status })
  return unwrap(data)
}
export async function checkConflicts(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<{ conflicts: Array<{ type: string; message: string; entry_id: number }> }>>('/timetable/entries/check-conflicts', payload)
  return unwrap(data)
}
export async function generateTimetable(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<{ created: number; entries: number[]; unscheduled: Array<Record<string, unknown>>; message: string }>>('/timetable/generate', payload)
  return unwrap(data)
}

// ---- Lesson logs ----
export async function fetchLessons(params?: Params) {
  const { data } = await api.get<ApiEnvelope<unknown[]>>('/timetable/lessons', { params: clean(params) })
  return unwrap(data)
}
export async function createLesson(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/timetable/lessons', payload)
  return unwrap(data)
}
export async function deleteLesson(id: number) {
  const { data } = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/timetable/lessons/${id}`)
  return unwrap(data)
}

// ---- Student timetable ----
export async function fetchMyTimetable(params?: Params) {
  const { data } = await api.get<ApiEnvelope<{ student: unknown; entries: unknown[]; message?: string }>>('/timetable/student/me', { params: clean(params) })
  return unwrap(data)
}

// ---- Reports ----
export type TimetableReport = {
  type: string
  title: string
  columns: Array<{ key: string; label: string }>
  rows: Array<Record<string, unknown>>
}
export async function fetchReport(params: Params) {
  const { data } = await api.get<ApiEnvelope<TimetableReport>>('/timetable/reports', { params: clean(params) })
  return unwrap(data)
}
export async function downloadReport(params: Params, format: 'pdf' | 'csv') {
  const response = await api.get('/timetable/reports', { params: { ...clean(params), format }, responseType: 'blob' })
  return response.data as Blob
}

// ---- Settings ----
export type TimetableSettings = {
  institution_id: number
  max_weekly_teaching_hours: number
  default_lesson_minutes: number
  weeks_per_semester: number
  day_start_time: string
  day_end_time: string
  working_days: number[]
  require_dean_approval: boolean
}
export async function fetchTimetableSettings() {
  const { data } = await api.get<ApiEnvelope<TimetableSettings>>('/timetable/settings')
  return unwrap(data)
}
export async function updateTimetableSettings(payload: Partial<TimetableSettings>) {
  const { data } = await api.put<ApiEnvelope<TimetableSettings>>('/timetable/settings', payload)
  return unwrap(data)
}
