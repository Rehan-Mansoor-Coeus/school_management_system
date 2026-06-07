import React from 'react';
import { useAuth } from '../context/AuthContext';
import StudentAdmissionsStats from '../modules/admissions/components/StudentAdmissionsStats';

export default function Dashboard() {
  const { hasAnyRole, canAccess } = useAuth();
  const isStudent = hasAnyRole(['student']) || canAccess({ permissions: ['admissions.apply'] });

  if (isStudent) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Your admission applications and progress at a glance.</p>
        </div>
        <StudentAdmissionsStats />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="text-sm text-gray-500">Overview</h3>
          <p className="text-sm text-slate-600 mt-2">Use the sidebar to open modules for your role.</p>
        </div>
      </div>
    </div>
  );
}
