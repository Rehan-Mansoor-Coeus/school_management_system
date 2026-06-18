import api from './client';

export async function fetchFees(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const { data } = await api.get(`/fees?${query.toString()}`);
  return data;
}

export async function fetchMyFees() {
  const { data } = await api.get('/fees/my');
  return data;
}

export async function fetchFeeReports() {
  const { data } = await api.get('/fees/reports/summary');
  return data;
}

export async function recordFeePayment(feeId: number, payload: { amount: number; payment_method?: string; description?: string; receipt_number?: string }) {
  const { data } = await api.post(`/fees/${feeId}/payments`, payload);
  return data;
}

export async function updateSemesterFeeConfig(semesterId: number, payload: Record<string, unknown>) {
  const { data } = await api.put(`/fees/semesters/${semesterId}`, payload);
  return data;
}

export async function fetchStudentPaymentHistory(studentId: number) {
  const { data } = await api.get(`/fees/students/${studentId}/payment-history`);
  return data;
}
