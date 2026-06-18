import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAvailableCourses, registerCourses } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';

type Course = { id: number; name: string; code: string; credit_units: number; programme_semester_id?: number | null; is_required?: boolean };

type Registration = {
  id: number;
  subject_id?: number | null;
  status: string;
  approved_by_hod?: boolean;
  rejection_reason?: string | null;
  subject?: { id: number; name: string; code: string };
  course?: { id: number; name: string; code: string };
};

function registrationSubjectId(registration: Registration): number | null {
  return registration.subject_id ?? registration.subject?.id ?? registration.course?.id ?? null;
}

function isActiveRegistration(registration: Registration): boolean {
  return registration.status === 'registered' || registration.status === 'completed';
}

function registrationStatusKey(registration: Registration): string {
  if (registration.status === 'rejected') return 'courseStatusRejected';
  if (registration.status === 'completed' || registration.approved_by_hod) return 'courseStatusApproved';
  return 'courseStatusPending';
}

export default function CourseRegistrationPage() {
  const { t } = useAdmissionsI18n();
  const [courses, setCourses] = useState<Course[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [emptyReason, setEmptyReason] = useState<'no_student' | 'no_subjects' | 'unknown' | null>(null);
  const [serverMessage, setServerMessage] = useState('');

  const registeredSubjectIds = useMemo(() => {
    const ids = new Set<number>();
    for (const registration of registrations) {
      if (!isActiveRegistration(registration)) continue;
      const subjectId = registrationSubjectId(registration);
      if (subjectId) ids.add(subjectId);
    }
    return ids;
  }, [registrations]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { courses: list, registrations: mine, reason, message: apiMessage } = await fetchAvailableCourses();
      setCourses(list);
      setRegistrations(mine);
      setEmptyReason(list.length ? null : (reason === 'no_student' || reason === 'no_subjects' ? reason : 'unknown'));
      setServerMessage(apiMessage || '');
      const mandatoryIds = list.filter((course) => course.is_required).map((course) => course.id);
      setSelected((prev) => {
        const registeredIds = new Set<number>();
        for (const registration of mine) {
          if (!isActiveRegistration(registration)) continue;
          const subjectId = registrationSubjectId(registration);
          if (subjectId) registeredIds.add(subjectId);
        }
        const selectableMandatory = mandatoryIds.filter((id) => !registeredIds.has(id));
        const optionalSelected = prev.filter((id) => !mandatoryIds.includes(id) && !registeredIds.has(id));
        return [...new Set([...selectableMandatory, ...optionalSelected])];
      });
    } catch {
      setCourses([]);
      setRegistrations([]);
      setEmptyReason('unknown');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!selected.length) return;
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const semesterId = courses.find((course) => selected.includes(course.id))?.programme_semester_id ?? undefined;
      await registerCourses(selected, semesterId);
      setMessage(t('coursesRegistered'));
      setSelected([]);
      await load();
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage || t('coursesRegisterFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const emptyMessage = emptyReason === 'no_student' || emptyReason === 'no_subjects'
    ? t('coursesFeePending')
    : serverMessage || t('coursesNone');

  const selectableCourses = courses.filter((course) => !registeredSubjectIds.has(course.id));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-semibold text-slate-900">{t('coursesTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('coursesSubtitle')}</p>
      </div>

      {message && <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="font-semibold text-slate-900">{t('myRegisteredCourses')}</h3>
          <p className="mt-1 text-sm text-slate-500">{t('myRegisteredCoursesHint')}</p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">{t('loading')}</p>
        ) : !registrations.length ? (
          <p className="text-sm text-slate-500">{t('myRegisteredCoursesEmpty')}</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {registrations.map((registration) => {
              const course = registration.subject || registration.course;
              const statusKey = registrationStatusKey(registration);
              const statusClass = statusKey === 'courseStatusApproved'
                ? 'bg-green-50 text-green-800'
                : statusKey === 'courseStatusRejected'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-amber-50 text-amber-800';

              return (
                <li key={registration.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <div className="font-medium text-slate-900">
                      {course?.code} — {course?.name}
                    </div>
                    {registration.rejection_reason && (
                      <p className="mt-1 text-sm text-red-700">{registration.rejection_reason}</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                    {t(statusKey)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="font-semibold text-slate-900">{t('availableCourses')}</h3>
          <p className="mt-1 text-sm text-slate-500">{t('availableCoursesHint')}</p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">{t('loading')}</p>
        ) : !courses.length ? (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {courses.map((course) => {
              const alreadyRegistered = registeredSubjectIds.has(course.id);
              const isMandatory = Boolean(course.is_required);
              return (
                <label
                  key={course.id}
                  className={`flex items-center gap-3 rounded-lg border bg-white p-3 ${
                    alreadyRegistered || isMandatory ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={alreadyRegistered || isMandatory}
                    checked={selected.includes(course.id) || alreadyRegistered}
                    onChange={(e) => setSelected((prev) => (
                      e.target.checked ? [...prev, course.id] : prev.filter((id) => id !== course.id)
                    ))}
                  />
                  <span className="flex-1">
                    <strong>{course.code}</strong> — {course.name} ({course.credit_units} {t('creditUnits')})
                    {isMandatory && (
                      <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        {t('mandatoryDocument')}
                      </span>
                    )}
                    {!isMandatory && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {t('optionalDocument')}
                      </span>
                    )}
                  </span>
                  {alreadyRegistered && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {t('courseAlreadyRegistered')}
                    </span>
                  )}
                </label>
              );
            })}
          </ul>
        )}

        {!loading && courses.length > 0 && (
          <button
            type="button"
            onClick={submit}
            disabled={!selected.length || submitting || !selectableCourses.length}
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? t('loading') : t('submitRegistration')}
          </button>
        )}
      </section>
    </div>
  );
}
