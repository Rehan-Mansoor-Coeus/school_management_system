import { useEffect, useState } from 'react';
import type { Application } from '../types';
import { decideDepartmentApplication, fetchDepartmentPending } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';

export default function DepartmentPage() {
  const { t } = useAdmissionsI18n();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const load = async () => {
    const res = await fetchDepartmentPending();
    setApplications(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    await decideDepartmentApplication(selected.id, {
      status,
      admission_comment: comment || undefined,
      rejection_reason: status === 'rejected' ? rejectionReason : undefined,
    });
    setSelected(null);
    await load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="font-semibold">{t('departmentPendingTitle')}</h2>
        {applications.map((app) => (
          <button key={app.id} type="button" onClick={() => setSelected(app)} className={`w-full rounded-xl border p-4 text-left ${selected?.id === app.id ? 'border-[#1e3a5f] bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <div className="font-medium">{app.application_number}</div>
            <div className="text-sm text-slate-500">{app.programme?.name}</div>
          </button>
        ))}
        {!applications.length && <p className="text-sm text-slate-500">{t('departmentNoPending')}</p>}
      </div>
      <div className="rounded-2xl border bg-white p-5">
        {selected ? (
          <>
            <textarea className="w-full border rounded-lg p-2 text-sm mb-2" rows={3} placeholder={t('comment')} value={comment} onChange={(e) => setComment(e.target.value)} />
            <textarea className="w-full border rounded-lg p-2 text-sm mb-3" rows={2} placeholder={t('rejectionReason')} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm" onClick={() => submit('approved')}>{t('approve')}</button>
              <button type="button" className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm" onClick={() => submit('rejected')}>{t('reject')}</button>
            </div>
          </>
        ) : <p className="text-sm text-slate-500">{t('departmentSelectHint')}</p>}
      </div>
    </div>
  );
}
