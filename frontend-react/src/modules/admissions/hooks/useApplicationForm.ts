import { useState, useCallback } from 'react';
import AdmissionsService from '../services/AdmissionsService';
import { Applicant } from '../types';

export const useApplicationForm = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<Partial<Applicant> | null>(null);
  const [applicationId, setApplicationId] = useState<number | null>(null);

  const submitApplicantInfo = useCallback(async (data: Partial<Applicant>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdmissionsService.createApplicant(data);
      setApplicant(response.data);
      setStep(2);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create applicant profile';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitApplication = useCallback(
    async (academicYearId: number, programmeId: number, documents?: any) => {
      if (!applicant) {
        setError('Applicant information is required');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('applicant_id', applicant.id?.toString() || '');
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
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to submit application';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applicant]
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
    submitApplicantInfo,
    submitApplication,
    reset,
  };
};
