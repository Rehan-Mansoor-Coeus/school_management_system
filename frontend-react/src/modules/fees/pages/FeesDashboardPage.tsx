import { useEffect, useState } from 'react';
import { fetchFeeReports, fetchFees } from '../../../api/fees';
import { useFormatMoney } from '../../../hooks/useFormatMoney';
import DashboardStatCard from '../../../components/ui/DashboardStatCard';

const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  partial: 'Partial payment',
  due: 'Due',
  overdue: 'Overdue',
};

export default function FeesDashboardPage() {
  const { formatMoney } = useFormatMoney();
  const [fees, setFees] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [feesRes, reportsRes] = await Promise.all([
        fetchFees(statusFilter ? { payment_status: statusFilter } : {}),
        fetchFeeReports(),
      ]);
      setFees(feesRes.data || feesRes || []);
      setReports(reportsRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Fees & Payments</h1>
        <p className="text-sm text-slate-500">Semester tuition tracking, installments, and collection reports.</p>
      </div>

      {reports?.summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {Object.entries(reports.summary).map(([key, value]) => {
            const filterable = ['paid', 'pending', 'partial', 'due', 'overdue'].includes(key);
            return (
              <DashboardStatCard
                key={key}
                label={key.replace(/_/g, ' ')}
                value={String(value)}
                onClick={filterable ? () => setStatusFilter(key) : undefined}
                hint={filterable ? 'Filter table below' : undefined}
              />
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">Filter by payment status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Student</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Programme</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Semester</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Total</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Paid</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Balance</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Expected</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Latest</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : fees.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No semester fee records yet.</td></tr>
            ) : fees.map((fee: any) => (
              <tr key={fee.id}>
                <td className="px-4 py-3">{fee.student?.name || fee.student?.registration_number || '—'}</td>
                <td className="px-4 py-3">{fee.programme?.name || '—'}</td>
                <td className="px-4 py-3">{fee.semester_name || fee.semester?.name || '—'}</td>
                <td className="px-4 py-3">{formatMoney(fee.total_amount || 0)}</td>
                <td className="px-4 py-3">{formatMoney(fee.amount_paid || 0)}</td>
                <td className="px-4 py-3">{formatMoney(fee.balance || 0)}</td>
                <td className="px-4 py-3">{fee.expected_payment_date || fee.due_date || '—'}</td>
                <td className="px-4 py-3">{fee.latest_payment_date || '—'}</td>
                <td className="px-4 py-3 capitalize">{STATUS_LABELS[fee.payment_status] || fee.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
