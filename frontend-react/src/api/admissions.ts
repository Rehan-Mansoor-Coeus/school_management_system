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

export async function submitApplication(payload: FormData | Record<string, unknown>, onProgress?: (percent: number) => void) {
  const config = onProgress
    ? {
        onUploadProgress: (event: { loaded: number; total?: number }) => {
          if (event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      }
    : undefined;
  const { data } = await api.post('/admissions/apply', payload, config);
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

export async function submitApplicationFeeProof(applicationId: number, formData: FormData, onProgress?: (percent: number) => void) {
  const { data } = await api.post('/admissions/payment/application-fee/proof', formData, {
    onUploadProgress: onProgress
      ? (event: { loaded: number; total?: number }) => {
          if (event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        }
      : undefined,
  });
  return data;
}

export const submitApplicationFeeProofWithProgress = submitApplicationFeeProof;

export async function submitTuitionProof(applicationId: number, formData: FormData, onProgress?: (percent: number) => void) {
  const { data } = await api.post('/admissions/payment/tuition/proof', formData, {
    onUploadProgress: onProgress
      ? (event: { loaded: number; total?: number }) => {
          if (event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        }
      : undefined,
  });
  return data;
}

export const submitTuitionProofWithProgress = submitTuitionProof;

export async function fetchPaymentMethods(applicationId?: number) {
  const { data } = await api.get('/admissions/payment/methods', {
    params: applicationId ? { application_id: applicationId } : undefined,
  });
  return data.data as {
    stripe?: { enabled: boolean; publishable_key?: string | null };
    campay?: { enabled: boolean };
    flutterwave?: { enabled: boolean };
    proof?: { enabled: boolean };
  };
}

export async function createStripePaymentIntent(applicationId: number, paymentType: 'application_fee' | 'tuition') {
  const { data } = await api.post('/admissions/payment/stripe/intent', {
    application_id: applicationId,
    payment_type: paymentType,
  });
  return data.data as {
    client_secret?: string;
    payment_intent_id?: string;
    publishable_key?: string;
    amount?: number;
    currency?: string;
  };
}

export async function confirmStripePayment(paymentIntentId: string) {
  const { data } = await api.post('/admissions/payment/stripe/confirm', {
    payment_intent_id: paymentIntentId,
  });
  return data;
}

export async function createCampayPayment(applicationId: number, paymentType: 'application_fee' | 'tuition', phone: string) {
  const { data } = await api.post('/admissions/payment/campay/collect', {
    application_id: applicationId,
    payment_type: paymentType,
    phone,
  });
  return data.data as {
    reference?: string;
    reference_number?: string;
    status?: string;
    message?: string;
  };
}

export async function verifyCampayPayment(reference: string) {
  const { data } = await api.get(`/admissions/payment/campay/status/${encodeURIComponent(reference)}`);
  return data.data as {
    status?: string;
    campay_status?: string;
  };
}

export async function fetchStudentAdmissionsDashboard() {
  const { data } = await api.get('/admissions/student/dashboard');
  return data.data as {
    total_applications: number;
    active_applications: number;
    enrolled_count: number;
    pending_fee_count: number;
    unread_notifications: number;
    latest_application?: Application | null;
    applications_summary?: Array<{
      id: number;
      application_number: string;
      status: string;
      programme?: string | null;
      application_fee_paid: boolean;
      progress_percent: number;
    }>;
  };
}

export async function fetchPendingPaymentProofs(paymentType: 'application_fee' | 'tuition' | 'all' = 'application_fee') {
  const { data } = await api.get('/admissions/payment/pending-proofs', { params: { payment_type: paymentType } });
  return data;
}

export async function approvePaymentProof(paymentId: number, reviewNotes?: string) {
  const { data } = await api.post(`/admissions/payment/proofs/${paymentId}/approve`, { review_notes: reviewNotes });
  return data;
}

export async function rejectPaymentProof(paymentId: number, reviewNotes: string) {
  const { data } = await api.post(`/admissions/payment/proofs/${paymentId}/reject`, { review_notes: reviewNotes });
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
    registrations: (data.registrations || []) as Array<{
      id: number;
      subject_id?: number | null;
      status: string;
      approved_by_hod?: boolean;
      rejection_reason?: string | null;
      subject?: { id: number; name: string; code: string };
      course?: { id: number; name: string; code: string };
    }>,
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

export async function bulkApproveCourseRegistrations(studentId: number) {
  const { data } = await api.post('/admissions/courses/bulk-approve', { student_id: studentId });
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
