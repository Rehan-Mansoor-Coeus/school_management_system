import { FormEvent, useEffect, useState } from 'react'
import { createCoursePlan, fetchCoursePlans, fetchTimesheetReferences } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function CourseContactHourPlanningPage() {
  const [refs, setRefs] = useState<any>({})
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState<any>({
    academic_year_id: '',
    period_id: '',
    course_id: '',
    class_id: '',
    required_contact_hours: '40',
    preferred_shift_duration_minutes: '45',
    teacher_ids: [] as number[],
  })
  const { pushToast } = useToast()

  const load = async () => {
    const [refsRes, plansRes] = await Promise.all([fetchTimesheetReferences(), fetchCoursePlans()])
    setRefs(refsRes.data || {})
    setRows(plansRes.data || [])
  }

  useEffect(() => { load().catch(() => pushToast('Failed to load course planning data', 'error')) }, [])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createCoursePlan({
        ...form,
        academic_year_id: Number(form.academic_year_id),
        period_id: form.period_id ? Number(form.period_id) : null,
        course_id: Number(form.course_id),
        class_id: form.class_id ? Number(form.class_id) : null,
        required_contact_hours: Number(form.required_contact_hours),
        preferred_shift_duration_minutes: Number(form.preferred_shift_duration_minutes),
      })
      pushToast('Course contact hour plan saved.')
      load()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to save course plan', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Course Contact Hour Planning</h2>
      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <select required value={form.academic_year_id} onChange={(e) => setForm((p: any) => ({ ...p, academic_year_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Academic Year</option>
          {(refs.academic_years || []).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={form.period_id} onChange={(e) => setForm((p: any) => ({ ...p, period_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Period</option>
          {(refs.periods || []).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select required value={form.course_id} onChange={(e) => setForm((p: any) => ({ ...p, course_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Course</option>
          {(refs.courses || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={form.class_id} onChange={(e) => setForm((p: any) => ({ ...p, class_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Class</option>
          {(refs.classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="number" min={1} value={form.required_contact_hours} onChange={(e) => setForm((p: any) => ({ ...p, required_contact_hours: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="number" min={15} value={form.preferred_shift_duration_minutes} onChange={(e) => setForm((p: any) => ({ ...p, preferred_shift_duration_minutes: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <select multiple value={form.teacher_ids.map(String)} onChange={(e) => setForm((p: any) => ({ ...p, teacher_ids: Array.from(e.target.selectedOptions).map((x) => Number(x.value)) }))} className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2 lg:col-span-2">
          {(refs.teachers || []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-white">Save Plan</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50"><tr><th className="px-4 py-3">Course</th><th className="px-4 py-3">Required</th><th className="px-4 py-3">Scheduled</th><th className="px-4 py-3">Completed</th><th className="px-4 py-3">Remaining</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.course?.name}</td>
                <td className="px-4 py-3">{row.required_contact_hours}</td>
                <td className="px-4 py-3">{row.scheduled_contact_hours}</td>
                <td className="px-4 py-3">{row.completed_contact_hours}</td>
                <td className="px-4 py-3">{row.remaining_contact_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
