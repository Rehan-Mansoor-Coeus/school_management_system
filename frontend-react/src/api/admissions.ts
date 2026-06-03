import api from './client';
import type { Application } from '../modules/admissions/types';

export async function fetchAdmissionsReferenceData() {
  const { data } = await api.get('/admissions/reference-data');
  return data.data;
}

export async function fetchMyApplications(page = 1) {
  const { data } = await api.get(`/admissions/my-applications?page=${page}`);
  return data;
}

export async function fetchAllApplications(params: { page?: number; status?: string; search?: string } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  const { data } = await api.get(`/admissions/applications?${query.toString()}`);
  return data as {
    data: Application[];
    pagination?: { total: number; per_page: number; current_page: number; last_page: number };
  };
}

export async function fetchApplication(applicationId: number) {
  const { data } = await api.get(`/admissions/applications/${applicationId}`);
  return data.data as Application;
}

export async function fetchMyApplicant() {
  const { data } = await api.get('/admissions/my-applicant');
  return data.data;
}

export function formatValidationError(error: unknown, fallback: string): string {
  const payload = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
  if (payload?.errors) {
    const parts = Object.values(payload.errors).flat().filter(Boolean);
    if (parts.length) {
      return parts.join(' ');
    }
  }
  return payload?.message || fallback;
}

export async function createApplicant(payload: Record<string, unknown>) {
  const { data } = await api.post('/admissions/applicant', payload);
  return data;
}

export async function submitApplication(payload: FormData | Record<string, unknown>) {
  const { data } = await api.post('/admissions/apply', payload);
  return data;
}

export async function acceptAdmission(applicationId: number) {
  const { data } = await api.post(`/admissions/applications/${applicationId}/accept`);
  return data;
}

export async function payApplicationFee(applicationId: number) {
  const { data } = await api.post('/admissions/payment/application-fee', { application_id: applicationId });
  return data;
}

export async function payTuition(applicationId: number) {
  const { data } = await api.post('/admissions/payment/tuition', { application_id: applicationId });
  return data;
}

export async function confirmOfflinePayment(applicationId: number, paymentType: 'application_fee' | 'tuition') {
  const { data } = await api.post('/admissions/payment/confirm-offline', {
    application_id: applicationId,
    payment_type: paymentType,
  });
  return data;
}

export async function fetchRegistryPending() {
  const { data } = await api.get('/admissions/registry/pending');
  return data;
}

export async function reviewRegistryApplication(applicationId: number, payload: { decision: 'approved' | 'rejected'; admission_comment?: string; rejection_reason?: string }) {
  const { data } = await api.post(`/admissions/registry/review/${applicationId}`, payload);
  return data;
}

export async function fetchDepartmentPending() {
  const { data } = await api.get('/admissions/department/pending');
  return data;
}

export async function decideDepartmentApplication(applicationId: number, payload: { status: 'approved' | 'rejected'; admission_comment?: string; rejection_reason?: string }) {
  const { data } = await api.post(`/admissions/department/decide/${applicationId}`, payload);
  return data;
}

export async function fetchRegistrarReady() {
  const { data } = await api.get('/admissions/registrar/ready');
  return data;
}

export async function admitStudent(applicationId: number) {
  const { data } = await api.post(`/admissions/registrar/admit/${applicationId}`);
  return data;
}

export async function resendAdmissionLetter(applicationId: number) {
  const { data } = await api.post(`/admissions/registrar/resend-letter/${applicationId}`);
  return data;
}

export async function fetchFinancePending() {
  const { data } = await api.get('/admissions/finance/pending-tuition');
  return data;
}

export async function verifyTuition(applicationId: number) {
  const { data } = await api.post(`/admissions/finance/verify/${applicationId}`);
  return data;
}

export async function fetchAvailableCourses() {
  const { data } = await api.get('/admissions/courses/available');
  return {
    courses: (data.data || []) as Array<{ id: number; name: string; code: string; credit_units: number; programme_semester_id?: number | null }>,
    reason: data.reason as string | undefined,
    message: data.message as string | undefined,
  };
}

export async function registerCourses(courseIds: number[], programmeSemesterId?: number | null) {
  const { data } = await api.post('/admissions/courses/register', {
    courses: courseIds,
    programme_semester_id: programmeSemesterId ?? undefined,
  });
  return data;
}

export async function fetchPendingCourseApprovals() {
  const { data } = await api.get('/admissions/courses/pending-approval');
  return data;
}

export async function approveCourseRegistration(registrationId: number) {
  const { data } = await api.post(`/admissions/courses/${registrationId}/approve`);
  return data;
}

export async function rejectCourseRegistration(registrationId: number, reason: string) {
  const { data } = await api.post(`/admissions/courses/${registrationId}/reject`, { reason });
  return data;
}

export async function fetchAdmissionsNotifications() {
  const { data } = await api.get('/admissions/notifications');
  return data;
}

export type { Application };
