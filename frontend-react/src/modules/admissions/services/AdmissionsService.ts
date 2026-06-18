import api from '../../../api/client';
import {
  createApplicant,
  submitApplication,
  fetchMyApplications,
  fetchMyApplicant,
  payApplicationFee,
  payTuition,
  confirmOfflinePayment,
  acceptAdmission,
  fetchRegistryPending,
  reviewRegistryApplication,
  fetchDepartmentPending,
  decideDepartmentApplication,
  fetchRegistrarReady,
  admitStudent,
  fetchFinancePending,
  verifyTuition,
  registerCourses,
  fetchAdmissionsReferenceData,
} from '../../../api/admissions';

class AdmissionsService {
  createApplicant = createApplicant;
  submitApplication = submitApplication;
  getMyApplications = fetchMyApplications;
  getMyApplicant = fetchMyApplicant;
  getReferenceData = fetchAdmissionsReferenceData;
  acceptAdmission = acceptAdmission;
  initializeApplicationFee = payApplicationFee;
  initializeTuition = payTuition;
  confirmOfflinePayment = confirmOfflinePayment;

  async getApplication(applicationId: number) {
    const { data } = await api.get(`/admissions/applications/${applicationId}`);
    return data;
  }

  getPendingApplications = fetchRegistryPending;
  reviewApplication = (id: number, comment?: string) =>
    reviewRegistryApplication(id, { decision: 'approved', admission_comment: comment });
  registryReview = reviewRegistryApplication;

  getBoardDashboard = async () => {
    const { data } = await api.get('/admissions/registry/dashboard');
    return data;
  };

  getDepartmentPending = fetchDepartmentPending;
  decideApplication = decideDepartmentApplication;

  getDepartmentDashboard = async () => {
    const { data } = await api.get('/admissions/department/dashboard');
    return data;
  };

  getReadyForAdmission = fetchRegistrarReady;
  admitStudent = admitStudent;

  getRegistrarDashboard = async () => {
    const { data } = await api.get('/admissions/registrar/dashboard');
    return data;
  };

  getFinancePending = fetchFinancePending;
  verifyTuition = verifyTuition;

  getFinanceDashboard = async () => {
    const { data } = await api.get('/admissions/finance/dashboard');
    return data;
  };

  registerCourses = (semesterId: number, courseIds: number[]) => registerCourses(courseIds, semesterId);
}

export default new AdmissionsService();
