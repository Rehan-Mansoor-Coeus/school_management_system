import { useEffect, useMemo, useState } from 'react';
import {
  approveCourseRegistration,
  bulkApproveCourseRegistrationsByIds,
  bulkRejectCourseRegistrations,
  fetchPendingCourseApprovals,
  rejectCourseRegistration,
} from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';

type Registration = {
  id: number;
  status: string;
  student?: {
    id?: number;
    registration_number?: string;
    user?: { name?: string };
    programme?: { name?: string };
  };
  course?: { name?: string; code?: string };
  subject?: { name?: string; code?: string };
};

type StudentStack = {
  studentId: number;
  student: Registration['student'];
  registrations: Registration[];
};

function groupByStudent(registrations: Registration[]): StudentStack[] {
  const map = new Map<number, StudentStack>();

  for (const registration of registrations) {
    const studentId = registration.student?.id;
    if (!studentId) continue;

    if (!map.has(studentId)) {
      map.set(studentId, {
        studentId,
        student: registration.student,
        registrations: [],
      });
    }

    map.get(studentId)!.registrations.push(registration);
  }

  return Array.from(map.values());
}

export default function HodCourseApprovalPage() {
  const { t } = useAdmissionsI18n();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyStudentId, setBusyStudentId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [activeRejectId, setActiveRejectId] = useState<number | null>(null);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchPendingCourseApprovals();
      const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setRegistrations(items);
      setSelectedIds((current) => current.filter((id) => items.some((item: Registration) => item.id === id)));
    } catch {
      setRegistrations([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stacks = useMemo(() => groupByStudent(registrations), [registrations]);
  const allIds = useMemo(() => registrations.map((registration) => registration.id), [registrations]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  const toggleSelected = (registrationId: number, checked: boolean) => {
    setSelectedIds((current) => (
      checked ? [...current, registrationId] : current.filter((id) => id !== registrationId)
    ));
  };

  const toggleStudent = (stack: StudentStack, checked: boolean) => {
    const ids = stack.registrations.map((registration) => registration.id);
    setSelectedIds((current) => {
      if (!checked) {
        return current.filter((id) => !ids.includes(id));
      }
      return [...new Set([...current, ...ids])];
    });
  };

  const approveSelected = async (ids: number[]) => {
    if (!ids.length) return;
    setBusyStudentId(-1);
    try {
      await bulkApproveCourseRegistrationsByIds(ids);
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      await load();
    } finally {
      setBusyStudentId(null);
    }
  };

  const rejectSelected = async (ids: number[], reason: string) => {
    if (!ids.length || !reason.trim()) return;
    setBusyStudentId(-1);
    try {
      await bulkRejectCourseRegistrations(ids, reason.trim());
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      setBulkRejectOpen(false);
      setActiveRejectId(null);
      setRejectReason('');
      await load();
    } finally {
      setBusyStudentId(null);
    }
  };

  const approveOne = async (registrationId: number) => {
    setBusyId(registrationId);
    try {
      await approveCourseRegistration(registrationId);
      setSelectedIds((current) => current.filter((id) => id !== registrationId));
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const rejectOne = async (registrationId: number) => {
    if (!rejectReason.trim()) return;
    setBusyId(registrationId);
    try {
      await rejectCourseRegistration(registrationId, rejectReason.trim());
      setSelectedIds((current) => current.filter((id) => id !== registrationId));
      setActiveRejectId(null);
      setRejectReason('');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">{t('hodTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('hodSubtitle')}</p>
      </div>

      {!loading && stacks.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => setSelectedIds(event.target.checked ? allIds : [])}
              className="h-4 w-4 rounded border-slate-300"
            />
            {t('hodSelectAll')}
          </label>
          <button
            type="button"
            disabled={!selectedIds.length || busyStudentId !== null}
            onClick={() => approveSelected(selectedIds)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {t('hodApproveSelected')}
          </button>
          <button
            type="button"
            disabled={!selectedIds.length || busyStudentId !== null}
            onClick={() => setBulkRejectOpen(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {t('hodRejectSelected')}
          </button>
        </div>
      )}

      {bulkRejectOpen && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-medium text-red-900">{t('hodRejectSelectedHint')}</p>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={2}
            className="mb-3 w-full rounded-lg border border-red-200 p-2 text-sm"
            placeholder={t('rejectionReason')}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!rejectReason.trim() || busyStudentId !== null}
              onClick={() => rejectSelected(selectedIds, rejectReason)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {t('reject')}
            </button>
            <button
              type="button"
              onClick={() => { setBulkRejectOpen(false); setRejectReason(''); }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">{t('loading')}</p>}

      {!loading && !stacks.length && (
        <p className="text-sm text-slate-500">{t('hodNoPending')}</p>
      )}

      <div className="space-y-4">
        {stacks.map((stack) => {
          const studentName = stack.student?.user?.name || stack.student?.registration_number || t('hodStudentFallback');
          const courseCount = stack.registrations.length;
          const stackIds = stack.registrations.map((registration) => registration.id);
          const stackAllSelected = stackIds.every((id) => selectedIds.includes(id));

          return (
            <div key={stack.studentId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
                <div>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stackAllSelected}
                      onChange={(event) => toggleStudent(stack, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="font-semibold text-slate-900">{studentName}</span>
                  </label>
                  <div className="mt-1 text-sm text-slate-500">
                    {stack.student?.registration_number}
                    {stack.student?.programme?.name ? ` · ${stack.student.programme.name}` : ''}
                  </div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-700">
                    {t('hodPendingCourses').replace(':count', String(courseCount))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyStudentId === stack.studentId}
                    onClick={() => approveSelected(stackIds)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {busyStudentId === stack.studentId ? t('loading') : t('hodApproveAll')}
                  </button>
                </div>
              </div>

              <ul className="divide-y divide-slate-100">
                {stack.registrations.map((registration) => {
                  const course = registration.subject || registration.course;
                  return (
                    <li key={registration.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <label className="flex flex-1 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(registration.id)}
                          onChange={(event) => toggleSelected(registration.id, event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <div>
                          <div className="font-medium text-slate-900">
                            {course?.code} — {course?.name}
                          </div>
                        </div>
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          {t('hodCourseStatusPending')}
                        </span>
                        <button
                          type="button"
                          disabled={busyId === registration.id}
                          onClick={() => approveOne(registration.id)}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                          {t('approve')}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === registration.id}
                          onClick={() => {
                            setActiveRejectId(registration.id);
                            setRejectReason('');
                          }}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                          {t('reject')}
                        </button>
                      </div>
                      {activeRejectId === registration.id && (
                        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3">
                          <textarea
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            rows={2}
                            className="mb-2 w-full rounded-lg border border-red-200 p-2 text-sm"
                            placeholder={t('rejectionReason')}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={!rejectReason.trim() || busyId === registration.id}
                              onClick={() => rejectOne(registration.id)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                            >
                              {t('reject')}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setActiveRejectId(null); setRejectReason(''); }}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
