import api from './client'

export const fetchHostelDashboard = () => api.get('/hostel/dashboard')
export const fetchHostelReference = () => api.get('/hostel/reference')
export const fetchHostelStudents = (params?: { search?: string }) => api.get('/hostel/students', { params })

export const fetchHostels = (params?: { active_only?: boolean }) => api.get('/hostel/hostels', { params })
export const createHostel = (payload: Record<string, unknown>) => api.post('/hostel/hostels', payload)
export const updateHostel = (id: number, payload: Record<string, unknown>) => api.put(`/hostel/hostels/${id}`, payload)
export const deleteHostel = (id: number) => api.delete(`/hostel/hostels/${id}`)

export const fetchRooms = (params?: { hostel_id?: number; status?: string }) => api.get('/hostel/rooms', { params })
export const createRoom = (payload: Record<string, unknown>) => api.post('/hostel/rooms', payload)
export const updateRoom = (id: number, payload: Record<string, unknown>) => api.put(`/hostel/rooms/${id}`, payload)
export const deleteRoom = (id: number) => api.delete(`/hostel/rooms/${id}`)

export const fetchRegistrations = (params?: { status?: string; page?: number }) => api.get('/hostel/registrations', { params })
export const fetchMyRegistration = () => api.get('/hostel/registrations/my')
export const createRegistration = (payload: Record<string, unknown>) => api.post('/hostel/registrations', payload)
export const reviewRegistration = (id: number, payload: { status: string; notes?: string }) =>
  api.post(`/hostel/registrations/${id}/review`, payload)

export const fetchAllocations = (params?: { status?: string; hostel_id?: number; page?: number }) =>
  api.get('/hostel/allocations', { params })
export const fetchMyAllocation = () => api.get('/hostel/allocations/my')
export const createAllocation = (payload: Record<string, unknown>) => api.post('/hostel/allocations', payload)
export const checkInAllocation = (id: number) => api.post(`/hostel/allocations/${id}/check-in`)
export const releaseAllocation = (id: number, payload?: { check_out_date?: string }) =>
  api.post(`/hostel/allocations/${id}/release`, payload)

export const fetchHostelPayments = (params?: { status?: string; page?: number }) => api.get('/hostel/payments', { params })
export const fetchMyHostelPayments = () => api.get('/hostel/payments/my')
export const createHostelPayment = (payload: Record<string, unknown>) => api.post('/hostel/payments', payload)
export const recordHostelPayment = (id: number, payload: Record<string, unknown>) => api.post(`/hostel/payments/${id}/record`, payload)
export const waiveHostelPayment = (id: number) => api.post(`/hostel/payments/${id}/waive`)

export const fetchClearances = (params?: { status?: string; page?: number }) => api.get('/hostel/clearances', { params })
export const updateClearance = (id: number, payload: Record<string, unknown>) => api.put(`/hostel/clearances/${id}`, payload)

export const fetchMaintenanceRequests = (params?: { status?: string; hostel_id?: number; page?: number }) =>
  api.get('/hostel/maintenance', { params })
export const createMaintenanceRequest = (payload: Record<string, unknown>) => api.post('/hostel/maintenance', payload)
export const updateMaintenanceRequest = (id: number, payload: Record<string, unknown>) => api.put(`/hostel/maintenance/${id}`, payload)

export function formatHostelError(error: unknown, fallback: string): string {
  const payload = (error as { response?: { data?: { message?: string } } })?.response?.data
  return payload?.message || fallback
}
