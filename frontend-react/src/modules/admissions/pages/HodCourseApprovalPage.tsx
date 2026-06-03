import { useEffect, useState } from 'react';
import { approveCourseRegistration, fetchPendingCourseApprovals } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';

type Registration = {
  id: number;
  status: string;
  student?: { registration_number?: string; user?: { name?: string } };
  course?: { name?: string; code?: string };
  subject?: { name?: string; code?: string };
};

export default function HodCourseApprovalPage() {
  const { t } = useAdmissionsI18n();
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  const load = async () => {
    const res = await fetchPendingCourseApprovals();
    setRegistrations(res.data?.data || res.data || []);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: number) => {
    await approveCourseRegistration(id);
    await load();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">{t('hodTitle')}</h2>
      {!registrations.length && <p className="text-sm text-slate-500">{t('hodNoPending')}</p>}
      {registrations.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
          <div>
            <div className="font-medium">{(r.subject || r.course)?.code} — {(r.subject || r.course)?.name}</div>
            <div className="text-sm text-slate-500">{r.student?.user?.name || r.student?.registration_number}</div>
          </div>
          <button type="button" onClick={() => approve(r.id)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white">{t('approve')}</button>
        </div>
      ))}
    </div>
  );
}
