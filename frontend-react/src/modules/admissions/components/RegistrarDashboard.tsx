import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Download } from 'lucide-react';
import AdmissionsService from '../services/AdmissionsService';
import { Application } from '../types';
import DashboardStatCard from '../../../components/ui/DashboardStatCard';

export const RegistrarDashboard: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({
    ready_for_admission: 0,
    admitted: 0,
    enrolled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [admittingId, setAdmittingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsResponse, statsResponse] = await Promise.all([
        AdmissionsService.getReadyForAdmission(),
        AdmissionsService.getRegistrarDashboard(),
      ]);

      setApplications(appsResponse.data || []);
      setStats(statsResponse.data || {});
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdmit = async (applicationId: number) => {
    setAdmittingId(applicationId);
    try {
      await AdmissionsService.admitStudent(applicationId);
      fetchData();
    } catch (error) {
      console.error('Failed to admit student:', error);
    } finally {
      setAdmittingId(null);
    }
  };

  const handleDownloadLetter = (appNumber: string) => {
    // Implementation to download admission letter PDF
    window.open(`/api/admissions/letters/${appNumber}/download`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Registrar Dashboard</h1>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <DashboardStatCard label="Ready for Admission" value={stats.ready_for_admission} to="/admissions/registrar" className="border-l-4 border-yellow-500" />
        <DashboardStatCard label="Admitted" value={stats.admitted} to="/admissions/applications" className="border-l-4 border-green-500" />
        <DashboardStatCard label="Enrolled" value={stats.enrolled} to="/admissions/applications" className="border-l-4 border-blue-500" />
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Ready for Admission</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No applications ready for admission
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
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Programme
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      <Link to={`/admissions/applications/${app.id}`} className="text-blue-600 hover:underline">
                        {app.application_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {app.applicant.full_name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {app.applicant.email}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {app.programme.name}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadLetter(app.application_number)}
                          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                        >
                          <Download size={16} />
                          Letter
                        </button>
                        <button
                          onClick={() => handleAdmit(app.id)}
                          disabled={admittingId === app.id}
                          className="text-green-600 hover:text-green-800 font-semibold flex items-center gap-1 disabled:text-gray-400"
                        >
                          <CheckCircle size={16} />
                          {admittingId === app.id ? 'Admitting...' : 'Admit'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
