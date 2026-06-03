import { useState, useCallback } from 'react';
import AdmissionsService from '../services/AdmissionsService';
import { Applicant } from '../types';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { formatValidationError } from '../../../api/admissions';

export const useApplicationForm = () => {
  const { t } = useAdmissionsI18n();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<Partial<Applicant> | null>(null);
  const [applicationId, setApplicationId] = useState<number | null>(null);

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
    async (academicYearId: number, programmeId: number, documents?: { passport?: File; transcript?: File }) => {
      if (!applicant?.id) {
        setError(t('errorApplicantRequired'));
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('applicant_id', applicant.id.toString());
        formData.append('academic_year_id', academicYearId.toString());
        formData.append('programme_id', programmeId.toString());

        if (documents?.passport) {
          formData.append('passport_path', documents.passport);
        }
        if (documents?.transcript) {
          formData.append('transcript_path', documents.transcript);
        }

        const response = await AdmissionsService.submitApplication(formData);
        setApplicationId(response.data.id);
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
    setError(null);
  }, []);

  return {
    step,
    setStep,
    loading,
    error,
    applicant,
    applicationId,
    loadExistingApplicant,
    submitApplicantInfo,
    submitApplication,
    reset,
  };
};
