import api from './client'

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  message?: string | null
}

export type TaskQueryParams = Record<string, string | number | boolean | undefined>

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  return payload.data
}

function unwrapPaginatedList(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (Array.isArray(body.data)) return body.data
  }
  return []
}

export async function fetchTasks(params?: TaskQueryParams) {
  const { data } = await api.get<ApiEnvelope<unknown>>('/tasks', { params })
  return unwrapPaginatedList(unwrapData(data))
}

export async function fetchTask(id: number) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/tasks/${id}`)
  return unwrapData(data)
}

export async function createTask(payload: Record<string, unknown> | FormData) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/tasks', payload)
  return unwrapData(data)
}

export async function updateTask(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/tasks/${id}`, payload)
  return unwrapData(data)
}

export async function deleteTask(id: number) {
  const { data } = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/tasks/${id}`)
  return unwrapData(data)
}

export async function fetchMyTasks(params?: TaskQueryParams) {
  const { data } = await api.get<ApiEnvelope<unknown>>('/tasks/my/list', { params })
  return unwrapPaginatedList(unwrapData(data))
}

export async function fetchPendingTaskAcceptances() {
  const { data } = await api.get<ApiEnvelope<any[]>>('/tasks/pending/acceptances')
  return unwrapData(data)
}

export async function updateTaskAssignmentProgress(assignmentId: number, payload: Record<string, unknown> | FormData) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/tasks/assignments/${assignmentId}/progress`, payload)
  return unwrapData(data)
}

export async function fetchTaskCategories() {
  const { data } = await api.get<ApiEnvelope<any[]>>('/tasks/settings/categories')
  return unwrapData(data)
}

export async function createTaskCategory(payload: { name: string; description?: string }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/tasks/settings/categories', payload)
  return unwrapData(data)
}

export async function updateTaskCategory(id: number, payload: { name?: string; description?: string }) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/tasks/settings/categories/${id}`, payload)
  return unwrapData(data)
}

export async function deleteTaskCategory(id: number) {
  const { data } = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/tasks/settings/categories/${id}`)
  return unwrapData(data)
}

export async function fetchTaskTemplates() {
  const { data } = await api.get<ApiEnvelope<any[]>>('/tasks/settings/templates')
  return unwrapData(data)
}

export async function createTaskTemplate(payload: { name: string; subject?: string; body?: string }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/tasks/settings/templates', payload)
  return unwrapData(data)
}

export async function updateTaskTemplate(id: number, payload: { name?: string; subject?: string; body?: string }) {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>(`/tasks/settings/templates/${id}`, payload)
  return unwrapData(data)
}

export async function deleteTaskTemplate(id: number) {
  const { data } = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/tasks/settings/templates/${id}`)
  return unwrapData(data)
}

export async function notifyTaskAssignment(payload: { assignment_id: number; template?: string }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/tasks/workflow/notify-assignment', payload)
  return unwrapData(data)
}

export async function syncOverdueTasks() {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/tasks/workflow/sync-overdue')
  return unwrapData(data)
}

export async function processScheduledTasks() {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/tasks/workflow/process-scheduled')
  return unwrapData(data)
}

export async function processTaskReminders() {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/tasks/workflow/process-reminders')
  return unwrapData(data)
}

export async function fetchTaskInvite(token: string) {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/tasks/invite/${encodeURIComponent(token)}`)
  return unwrapData(data)
}

export async function respondTaskInvite(payload: { token: string; action: 'accept' | 'decline' }) {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/tasks/invite/respond', payload)
  return data
}

export function formatTaskError(error: unknown, fallback = 'Unable to complete task request'): string {
  const payload = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
  if (payload?.errors) {
    const joined = Object.values(payload.errors).flat().filter(Boolean)
    if (joined.length > 0) {
      return joined.join(' ')
    }
  }
  return payload?.message || fallback
}
