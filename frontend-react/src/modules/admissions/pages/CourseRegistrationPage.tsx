import { useEffect, useState } from 'react';
import { fetchAvailableCourses, registerCourses } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';

type Course = { id: number; name: string; code: string; credit_units: number; programme_semester_id?: number | null };

export default function CourseRegistrationPage() {
  const { t } = useAdmissionsI18n();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [emptyReason, setEmptyReason] = useState<'no_student' | 'no_subjects' | 'unknown' | null>(null);
  const [serverMessage, setServerMessage] = useState('');

  useEffect(() => {
    fetchAvailableCourses()
      .then(({ courses: list, reason, message: apiMessage }) => {
        setCourses(list);
        setEmptyReason(list.length ? null : (reason === 'no_student' || reason === 'no_subjects' ? reason : 'unknown'));
        setServerMessage(apiMessage || '');
      })
      .catch(() => {
        setCourses([]);
        setEmptyReason('unknown');
      });
  }, []);

  const submit = async () => {
    if (!selected.length) return;
    const semesterId = courses.find((c) => selected.includes(c.id))?.programme_semester_id ?? undefined;
    await registerCourses(selected, semesterId);
    setMessage(t('coursesRegistered'));
    setSelected([]);
  };

  const emptyMessage = emptyReason === 'no_student'
    ? t('coursesNoStudent')
    : emptyReason === 'no_subjects'
      ? t('coursesNoSubjects')
      : serverMessage || t('coursesNone');

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="font-semibold">{t('coursesTitle')}</h2>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {!courses.length ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {courses.map((c) => (
            <label key={c.id} className="flex items-center gap-3 rounded-lg border bg-white p-3 cursor-pointer">
              <input type="checkbox" checked={selected.includes(c.id)} onChange={(e) => setSelected((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))} />
              <span><strong>{c.code}</strong> — {c.name} ({c.credit_units} {t('creditUnits')})</span>
            </label>
          ))}
        </ul>
      )}
      <button type="button" onClick={submit} disabled={!selected.length} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm text-white disabled:opacity-50">
        {t('submitRegistration')}
      </button>
    </div>
  );
}
