import api from './client'

// ---- Types -----------------------------------------------------------------

export type LibrarySettings = {
  id?: number
  institution_id?: number
  max_borrow_days: number
  max_books_per_user: number
  fine_per_day: number
  grace_period_days: number
  allow_unlimited_borrowing: boolean
  require_approval: boolean
  isbn_mandatory: boolean
  author_mandatory: boolean
  shelf_location_mandatory: boolean
  publisher_mandatory: boolean
  publication_year_mandatory: boolean
  default_reminder_days: number
  whatsapp_notifications_enabled: boolean
  email_notifications_enabled: boolean
  block_borrow_on_unpaid_fines: boolean
  librarian_user_ids?: number[]
}

export type LibraryCategory = {
  id: number
  name: string
  description?: string | null
  status: string
  books_count?: number
}

export type BookAvailability = {
  total_copies: number
  available_copies: number
  borrowed_copies: number
  is_available: boolean
  next_available_date: string | null
}

export type LibraryBook = {
  id: number
  category_id: number | null
  category?: { id: number; name: string } | null
  title: string
  isbn?: string | null
  author?: string | null
  publisher?: string | null
  publication_year?: string | null
  edition?: string | null
  description?: string | null
  language?: string | null
  shelf_location?: string | null
  status: string
  cover_image_url?: string | null
  average_rating?: number | null
  borrow_count?: number
  availability?: BookAvailability
}

export type LibraryBookCopy = {
  id: number
  book_id: number
  copy_code: string
  barcode?: string | null
  shelf_location?: string | null
  condition: string
  status: string
  current_borrower_id?: number | null
  expected_available_date?: string | null
  book?: LibraryBook
}

export type BorrowRequest = {
  id: number
  user_id: number
  user_name?: string
  user_phone?: string
  book_id: number
  book_title?: string
  book_copy_id?: number | null
  copy_code?: string | null
  requested_from_datetime?: string | null
  requested_to_datetime?: string | null
  expected_return_date?: string | null
  status: string
  token?: string | null
  requested_at?: string | null
  approved_at?: string | null
  rejected_reason?: string | null
  issued_at?: string | null
  returned_at?: string | null
  days_remaining?: number | null
  overdue_days?: number
}

export type LibraryFine = {
  id: number
  user_id: number
  user_name?: string
  user_phone?: string
  book_id?: number | null
  book_title?: string
  borrow_request_id?: number | null
  overdue_days: number
  fine_amount: number
  status: string
  payment_date?: string | null
  comment?: string | null
  created_at?: string
}

// ---- Dashboard / Settings --------------------------------------------------

export const fetchLibraryDashboard = () => api.get('/library/dashboard')
export const fetchLibrarySettings = () => api.get('/library/settings')
export const saveLibrarySettings = (payload: Partial<LibrarySettings>) => api.put('/library/settings', payload)

// ---- Categories ------------------------------------------------------------

export const fetchLibraryCategories = () => api.get('/library/categories')
export const createLibraryCategory = (payload: Partial<LibraryCategory>) => api.post('/library/categories', payload)
export const updateLibraryCategory = (id: number, payload: Partial<LibraryCategory>) => api.put(`/library/categories/${id}`, payload)
export const deleteLibraryCategory = (id: number) => api.delete(`/library/categories/${id}`)

// ---- Books -----------------------------------------------------------------

export const fetchLibraryBooks = (params?: any) => api.get('/library/books', { params })
export const searchLibraryBooks = (params?: any) => api.get('/library/books/search', { params })
export const fetchFrequentlySigned = () => api.get('/library/books/frequently-signed')
export const fetchLibraryBook = (id: number) => api.get(`/library/books/${id}`)
export const createLibraryBook = (payload: FormData) => api.post('/library/books', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateLibraryBook = (id: number, payload: FormData) => api.post(`/library/books/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteLibraryBook = (id: number) => api.delete(`/library/books/${id}`)

export const fetchBookReviews = (bookId: number) => api.get(`/library/books/${bookId}/reviews`)
export const createBookReview = (bookId: number, payload: { rating?: number; comment?: string }) => api.post(`/library/books/${bookId}/reviews`, payload)

// ---- Copies ----------------------------------------------------------------

export const fetchBookCopies = (params?: any) => api.get('/library/copies', { params })
export const suggestAccessionNumber = (bookId: number, accessionPrefix?: string) =>
  api.get('/library/copies/suggest-accession', { params: { book_id: bookId, accession_prefix: accessionPrefix } })
export const createBookCopy = (payload: Partial<LibraryBookCopy> & { accession_prefix?: string }) => api.post('/library/copies', payload)
export const createBookCopiesBulk = (payload: {
  book_id: number
  quantity: number
  accession_prefix?: string
  shelf_location?: string
  condition?: string
  status?: string
}) => api.post('/library/copies/bulk', payload)
export const updateBookCopy = (id: number, payload: Partial<LibraryBookCopy>) => api.put(`/library/copies/${id}`, payload)
export const deleteBookCopy = (id: number) => api.delete(`/library/copies/${id}`)

// ---- Borrow lifecycle ------------------------------------------------------

export const fetchBorrowRequests = (params?: any) => api.get('/library/borrow-requests', { params })
export const createBorrowRequest = (payload: any) => api.post('/library/borrow-requests', payload)
export const fetchBorrowedBooks = (params?: any) => api.get('/library/borrow-requests/borrowed', { params })
export const fetchDueForReturn = (params?: any) => api.get('/library/borrow-requests/due-for-return', { params })
export const fetchOverdueBooks = (params?: any) => api.get('/library/borrow-requests/overdue', { params })
export const fetchBorrowingHistory = (params?: any) => api.get('/library/borrow-requests/history', { params })
export const scanBorrowToken = (token: string) => api.get(`/library/borrow-requests/scan/${token}`)
export const fetchBorrowRequest = (id: number) => api.get(`/library/borrow-requests/${id}`)
export const approveBorrowRequest = (id: number) => api.post(`/library/borrow-requests/${id}/approve`)
export const rejectBorrowRequest = (id: number, reason?: string) => api.post(`/library/borrow-requests/${id}/reject`, { reason })
export const issueBorrowRequest = (id: number, payload?: { due_date?: string }) => api.post(`/library/borrow-requests/${id}/issue`, payload || {})
export const returnBorrowRequest = (id: number) => api.post(`/library/borrow-requests/${id}/return`)
export const markLostOrDamaged = (id: number, condition: 'lost' | 'damaged') => api.post(`/library/borrow-requests/${id}/lost-damaged`, { condition })
export const cancelBorrowRequest = (id: number) => api.post(`/library/borrow-requests/${id}/cancel`)
export const sendBorrowReminder = (id: number) => api.post(`/library/borrow-requests/${id}/reminder`)
export const sendBulkReminders = (ids: number[]) => api.post('/library/borrow-requests/bulk-reminder', { ids })

// ---- Fines -----------------------------------------------------------------

export const fetchLibraryFines = (params?: any) => api.get('/library/fines', { params })
export const payLibraryFine = (id: number, comment?: string) => api.post(`/library/fines/${id}/pay`, { comment })
export const waiveLibraryFine = (id: number, comment?: string) => api.post(`/library/fines/${id}/waive`, { comment })
