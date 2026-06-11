import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ClipboardList,
  GraduationCap,
  UserCheck,
  Users,
  Wallet,
  BookOpen,
  Bell,
} from 'lucide-react';
import DashboardStatCard from '../ui/DashboardStatCard';
import { useAuth } from '../../context/AuthContext';
import {
  fetchDepartmentDashboard,
  fetchFinanceDashboard,
  fetchPendingCourseApprovals,
  fetchRegistrarDashboard,
  fetchRegistryDashboard,
} from '../../api/admissions';
import { fetchFeeReports } from '../../api/fees';
import { useFormatMoney } from '../../hooks/useFormatMoney';

type QuickLink = {
  label: string;
  to: string;
  description: string;
};

export default function StaffDashboardOverview() {
  const { user, institution, canAccess, enabledModules } = useAuth();
  const { formatMoney } = useFormatMoney();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number | string>>({});

  const institutionName = (institution?.name as string) || 'Your institution';
  const userName = (user?.name as string) || 'User';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const next: Record<string, number | string> = {};

      const tasks: Array<Promise<void>> = [];

      if (canAccess({ permissions: ['admissions.registry.review'] })) {
        tasks.push(
          fetchRegistryDashboard()
            .then((res) => {
              next.registry_awaiting = res.data?.awaiting_review ?? 0;
              next.registry_reviewed = res.data?.registry_reviewed ?? 0;
            })
            .catch(() => undefined),
        );
      }

      if (canAccess({ permissions: ['admissions.department.review'] })) {
        tasks.push(
          fetchDepartmentDashboard()
            .then((res) => {
              next.department_pending = res.data?.pending_review ?? 0;
            })
            .catch(() => undefined),
        );
      }

      if (canAccess({ permissions: ['admissions.registrar.admit'] })) {
        tasks.push(
          fetchRegistrarDashboard()
            .then((res) => {
              next.registrar_ready = res.data?.ready_for_admission ?? 0;
              next.registrar_enrolled = res.data?.enrolled ?? 0;
            })
            .catch(() => undefined),
        );
      }

      if (canAccess({ permissions: ['admissions.finance.verify'] })) {
        tasks.push(
          fetchFinanceDashboard()
            .then((res) => {
              next.finance_pending = res.data?.pending_verification ?? 0;
              next.finance_verified_today = res.data?.verified_today ?? 0;
              next.tuition_collected = Number(res.data?.tuition_collected ?? 0);
            })
            .catch(() => undefined),
        );
      }

      if (canAccess({ permissions: ['admissions.hod.approve'] })) {
        tasks.push(
          fetchPendingCourseApprovals()
            .then((res) => {
              const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
              next.hod_pending_courses = items.length;
            })
            .catch(() => undefined),
        );
      }

      if (canAccess({ permissions: ['fees.view', 'fees.manage', 'admissions.finance.verify'] })) {
        tasks.push(
          fetchFeeReports()
            .then((res) => {
              next.fees_overdue = res.summary?.overdue ?? 0;
              next.fees_pending = res.summary?.pending ?? 0;
              next.fees_outstanding = Number(res.summary?.total_outstanding ?? 0);
            })
            .catch(() => undefined),
        );
      }

      await Promise.all(tasks);
      if (!cancelled) {
        setStats(next);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [canAccess]);

  const canViewInstitutions = canAccess({ permissions: ['institutions.view', 'institutions.create', 'institutions.edit'] });
  const canViewUsers = canAccess({ permissions: ['users.view', 'view_users', 'manage_users', 'view_students'] });

  const quickLinks = useMemo(() => {
    const links: QuickLink[] = [];

    if (canAccess({ permissions: ['admissions.view', 'admissions.manage'] })) {
      links.push({ label: 'All applications', to: '/admissions/applications', description: 'Review every admission record' });
    }
    if (canAccess({ permissions: ['admissions.registry.review'] })) {
      links.push({ label: 'Registry review', to: '/admissions/registry', description: 'Verify documents and fees' });
    }
    if (canAccess({ permissions: ['admissions.department.review'] })) {
      links.push({ label: 'Department review', to: '/admissions/department', description: 'Approve or reject applicants' });
    }
    if (canAccess({ permissions: ['admissions.registrar.admit'] })) {
      links.push({ label: 'Registrar admissions', to: '/admissions/registrar', description: 'Send letters and admit students' });
    }
    if (canAccess({ permissions: ['admissions.finance.verify'] })) {
      links.push({ label: 'Finance verification', to: '/admissions/finance', description: 'Verify tuition and issue registration numbers' });
    }
    if (canAccess({ permissions: ['admissions.hod.approve'] })) {
      links.push({ label: 'HOD course approvals', to: '/admissions/hod-courses', description: 'Approve registered subjects' });
    }
    if (canAccess({ permissions: ['fees.view', 'fees.manage', 'admissions.finance.verify'] })) {
      links.push({ label: 'Fees & payments', to: '/fees', description: 'Semester fees and collections' });
    }
    if (enabledModules.includes('hostel')) {
      links.push({ label: 'Hostel', to: '/hostel', description: 'Registrations, rooms, and allocations' });
    }
    if (enabledModules.includes('canteen')) {
      links.push({ label: 'Canteen', to: '/canteen', description: 'Meals, wallets, and subscriptions' });
    }
    if (canAccess({ permissions: ['users.view', 'view_users', 'manage_users', 'view_students'] })) {
      links.push({ label: 'Students', to: '/users/students', description: 'Student accounts and records' });
    }
    if (canAccess({ permissions: ['institutions.view', 'institutions.manage'] })) {
      links.push({ label: 'Institutions', to: '/institutions', description: 'Institution profile and settings' });
    }

    return links;
  }, [canAccess, enabledModules]);

  const statCards = [
    canAccess({ permissions: ['admissions.registry.review'] }) && stats.registry_awaiting != null
      ? { key: 'registry_awaiting', label: 'Awaiting registry review', value: stats.registry_awaiting, to: '/admissions/registry', icon: ClipboardList }
      : null,
    canAccess({ permissions: ['admissions.department.review'] }) && stats.department_pending != null
      ? { key: 'department_pending', label: 'Department pending', value: stats.department_pending, to: '/admissions/department', icon: UserCheck }
      : null,
    canAccess({ permissions: ['admissions.registrar.admit'] }) && stats.registrar_ready != null
      ? { key: 'registrar_ready', label: 'Ready for admission', value: stats.registrar_ready, to: '/admissions/registrar', icon: GraduationCap }
      : null,
    canAccess({ permissions: ['admissions.finance.verify'] }) && stats.finance_pending != null
      ? { key: 'finance_pending', label: 'Tuition pending verification', value: stats.finance_pending, to: '/admissions/finance', icon: Wallet }
      : null,
    canAccess({ permissions: ['admissions.hod.approve'] }) && stats.hod_pending_courses != null
      ? { key: 'hod_pending', label: 'Courses awaiting HOD', value: stats.hod_pending_courses, to: '/admissions/hod-courses', icon: BookOpen }
      : null,
    canAccess({ permissions: ['fees.view', 'fees.manage', 'admissions.finance.verify'] }) && stats.fees_overdue != null
      ? { key: 'fees_overdue', label: 'Overdue semester fees', value: stats.fees_overdue, to: '/fees', icon: Wallet }
      : null,
    canAccess({ permissions: ['admissions.registrar.admit'] }) && stats.registrar_enrolled != null
      ? { key: 'registrar_enrolled', label: 'Enrolled students', value: stats.registrar_enrolled, to: '/admissions/applications', icon: Users }
      : null,
    canAccess({ permissions: ['admissions.finance.verify'] }) && stats.tuition_collected != null
      ? { key: 'tuition_collected', label: 'Tuition collected', value: formatMoney(Number(stats.tuition_collected)), to: '/admissions/finance', icon: Wallet }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; value: string | number; to: string; icon: typeof ClipboardList }>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-blue-100">Welcome back</p>
            <h2 className="mt-1 text-2xl font-semibold">{userName}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-blue-100">
              <Building2 className="h-4 w-4" />
              {institutionName}
            </p>
          </div>
          <Link
            to="/admissions"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            Admissions overview
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {canViewInstitutions && (
          <DashboardStatCard label="Institution" value={institutionName} to="/institutions" icon={Building2} hint="Manage institution profile" />
        )}
        <DashboardStatCard label="Admissions module" value="Open" to="/admissions" icon={GraduationCap} hint="Workflow and applications" />
        <DashboardStatCard label="Notifications" value="View" to="/notifications" icon={Bell} hint="System alerts and updates" />
        {canViewUsers && (
          <DashboardStatCard label="Users" value="Manage" to="/users" icon={Users} hint="Students, staff, and accounts" />
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading dashboard metrics…</p>
      ) : statCards.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Pending actions</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <DashboardStatCard
                key={card.key}
                label={card.label}
                value={card.value}
                to={card.to}
                icon={card.icon}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Quick access</h3>
          <p className="mt-1 text-sm text-slate-500">Jump directly to the modules and tasks available for your role.</p>
          <ul className="mt-4 divide-y divide-slate-100">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="flex flex-col gap-0.5 py-3 hover:text-[#1e3a5f]">
                  <span className="font-medium text-slate-900">{link.label}</span>
                  <span className="text-sm text-slate-500">{link.description}</span>
                </Link>
              </li>
            ))}
            {!quickLinks.length && (
              <li className="py-3 text-sm text-slate-500">Use the sidebar to open modules enabled for your account.</li>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">Mandatory checks</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Review pending admissions before department approval.</li>
              <li>• Verify registration fee proofs in registry.</li>
              <li>• Confirm tuition payment before enrollment.</li>
              <li>• Approve programme subjects registered by students.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <strong>Tip:</strong> Every stat card on this dashboard is clickable and opens the related screen.
          </div>
        </div>
      </div>
    </div>
  );
}
