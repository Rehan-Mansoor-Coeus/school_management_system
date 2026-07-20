import api from './client'

export type LicensePlan = {
  id: number
  name: string
  code: string
  description: string | null
  license_type: string
  pricing_model: string
  billing_cycle: string
  currency: string
  base_price: number
  setup_fee: number
  renewal_fee: number
  late_fee: number
  trial_days: number
  grace_period_days: number
  max_users: number | null
  max_students: number | null
  max_teachers: number | null
  max_staff: number | null
  max_admins: number | null
  max_storage: number | null
  price_per_student: number | null
  student_billing_period: string | null
  minimum_billable_students: number | null
  down_payment_type: string | null
  down_payment_value: number | null
  minimum_down_payment?: number | null
  student_count_method?: string | null
  student_count_lock_rule?: string | null
  additional_student_rule?: string | null
  withdrawn_student_rule?: string | null
  balance_due_rule?: string | null
  activation_rule?: string | null
  count_suspended_students?: boolean
  count_deferred_students?: boolean
  count_withdrawn_students?: boolean
  count_graduated_students?: boolean
  status: string
  is_featured: boolean
  display_order: number
  modules: { id: number; key: string; name: string }[]
  module_ids?: number[]
}

export type ModuleCommercial = {
  id: number
  key: string
  name: string
  description?: string | null
  is_active: boolean
  monthly_price: number | null
  quarterly_price: number | null
  six_month_price: number | null
  yearly_price: number | null
  one_time_price: number | null
  setup_fee: number | null
  is_free: boolean
  is_mandatory: boolean
  can_purchase_separately: boolean
  trial_available: boolean
  depends_on_module_ids: number[]
}

export type PricingPreview = {
  currency: string
  license_type: string
  total_amount?: string | number
  estimated_total?: string | number
  required_down_payment?: string | number
  estimated_balance?: string | number
  billable_qty?: number
  calculated_amount?: string | number
  custom_amount?: string | number | null
  base_price?: string | number
  setup_fee?: string | number
  module_total?: string | number
  note?: string
  [key: string]: unknown
}

export type CurrentLicense = {
  id: number | null
  plan: {
    id: number | null
    name: string
    code: string
    license_type?: string
    billing_cycle?: string
    currency?: string
  }
  license_type: string
  billing_cycle: string | null
  license_status: string
  payment_status: string
  start_date: string | null
  expiry_date: string | null
  next_billing_date: string | null
  grace_period_end: string | null
  max_users?: number | null
  current_users?: number
  max_students?: number | null
  current_students?: number
  total_amount?: number
  amount_paid?: number
  balance?: number
  currency?: string
  license_key?: string | null
  auto_renew?: boolean
  is_expired?: boolean
  days_remaining?: number | null
  enabled_modules?: { id: number; key: string; name: string; status?: string }[]
  // legacy aliases used by older UI surfaces
  plan_code?: string
  plan_name?: string
  status?: string
  started_at?: string | null
  expires_at?: string | null
}

export type InstitutionLicenseRow = CurrentLicense & {
  institution: {
    id: number
    name: string
    code: string
    is_active: boolean
  }
}

export function fetchLicensePlans(params?: { status?: string; active_only?: boolean; license_type?: string }) {
  return api.get<{ data: LicensePlan[] }>('/super-admin/license-plans', { params })
}

export function fetchLicensePlan(id: number) {
  return api.get<{ data: LicensePlan }>(`/super-admin/license-plans/${id}`)
}

export function createLicensePlan(payload: Record<string, unknown>) {
  return api.post<{ message: string; data: LicensePlan }>('/super-admin/license-plans', payload)
}

export function updateLicensePlan(id: number, payload: Record<string, unknown>) {
  return api.put<{ message: string; data: LicensePlan }>(`/super-admin/license-plans/${id}`, payload)
}

export function duplicateLicensePlan(id: number) {
  return api.post<{ message: string; data: LicensePlan }>(`/super-admin/license-plans/${id}/duplicate`)
}

export function setLicensePlanStatus(id: number, status: string) {
  return api.put<{ message: string; data: LicensePlan }>(`/super-admin/license-plans/${id}/status`, { status })
}

export function fetchInstitutionLicenses(params?: {
  search?: string
  license_status?: string
  payment_status?: string
  license_type?: string
  plan_id?: number
}) {
  return api.get<{ data: InstitutionLicenseRow[] }>('/super-admin/institution-licenses', { params })
}

export function fetchCurrentLicense(institutionId: number) {
  return api.get<{ current_license: CurrentLicense }>(`/super-admin/schools/${institutionId}/current-license`)
}

export function updateCurrentLicense(institutionId: number, payload: Record<string, unknown>) {
  return api.put(`/super-admin/schools/${institutionId}/current-license`, payload)
}

export function previewLicensePricing(payload: Record<string, unknown>) {
  return api.post<{ data: PricingPreview }>('/super-admin/license-plans/preview', payload)
}

export function fetchModulePricing() {
  return api.get<{ data: ModuleCommercial[] }>('/super-admin/module-pricing')
}

export function updateModulePricing(id: number, payload: Record<string, unknown>) {
  return api.put<{ message: string; data: ModuleCommercial }>(`/super-admin/module-pricing/${id}`, payload)
}

export function assignInstitutionLicense(payload: Record<string, unknown>) {
  return api.post<{ message: string; data: CurrentLicense; preview: PricingPreview; semester_license?: SemesterLicense }>(
    '/super-admin/institution-licenses/assign',
    payload,
  )
}

