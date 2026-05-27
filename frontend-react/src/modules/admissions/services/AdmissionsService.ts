import api from '@/api';
import { Application, Applicant, Payment, Notification } from '../types';

class AdmissionsService {
  async createApplicant(data: Partial<Applicant>) {
    const response = await api.post('/admissions/applicant', data);
    return response.data;
  }

  async submitApplication(data: any) {
    const response = await api.post('/admissions/apply', data);
    return response.data;
  }

  async getMyApplications(page = 1) {
    const response = await api.get(`/admissions/my-applications?page=${page}`);
    return response.data;
  }

  async getApplication(applicationId: number) {
    const response = await api.get(`/admissions/applications/${applicationId}`);
    return response.data;
  }

  async initializePayment(applicationId: number) {
    const response = await api.post('/admissions/payment/initiate', {
      application_id: applicationId,
    });
    return response.data;
  }

  async verifyPayment(transactionId: string) {
    const response = await api.get('/admissions/payment/verify', {
      params: { transaction_id: transactionId },
    });
    return response.data;
  }

  async registerCourses(semesterId: number, courseIds: number[]) {
    const response = await api.post('/admissions/courses/register', {
      semester_id: semesterId,
      courses: courseIds,
    });
    return response.data;
  }

  // Admission Board
  async getPendingApplications(page = 1) {
    const response = await api.get(`/admissions/board/pending?page=${page}`);
    return response.data;
  }

  async reviewApplication(applicationId: number, comment?: string) {
    const response = await api.post(`/admissions/board/review/${applicationId}`, {
      admission_comment: comment,
    });
    return response.data;
  }

  async decideApplication(
    applicationId: number,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) {
    const response = await api.post(`/admissions/board/decide/${applicationId}`, {
      status,
      rejection_reason: rejectionReason,
    });
    return response.data;
  }

  async getBoardDashboard() {
    const response = await api.get('/admissions/board/dashboard');
    return response.data;
  }

  // Registrar
  async getReadyForAdmission(page = 1) {
    const response = await api.get(`/admissions/registrar/ready?page=${page}`);
    return response.data;
  }

  async admitStudent(applicationId: number) {
    const response = await api.post(`/admissions/registrar/admit/${applicationId}`);
    return response.data;
  }

  async getRegistrarDashboard() {
    const response = await api.get('/admissions/registrar/dashboard');
    return response.data;
  }
}

export default new AdmissionsService();
