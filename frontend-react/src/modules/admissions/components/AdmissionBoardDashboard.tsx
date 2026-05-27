import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import AdmissionsService from '../services/AdmissionsService';
import { Application } from '../types';

export const AdmissionBoardDashboard: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({
    total_applications: 0,
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsResponse, statsResponse] = await Promise.all([
        AdmissionsService.getPendingApplications(),
        AdmissionsService.getBoardDashboard(),
      ]);

      setApplications(appsResponse.data || []);
      setStats(statsResponse.data || {});
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (app: Application) => {
    setSelectedApp(app);
    try {
      await AdmissionsService.reviewApplication(app.id);
      fetchData();
    } catch (error) {
      console.error('Failed to review application:', error);
    }
  };

  const handleDecision = async () => {
    if (!selectedApp || !decision) return;

    try {
      await AdmissionsService.decideApplication(
        selectedApp.id,
        decision,
        decision === 'rejected' ? rejectionReason : undefined
      );
      setSelectedApp(null);
      setDecision(null);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      console.error('Failed to process decision:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badgeClass = {
      submitted: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badgeClass[status as keyof typeof badgeClass] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admission Board Dashboard</h1>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Applications</p>
          <p className="text-3xl font-bold text-gray-800">{stats.total_applications}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Under Review</p>
          <p className="text-3xl font-bold text-blue-600">{stats.under_review}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Approved</p>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Pending Applications</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No pending applications
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Application #
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Programme
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {app.application_number}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {app.applicant.full_name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {app.programme.name}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() => handleReview(app)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Review Application</h3>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Applicant</p>
                <p className="text-lg font-semibold text-gray-800">
                  {selectedApp.applicant.full_name}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Programme</p>
                <p className="text-lg font-semibold text-gray-800">
                  {selectedApp.programme.name}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDecision('approved')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                      decision === 'approved'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <CheckCircle className="inline mr-2" size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => setDecision('rejected')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                      decision === 'rejected'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <XCircle className="inline mr-2" size={18} />
                    Reject
                  </button>
                </div>
              </div>

              {decision === 'rejected' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecision}
                  disabled={!decision}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Submit Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