export type SemesterLicense = {
  id: number
  institution_id: number
  institution_license_id?: number | null
  license_plan_id: number | null
  plan?: { id: number; name: string; code: string } | null
  academic_year_id: number
  academic_year?: string | null
  semester_id?: number | null
  semester_name: string
  currency: string
  price_per_student: number
  minimum_billable_students: number
  estimated_students: number
  projected_students: number
  locked_students: number | null
  estimated_total: number
  required_down_payment: number
  down_payment_paid: number
  locked_total: number | null
  balance_due: number
  amount_paid: number
  status: string
  payment_status: string
  student_count_lock_date: string | null
  locked_at: string | null
  reconciled_at: string | null
  notes?: string | null
  institution?: { id: number; name: string; code: string } | null
}

export type LicenseInvoice = {
  id: number
  institution_id: number
  institution_name?: string
  institution_semester_license_id?: number | null
  invoice_number: string
  invoice_type: string
  currency: string
  subtotal: number
  total_amount: number
  amount_paid: number
  balance: number
  status: string
  issue_date: string | null
  due_date: string | null
  items?: { id: number; item_type: string; description: string; quantity: number; unit_price: number; line_total: number }[]
}

export type LicensePayment = {
  id: number
  institution_id: number
  institution_name?: string
  license_invoice_id?: number | null
  invoice_number?: string | null
  institution_semester_license_id?: number | null
  payment_number: string
  currency: string
  amount: number
  method: string
  status: string
  reference?: string | null
  notes?: string | null
  proofs?: { id: number; file_path: string; original_name: string; status: string; rejection_reason?: string | null }[]
}

export type LicensingOverviewKpis = {
  semester_licenses: number
  awaiting_down_payment: number
  awaiting_lock: number
  awaiting_reconciliation: number
  estimated_revenue: number
  locked_revenue: number
  down_payments_expected: number
  down_payments_received: number
  outstanding_balances: number
  overdue_semesters: number
  invoices_issued: number
  invoices_unpaid: number
  payments_pending_verification: number
}

export function fetchLicensingOverviewKpis() {
  return api.get<{ data: LicensingOverviewKpis }>('/super-admin/licensing/overview')
}

export function fetchSemesterLicenses(params?: {
  institution_id?: number
  status?: string
  academic_year_id?: number
  search?: string
}) {
  return api.get<{ data: SemesterLicense[] }>('/super-admin/semester-licenses', { params })
}

export function createSemesterLicense(payload: Record<string, unknown>) {
  return api.post<{ message: string; data: SemesterLicense }>('/super-admin/semester-licenses', payload)
}

export function lockSemesterLicense(id: number, payload?: { override_count?: number; reason?: string }) {
  return api.post<{ message: string; data: SemesterLicense }>(`/super-admin/semester-licenses/${id}/lock`, payload || {})
}

export function reconcileSemesterLicense(id: number) {
  return api.post<{ message: string; data: SemesterLicense }>(`/super-admin/semester-licenses/${id}/reconcile`)
}

export function syncSemesterUsage(id: number) {
  return api.post<{ message: string; data: SemesterLicense }>(`/super-admin/semester-licenses/${id}/sync-usage`)
}

export function fetchSchoolAcademicYears(institutionId: number) {
  return api.get<{ data: { id: number; name: string; code?: string; is_current?: boolean }[] }>(
    `/super-admin/schools/${institutionId}/academic-years`,
  )
}

export function fetchLicenseInvoices(params?: { institution_id?: number; status?: string }) {
  return api.get<{ data: LicenseInvoice[] }>('/super-admin/license-invoices', { params })
}

export function fetchLicensePayments(params?: { institution_id?: number; status?: string }) {
  return api.get<{ data: LicensePayment[] }>('/super-admin/license-payments', { params })
}

export function fetchPendingLicensePayments() {
  return api.get<{ data: LicensePayment[] }>('/super-admin/license-payments/pending')
}

export function recordLicensePayment(payload: Record<string, unknown>) {
  return api.post<{ message: string; data: LicensePayment }>('/super-admin/license-payments', payload)
}

export function verifyLicensePayment(id: number, payload: { approve: boolean; reason?: string }) {
  return api.post<{ message: string; data: LicensePayment }>(`/super-admin/license-payments/${id}/verify`, payload)
}

export function fetchInstitutionBilling() {
  return api.get<{
    current_license: CurrentLicense
    semester_licenses: SemesterLicense[]
    invoices: LicenseInvoice[]
    payments: LicensePayment[]
    notes: string[]
  }>('/institution-billing')
}

export function uploadInstitutionBillingProof(form: FormData) {
  return api.post<{ message: string; data: LicensePayment }>('/institution-billing/payment-proof', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function requestInstitutionBillingChange(payload: {
  request_type: 'renewal' | 'upgrade' | 'add_modules' | 'support'
  notes?: string
  module_keys?: string[]
}) {
  return api.post<{ message: string; request_type: string }>('/institution-billing/request-change', payload)
}

export function fetchLicenseAuditLogs(params?: { institution_id?: number; entity_type?: string }) {
  return api.get<{ data: Record<string, unknown>[] }>('/super-admin/license-audit-logs', { params })
}

export function fetchLicenseDiscounts(params?: { institution_id?: number }) {
  return api.get<{ data: Record<string, unknown>[] }>('/super-admin/license-discounts', { params })
}

export function createLicenseDiscount(payload: Record<string, unknown>) {
  return api.post<{ message: string; data: Record<string, unknown> }>('/super-admin/license-discounts', payload)
}
