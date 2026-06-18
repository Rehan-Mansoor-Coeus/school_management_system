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

export const fetchPosMenu = () => api.get('/canteen/pos/menu')
export const fetchPosPaymentMethods = () => api.get('/canteen/pos/payment-methods')
export const posCheckout = (payload: Record<string, unknown>) => api.post('/canteen/pos/checkout', payload)
export const confirmPosPayment = (orderId: number, payload: Record<string, unknown>) =>
  api.post(`/canteen/pos/orders/${orderId}/confirm`, payload)

export const fetchCanteenSales = (params?: Record<string, string | number | undefined>) =>
  api.get('/canteen/sales', { params })

export const fetchCanteenSale = (orderId: number) => api.get(`/canteen/sales/${orderId}`)

export async function downloadCanteenInvoice(orderId: number, filename?: string) {
  const res = await api.get(`/canteen/sales/${orderId}/invoice`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename || `canteen-invoice-${orderId}`}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function printCanteenReceipt(orderId: number) {
  const res = await api.get(`/canteen/sales/${orderId}/receipt`, {
    responseType: 'text',
    headers: { Accept: 'text/html' },
  })

  const printWindow = window.open('', '_blank', 'width=420,height=720')
  if (!printWindow) {
    throw new Error('Pop-up blocked. Allow pop-ups to print receipts.')
  }

  printWindow.document.open()
  printWindow.document.write(res.data)
  printWindow.document.close()
  printWindow.focus()
}

export function formatCanteenError(error: unknown, fallback: string): string {
  const payload = (error as { response?: { data?: { message?: string } } })?.response?.data
  return payload?.message || fallback
}
