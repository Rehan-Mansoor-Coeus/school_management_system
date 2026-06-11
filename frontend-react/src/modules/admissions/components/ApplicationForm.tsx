
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useApplicationForm } from '../hooks/useApplicationForm';
import ProgrammeDocumentUploadList, {
  type ProgrammeRequiredDocument,
  type RequiredDocumentUpload,
} from './ProgrammeDocumentUploadList';
import SignaturePad from '../../../components/letters/SignaturePad';
import ApplicationAgreementSection from './ApplicationAgreementSection';
import { fetchAdmissionsReferenceData } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { useAuth } from '../../../context/AuthContext';

import FormSelect from '../../../components/ui/FormSelect';
import {
  countryOptions,
  DEFAULT_COUNTRY,
  defaultCityForCountry,
  getCityOptions,
  getSubdivisionConfig,
} from '../../../config/locationData';
import type { AdmissionAgreement } from '../types';


interface Programme {
  id: number;
  name: string;
  code: string;
  required_documents?: ProgrammeRequiredDocument[];
  admission_agreement?: AdmissionAgreement | null;
}

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

export const ApplicationForm: React.FC = () => {
  const { t } = useAdmissionsI18n();
  const { user } = useAuth();
  const { step, loading, error, applicant, applicationNumber, uploadProgress, submitApplicantInfo, submitApplication, reset, loadExistingApplicant, setStep } =
    useApplicationForm();

  const [programmes, setProgrammes] = React.useState<Programme[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYear[]>([]);
  const [institutionAgreement, setInstitutionAgreement] = React.useState<AdmissionAgreement | null>(null);
  const [acceptedAgreementIds, setAcceptedAgreementIds] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    nationality: '',
    id_number: '',
    address: '',
    city: defaultCityForCountry(DEFAULT_COUNTRY),
    state: '',
    country: DEFAULT_COUNTRY,
    is_international: false,
  });

  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [documentUploads, setDocumentUploads] = useState<RequiredDocumentUpload[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState('');

  const selectedProgrammeData = useMemo(
    () => programmes.find((programme) => String(programme.id) === selectedProgramme),
    [programmes, selectedProgramme]
  );

  const activeAgreements = useMemo(() => {
    const list: AdmissionAgreement[] = [];
    if (institutionAgreement?.content?.trim()) {
      list.push(institutionAgreement);
    }
    if (selectedProgrammeData?.admission_agreement?.content?.trim()) {
      list.push(selectedProgrammeData.admission_agreement);
    }
    return list;
  }, [institutionAgreement, selectedProgrammeData]);

  useEffect(() => {
    loadReferenceData();
    loadExistingApplicant();
  }, [loadExistingApplicant]);

  useEffect(() => {
    if (!user || applicant) {
      return;
    }
    const nameParts = String(user.name || '').trim().split(/\s+/);
    setFormData((prev) => ({
      ...prev,
      first_name: prev.first_name || nameParts[0] || '',
      last_name: prev.last_name || nameParts.slice(1).join(' ') || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone_number || '',
    }));
  }, [user, applicant]);


  const subdivision = useMemo(() => getSubdivisionConfig(formData.country), [formData.country]);
  const cityOptions = useMemo(() => getCityOptions(formData.country), [formData.country]);
  const subdivisionOptions = useMemo(
    () => subdivision.items.map((item) => ({ value: item, label: item })),
    [subdivision.items]
  );

  const handleCountryChange = (country: string) => {
    setFormData((prev) => ({
      ...prev,
      country,
      state: '',
      city: defaultCityForCountry(country) || prev.city,
    }));
  };

  useEffect(() => {
    const requirements = selectedProgrammeData?.required_documents || [];
    setDocumentUploads(
      requirements.map((requirement) => ({
        requiredDocumentId: requirement.id,
        name: requirement.name,
        description: requirement.description,
        is_required: requirement.is_required,
        comment: '',
      }))
    );
    setAcceptedAgreementIds([]);
  }, [selectedProgrammeData]);

  const loadReferenceData = async () => {

    try {
      const data = await fetchAdmissionsReferenceData();
      setProgrammes((data.programmes as Programme[]) || []);
      setAcademicYears((data.academic_years as AcademicYear[]) || []);
      setInstitutionAgreement((data.institution_agreement as AdmissionAgreement) || null);
    } catch (fetchError) {
      console.error('Failed to fetch admissions reference data:', fetchError);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingAgreement = activeAgreements.some(
      (agreement) => agreement.is_required && !acceptedAgreementIds.includes(agreement.id)
    );
    if (missingAgreement) {
      setLocalError(t('agreementsRequired'));
      return;
    }
    setLocalError('');
    try {
      await submitApplication(
        parseInt(selectedAcademicYear, 10),
        parseInt(selectedProgramme, 10),
        documentUploads,
        signatureDataUrl,
        acceptedAgreementIds
      );
    } catch (submitError) {
      console.error('Step 2 submission failed:', submitError);
    }
  };

  const toggleAgreement = (agreementId: number, accepted: boolean) => {
    setAcceptedAgreementIds((current) =>
      accepted ? [...current, agreementId] : current.filter((id) => id !== agreementId)
    );
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitApplicantInfo(formData);
    } catch (submitError) {
      console.error('Step 1 submission failed:', submitError);
    }
  };

  const handleStep3Submit = () => {
    window.location.href = '/admissions/my-applications';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{t('personalInfo')}</span>
          <span>{t('programmeSelection')}</span>
          <span>{t('confirmation')}</span>
        </div>
      </div>

      {(error || localError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error || localError}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('personalInformation')}</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('firstName')} *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('lastName')} *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('middleName')}
            </label>
            <input
              type="text"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phone')} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('gender')} *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('select')}</option>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dateOfBirth')} *
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('nationality')} *
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('idNumber')}
              </label>
              <input
                type="text"
                name="id_number"
                value={formData.id_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('address')} *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('country')} *
              </label>
              <FormSelect
                value={formData.country}
                onChange={handleCountryChange}
                options={countryOptions.map((c) => ({ value: c.name, label: c.name }))}
                placeholder="Select country"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {subdivision.label}
              </label>
              {subdivisionOptions.length > 0 ? (
                <FormSelect
                  value={formData.state}
                  onChange={(value) => setFormData((prev) => ({ ...prev, state: value }))}
                  options={subdivisionOptions}
                  placeholder={`Select ${subdivision.label.toLowerCase()}`}
                />
              ) : (
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('city')} *
              </label>
              {cityOptions.length > 0 ? (
                <FormSelect
                  value={formData.city}
                  onChange={(value) => setFormData((prev) => ({ ...prev, city: value }))}
                  options={cityOptions.map((city) => ({ value: city, label: city }))}
                  placeholder="Select city"
                  required
                />
              ) : (
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_international"
                checked={formData.is_international}
                onChange={handleInputChange}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">{t('internationalStudent')}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {t('continue')} <ChevronRight size={20} />
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('selectProgramme')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('academicYear')} *
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('selectAcademicYear')}</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.is_current ? `(${t('current')})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('programme')} *
            </label>
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('selectProgrammeOption')}</option>
              {programmes.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.name} ({prog.code})
                </option>
              ))}
            </select>
          </div>

          {selectedProgramme && (
            <>
              <ProgrammeDocumentUploadList
                requirements={selectedProgrammeData?.required_documents || []}
                uploads={documentUploads}
                onChange={setDocumentUploads}
                submitProgress={uploadProgress}
                submitting={loading}
              />

              {activeAgreements.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('applicationAgreements')}</h3>
                  <p className="mb-3 text-xs text-slate-500">{t('applicationAgreementsHint')}</p>
                  <ApplicationAgreementSection
                    agreements={activeAgreements}
                    acceptedIds={acceptedAgreementIds}
                    onToggle={toggleAgreement}
                  />
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('applicantSignature')}</h3>
                <p className="mb-3 text-xs text-slate-500">{t('applicantSignatureHint')}</p>
                <SignaturePad
                  label={t('applicantSignature')}
                  value={signatureDataUrl}
                  onConfirm={setSignatureDataUrl}
                />
              </div>
            </>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setStep(1);
              }}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300"
            >
              {t('back')}
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProgramme}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {t('continue')} <ChevronRight size={20} />
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('applicationSubmitted')}</h2>
            <p className="text-gray-600">{t('applicationSubmittedDesc')}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">{t('applicationNumber')}</p>
            <p className="text-lg font-mono text-blue-600 mb-4">{applicationNumber || '—'}</p>

            <p className="text-sm font-semibold text-gray-700 mb-2">{t('nextSteps')}</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>{t('nextPayFee')}</li>
              <li>{t('nextRegistryReview')}</li>
              <li>{t('nextDepartmentReview')}</li>
              <li>{t('nextAdmissionDecision')}</li>
              <li>{t('nextAcceptIfApproved')}</li>
            </ul>
          </div>

          <button
            onClick={handleStep3Submit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            {t('proceedToPayment')} <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
