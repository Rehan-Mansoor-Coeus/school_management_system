import { useAuth } from '../context/AuthContext';
import StaffDashboardOverview from '../components/dashboard/StaffDashboardOverview';
import StudentAdmissionsStats from '../modules/admissions/components/StudentAdmissionsStats';

export default function Dashboard() {
  const { hasAnyRole, canAccess } = useAuth();
  const isStudent = hasAnyRole(['student']) || canAccess({ permissions: ['admissions.apply'] });

  if (isStudent) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your applications, fees, enrollment status, and next steps at a glance.
          </p>
        </div>
        <StudentAdmissionsStats />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Institution overview, pending tasks, and quick links for your role.
        </p>
      </div>
      <StaffDashboardOverview />
    </div>
  );
}
