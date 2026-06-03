import { useEffect, useState } from 'react';
import type { Application } from '../types';
import { admitStudent, fetchRegistrarReady } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';

export default function RegistrarAdmissionsPage() {
  const { t } = useAdmissionsI18n();
  const [applications, setApplications] = useState<Application[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    const res = await fetchRegistrarReady();
    setApplications(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const handleAdmit = async (id: number) => {
    setBusy(id);
    try {
      await admitStudent(id);
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">{t('registrarReadyTitle')}</h2>
      {!applications.length && <p className="text-sm text-slate-500">{t('registrarNoReady')}</p>}
      {applications.map((app) => (
        <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
          <div>
            <div className="font-medium">{app.application_number}</div>
            <div className="text-sm text-slate-500">{app.applicant?.first_name} {app.applicant?.last_name} · {app.programme?.name}</div>
          </div>
          <button type="button" disabled={busy === app.id} onClick={() => handleAdmit(app.id)} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm text-white disabled:opacity-50">
            {t('admitAndSendLetter')}
          </button>
        </div>
      ))}
    </div>
  );
}
