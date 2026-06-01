import api from './client'

export const fetchLetterCounts = () => api.get('/letters/counts')
export const searchLetterRecipients = (query: string, category?: string, all = false) =>
  api.get('/letters/recipients/search', { params: { query, type: category, all: all ? 1 : undefined } })
export const fetchUserLetterWorkflow = (userId: number) => api.get(`/letters/users/${userId}/letter-workflow`)
export const saveUserLetterWorkflow = (userId: number, payload: Record<string, any>) => api.post(`/letters/users/${userId}/letter-workflow`, payload)

export const fetchLetterSettings = () => api.get('/letters/settings')
export const saveLetterSettings = (payload: FormData) => api.post('/letters/settings', payload, { headers: { 'Content-Type': 'multipart/form-data' } })

export const fetchLetterCategories = () => api.get('/letters/categories')
export const createLetterCategory = (payload: any) => api.post('/letters/categories', payload)
export const updateLetterCategory = (id: number, payload: any) => api.put(`/letters/categories/${id}`, payload)
export const deleteLetterCategory = (id: number) => api.delete(`/letters/categories/${id}`)

export const fetchLetterTemplates = () => api.get('/letters/templates')
export const createLetterTemplate = (payload: any) => api.post('/letters/templates', payload)
export const updateLetterTemplate = (id: number, payload: any) => api.put(`/letters/templates/${id}`, payload)
export const deleteLetterTemplate = (id: number) => api.delete(`/letters/templates/${id}`)

export const fetchLetters = (params?: any) => api.get('/letters', { params })
export const fetchLetter = (id: number) => api.get(`/letters/${id}`)
export const createLetter = (payload: FormData) => api.post('/letters', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateLetter = (id: number, payload: any) => api.put(`/letters/${id}`, payload)
export const deleteLetter = (id: number) => api.delete(`/letters/${id}`)
export const forwardLetter = (id: number, payload: any) => api.post(`/letters/${id}/forward`, payload)
export const approveLetter = (id: number, payload?: any) => api.post(`/letters/${id}/approve`, payload)
export const rejectLetter = (id: number, payload?: any) => api.post(`/letters/${id}/reject`, payload)
export const signLetter = (id: number, payload?: any) => api.post(`/letters/${id}/sign`, payload)
export const sendLetter = (id: number, payload?: any) => api.post(`/letters/${id}/send`, payload)
export const bulkLetterAction = (payload: any) => api.post('/letters/bulk', payload)
export const previewLetter = (id: number) => api.get(`/letters/${id}/preview`)

export const searchAnnouncementRecipients = (category: string, query = '', all = false) =>
  api.get('/letters/announcements/recipients/search', { params: { category, query, all: all ? 1 : undefined } })

export const fetchAnnouncements = (params?: any) => api.get('/letters/announcements', { params })
export const processScheduledAnnouncements = () => api.post('/letters/announcements/process-scheduled')
export const createAnnouncement = (payload: FormData) => api.post('/letters/announcements', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateAnnouncement = (id: number, payload: FormData) => api.put(`/letters/announcements/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
export const previewAnnouncement = (payload: FormData) => api.post('/letters/announcements/preview', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
export const sendAnnouncement = (id: number) => api.post(`/letters/announcements/${id}/send`)
export const deleteAnnouncement = (id: number) => api.delete(`/letters/announcements/${id}`)
export const bulkDeleteAnnouncements = (ids: number[]) => api.post('/letters/announcements/bulk-delete', { ids })

export const fetchAnnouncementTemplates = (search?: string) =>
  api.get('/letters/announcements/templates', { params: search ? { search } : undefined })
export const createAnnouncementTemplate = (payload: Record<string, unknown>) =>
  api.post('/letters/announcements/templates', payload)
export const updateAnnouncementTemplate = (id: number, payload: Record<string, unknown>) =>
  api.put(`/letters/announcements/templates/${id}`, payload)
export const deleteAnnouncementTemplate = (id: number) =>
  api.delete(`/letters/announcements/templates/${id}`)

export const requestOtp = (payload: any) => api.post('/letters/otp/request', payload)
export const verifyOtp = (payload: any) => api.post('/letters/otp/verify', payload)
export const fetchMessageLogs = (params?: any) => api.get('/letters/message-logs', { params })
export const fetchWhatsAppSettings = () => api.get('/letters/whatsapp-settings')
export const saveWhatsAppSettings = (payload: any) => api.put('/letters/whatsapp-settings', payload)

export const fetchUserSignatures = (params?: any) => api.get('/letters/signatures/list', { params })
export const uploadUserSignature = (payload: FormData) => api.post('/letters/signatures', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
