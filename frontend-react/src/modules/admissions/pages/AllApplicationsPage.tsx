import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Application } from '../types';
import { fetchAllApplications } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { statusLabelKey } from '../../../i18n/admissions';
import { ColoredTabsBar, type TabColor } from '../../../components/ui/ColoredModuleTabsNav';

export default function AllApplicationsPage() {
  const { t } = useAdmissionsI18n();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchAllApplications({ page, status: status || undefined, search: search || undefined })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : (res.data as { data?: Application[] })?.data || [];
        setApplications(list);
        setTotalPages(res.pagination?.last_page || 1);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setApplications([]);
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(message || t('loadApplicationsFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status, search]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t('allApplications')}</h2>
        <p className="text-sm text-slate-500">{t('allApplicationsSubtitle')}</p>
      </div>

      <ColoredTabsBar
        items={[
          { id: '', label: t('allStatuses'), color: 'navy' as TabColor },
          { id: 'submitted', label: t(statusLabelKey('submitted')), color: 'amber' as TabColor },
          { id: 'admitted', label: t(statusLabelKey('admitted')), color: 'purple' as TabColor },
          { id: 'enrolled', label: t(statusLabelKey('enrolled')), color: 'emerald' as TabColor },
          { id: 'rejected', label: t(statusLabelKey('rejected')), color: 'rose' as TabColor },
        ]}
        activeId={status}
        onChange={(id) => { setStatus(id); setPage(1); }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('searchApplications')}
          className="min-w-[220px] flex-1 rounded-lg border border-indigo-200 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">{t('loadingApplications')}</p>
      ) : !applications.length ? (
        <p className="text-slate-500">{t('noApplicationsFound')}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">{t('applicationNumber')}</th>
                <th className="px-4 py-3 font-medium">{t('applicantName')}</th>
                <th className="px-4 py-3 font-medium">{t('programme')}</th>
                <th className="px-4 py-3 font-medium">{t('status')}</th>
                <th className="px-4 py-3 font-medium">{t('submittedAt')}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{app.application_number}</td>
                  <td className="px-4 py-3">{app.applicant?.full_name || `${app.applicant?.first_name || ''} ${app.applicant?.last_name || ''}`.trim()}</td>
                  <td className="px-4 py-3">{app.programme?.name}</td>
                  <td className="px-4 py-3">{t(statusLabelKey(app.status))}</td>
                  <td className="px-4 py-3">{app.created_at}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admissions/applications/${app.id}`} className="text-[#1e3a5f] hover:underline">
                      {t('viewDetails')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">
            {t('previousPage')}
          </button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">
            {t('nextPage')}
          </button>
        </div>
      )}
    </div>
  );
}
