import { useState, useCallback } from 'react';
import AdmissionsService from '../services/AdmissionsService';
import { Applicant } from '../types';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { formatValidationError } from '../../../api/admissions';
import type { DocumentRow } from '../components/DocumentUploadList';

export const useApplicationForm = () => {
  const { t } = useAdmissionsI18n();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<Partial<Applicant> | null>(null);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadExistingApplicant = useCallback(async () => {
    try {
      const existing = await AdmissionsService.getMyApplicant();
      if (existing?.id) {
        setApplicant(existing);
        setStep(2);
        return existing;
      }
    } catch {
      // No applicant yet — stay on step 1
    }
    return null;
  }, []);

  const submitApplicantInfo = useCallback(async (data: Partial<Applicant>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdmissionsService.createApplicant(data);
      setApplicant(response.data);
      setStep(2);
      return response.data;
    } catch (err: unknown) {
      const message = formatValidationError(err, t('errorCreateApplicant'));
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [t]);

  const submitApplication = useCallback(
    async (academicYearId: number, programmeId: number, documentRows: DocumentRow[] = []) => {
      if (!applicant?.id) {
        setError(t('errorApplicantRequired'));
        return;
      }

      setLoading(true);
      setError(null);
      setUploadProgress(0);
      try {
        const formData = new FormData();
        formData.append('applicant_id', applicant.id.toString());
        formData.append('academic_year_id', academicYearId.toString());
        formData.append('programme_id', programmeId.toString());

        documentRows.forEach((row, index) => {
          if (row.file) {
            formData.append(`document_names[${index}]`, row.name.trim() || `Document ${index + 1}`);
            formData.append(`documents[${index}]`, row.file);
          }
        });

        const response = await AdmissionsService.submitApplication(formData, setUploadProgress);
        setApplicationId(response.data.id);
        setApplicationNumber(response.data.application_number);
        setStep(3);
        return response.data;
      } catch (err: unknown) {
        const message = formatValidationError(err, t('errorSubmitApplication'));
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applicant, t]
  );

  const reset = useCallback(() => {
    setStep(1);
    setApplicant(null);
    setApplicationId(null);
    setApplicationNumber(null);
    setError(null);
    setUploadProgress(0);
  }, []);

  return {
    step,
    setStep,
    loading,
    error,
    applicant,
    applicationId,
    applicationNumber,
    uploadProgress,
    loadExistingApplicant,
    submitApplicantInfo,
    submitApplication,
    reset,
  };
};
