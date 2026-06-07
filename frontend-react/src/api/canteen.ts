import api from './client'

export const fetchCanteenDashboard = () => api.get('/canteen/dashboard')
export const fetchCanteenMeals = (params?: { active_only?: boolean }) => api.get('/canteen/meals', { params })
export const createCanteenMeal = (payload: Record<string, unknown>) => api.post('/canteen/meals', payload)
export const updateCanteenMeal = (id: number, payload: Record<string, unknown>) => api.put(`/canteen/meals/${id}`, payload)
export const deleteCanteenMeal = (id: number) => api.delete(`/canteen/meals/${id}`)

export const fetchFeedingPlans = (params?: { active_only?: boolean }) => api.get('/canteen/feeding-plans', { params })
export const fetchFeedingPlanReference = () => api.get('/canteen/feeding-plans/reference')
export const createFeedingPlan = (payload: Record<string, unknown>) => api.post('/canteen/feeding-plans', payload)
export const updateFeedingPlan = (id: number, payload: Record<string, unknown>) => api.put(`/canteen/feeding-plans/${id}`, payload)
export const deleteFeedingPlan = (id: number) => api.delete(`/canteen/feeding-plans/${id}`)

export const fetchCanteenWallets = (params?: { search?: string; page?: number }) => api.get('/canteen/wallets', { params })
export const fetchMyCanteenWallet = () => api.get('/canteen/wallets/my')
export const topUpWallet = (walletId: number, payload: { amount: number; notes?: string }) =>
  api.post(`/canteen/wallets/${walletId}/top-up`, payload)
export const ensureStudentWallet = (studentId: number) => api.post(`/canteen/wallets/student/${studentId}`)

export const fetchCanteenStudents = (params?: { search?: string }) => api.get('/canteen/students', { params })
export const fetchSubscriptions = (params?: { status?: string; page?: number }) => api.get('/canteen/subscriptions', { params })
export const fetchMySubscriptions = () => api.get('/canteen/subscriptions/my')
export const createSubscription = (payload: Record<string, unknown>) => api.post('/canteen/subscriptions', payload)

export const lookupStudentMeal = (code: string) => api.post('/canteen/verify/lookup', { code })
export const serveStudentMeal = (payload: Record<string, unknown>) => api.post('/canteen/verify/serve', payload)

export const fetchMealAttendance = (params?: Record<string, string | number>) => api.get('/canteen/attendance', { params })
export const voidMealAttendance = (id: number) => api.post(`/canteen/attendance/${id}/void`)

export const fetchCanteenReport = (params?: { date_from?: string; date_to?: string }) =>
  api.get('/canteen/reports/summary', { params })

export function formatCanteenError(error: unknown, fallback: string): string {
  const payload = (error as { response?: { data?: { message?: string } } })?.response?.data
  return payload?.message || fallback
}
