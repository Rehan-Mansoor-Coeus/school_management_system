import React, { useState } from 'react';
import { ChevronRight, Upload } from 'lucide-react';
import { useApplicationForm } from '../hooks/useApplicationForm';
import api from '@/api';

interface Programme {
  id: number;
  name: string;
  code: string;
}

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

export const ApplicationForm: React.FC = () => {
  const { step, loading, error, applicant, submitApplicantInfo, submitApplication, reset } =
    useApplicationForm();

  const [programmes, setProgrammes] = React.useState<Programme[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYear[]>([]);

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
    city: '',
    state: '',
    country: '',
    is_international: false,
  });

  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [documents, setDocuments] = useState<{ passport?: File; transcript?: File }>({});

  React.useEffect(() => {
    fetchProgrammes();
    fetchAcademicYears();
  }, []);

  const fetchProgrammes = async () => {
    try {
      const response = await api.get('/programmes');
      setProgrammes(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch programmes:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academic-years');
      setAcademicYears(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files?.[0]) {
      setDocuments((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitApplicantInfo(formData);
    } catch (err) {
      console.error('Step 1 submission failed:', err);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitApplication(
        parseInt(selectedAcademicYear),
        parseInt(selectedProgramme),
        documents
      );
    } catch (err) {
      console.error('Step 2 submission failed:', err);
    }
  };

  const handleStep3Submit = () => {
    // Go to payment or confirmation page
    window.location.href = '/admissions/payment';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
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
          <span>Personal Info</span>
          <span>Programme Selection</span>
          <span>Confirmation</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Step 1: Personal Information */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
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
                Last Name *
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
              Middle Name
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
                Email *
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
                Phone *
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
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
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
                Nationality *
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
                ID Number
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
              Address *
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

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              <span className="text-sm text-gray-700">International Student</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            Continue <ChevronRight size={20} />
          </button>
        </form>
      )}

      {/* Step 2: Programme and Academic Year */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Select Programme</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year *
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programme *
            </label>
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Programme</option>
              {programmes.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.name} ({prog.code})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passport/ID
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                name="passport"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
                id="passport-upload"
              />
              <label htmlFor="passport-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={24} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {documents.passport
                    ? documents.passport.name
                    : 'Click to upload or drag and drop'}
                </span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Transcript
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                name="transcript"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
                id="transcript-upload"
              />
              <label htmlFor="transcript-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={24} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {documents.transcript
                    ? documents.transcript.name
                    : 'Click to upload or drag and drop'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={20} />
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted</h2>
            <p className="text-gray-600">Your application has been successfully submitted.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">Application Number:</p>
            <p className="text-lg font-mono text-blue-600 mb-4">APP-2024-000001</p>

            <p className="text-sm font-semibold text-gray-700 mb-2">Next Steps:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Pay the application fee</li>
              <li>Wait for admission board review</li>
              <li>Receive admission decision</li>
              <li>Accept admission if approved</li>
            </ul>
          </div>

          <button
            onClick={handleStep3Submit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            Proceed to Payment <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
