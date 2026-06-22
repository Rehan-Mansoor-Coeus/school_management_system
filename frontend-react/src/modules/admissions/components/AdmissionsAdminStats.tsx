import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchAdmissionsAdminDashboard } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import DashboardStatCard from '../../../components/ui/DashboardStatCard';

type DashboardData = {
  total_applications: number;
  active_applications: number;
  enrolled_count: number;
  pending_fee_count: number;
  by_status: Record<string, number>;
  pipeline: Record<string, number>;
};

const PIPELINE_COLORS = ['#1e3a5f', '#2563eb', '#0891b2', '#059669', '#ca8a04', '#ea580c', '#16a34a', '#dc2626', '#64748b'];

export default function AdmissionsAdminStats() {
  const { t } = useAdmissionsI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmissionsAdminDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const pipelineChart = useMemo(() => {
    if (!data?.pipeline) return [];
    return Object.entries(data.pipeline)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({ name: key.replace(/_/g, ' '), value }));
  }, [data]);

  const statusChart = useMemo(() => {
    if (!data?.by_status) return [];
    return Object.entries(data.by_status).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [data]);

  if (loading) {
    return <p className="text-sm text-slate-500">{t('loading')}</p>;
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Could not load admissions dashboard stats.
      </div>
    );
  }

  const stats = [
    { label: t('statTotalApplications'), value: data.total_applications, to: '/admissions/applications' },
    { label: t('statActiveApplications'), value: data.active_applications, to: '/admissions/applications' },
    { label: t('statEnrolled'), value: data.enrolled_count, to: '/admissions/applications?status=enrolled' },
    { label: t('statPendingFee'), value: data.pending_fee_count, to: '/admissions/applications?status=submitted' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <DashboardStatCard key={stat.label} label={stat.label} value={stat.value} to={stat.to} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-900">Admission pipeline</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#1e3a5f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-900">Applications by status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                  {statusChart.map((entry, index) => (
                    <Cell key={entry.name} fill={PIPELINE_COLORS[index % PIPELINE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-900">Quick review links</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/admissions/registry" className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200">Registry review</Link>
          <Link to="/admissions/department" className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200">Department review</Link>
          <Link to="/admissions/registrar" className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200">Registrar</Link>
          <Link to="/admissions/finance" className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200">Finance</Link>
          <Link to="/admissions/applications" className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-white hover:bg-[#2a4a73]">All applications</Link>
        </div>
      </div>
    </div>
  );
}
