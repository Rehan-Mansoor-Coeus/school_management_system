import { useEffect, useMemo, useState } from 'react';
import { bulkApproveCourseRegistrations, fetchPendingCourseApprovals } from '../../../api/admissions';
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
  const [busyStudentId, setBusyStudentId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchPendingCourseApprovals();
      const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setRegistrations(items);
    } catch {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stacks = useMemo(() => groupByStudent(registrations), [registrations]);

  const approveAll = async (studentId: number) => {
    setBusyStudentId(studentId);
    try {
      await bulkApproveCourseRegistrations(studentId);
      await load();
    } finally {
      setBusyStudentId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">{t('hodTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('hodSubtitle')}</p>
      </div>

      {loading && <p className="text-sm text-slate-500">{t('loading')}</p>}

      {!loading && !stacks.length && (
        <p className="text-sm text-slate-500">{t('hodNoPending')}</p>
      )}

      <div className="space-y-4">
        {stacks.map((stack) => {
          const studentName = stack.student?.user?.name || stack.student?.registration_number || t('hodStudentFallback');
          const courseCount = stack.registrations.length;

          return (
            <div key={stack.studentId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
                <div>
                  <div className="font-semibold text-slate-900">{studentName}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {stack.student?.registration_number}
                    {stack.student?.programme?.name ? ` · ${stack.student.programme.name}` : ''}
                  </div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-700">
                    {t('hodPendingCourses').replace(':count', String(courseCount))}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyStudentId === stack.studentId}
                  onClick={() => approveAll(stack.studentId)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busyStudentId === stack.studentId ? t('loading') : t('hodApproveAll')}
                </button>
              </div>

              <ul className="divide-y divide-slate-100">
                {stack.registrations.map((registration) => {
                  const course = registration.subject || registration.course;
                  return (
                    <li key={registration.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div>
                        <div className="font-medium text-slate-900">
                          {course?.code} — {course?.name}
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {t('hodCourseStatusPending')}
                      </span>
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
