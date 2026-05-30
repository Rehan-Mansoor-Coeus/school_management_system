import { FormEvent, useEffect, useState } from 'react'
import { fetchMyTeachingSchedules, submitTeachingEntry } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function SubmitTeachingTimesheetPage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [form, setForm] = useState<any>({
    teacher_schedule_id: '',
    date: '',
    topic_taught: '',
    sub_topic: '',
    actual_start_time: '',
    actual_end_time: '',
    activity_description: '',
    remarks: '',
  })
  const { pushToast } = useToast()

  useEffect(() => {
    fetchMyTeachingSchedules()
      .then((res) => setSchedules(res.data || []))
      .catch(() => pushToast('Failed to load schedules', 'error'))
  }, [])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await submitTeachingEntry({ ...form, teacher_schedule_id: Number(form.teacher_schedule_id), submit: true })
      pushToast('Teaching timesheet submitted.')
      setForm({
        teacher_schedule_id: '',
        date: '',
        topic_taught: '',
        sub_topic: '',
        actual_start_time: '',
        actual_end_time: '',
        activity_description: '',
        remarks: '',
      })
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to submit teaching timesheet', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Submit Teaching Timesheet</h2>
      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <select required value={form.teacher_schedule_id} onChange={(e) => setForm((p: any) => ({ ...p, teacher_schedule_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Scheduled class</option>
          {schedules.map((s) => <option key={s.id} value={s.id}>Day {s.day_of_week} • {s.course?.name} • {s.start_time}-{s.end_time}</option>)}
        </select>
        <input required type="date" value={form.date} onChange={(e) => setForm((p: any) => ({ ...p, date: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input required value={form.topic_taught} onChange={(e) => setForm((p: any) => ({ ...p, topic_taught: e.target.value }))} placeholder="Topic taught" className="rounded-xl border border-slate-200 px-3 py-2" />
        <input value={form.sub_topic} onChange={(e) => setForm((p: any) => ({ ...p, sub_topic: e.target.value }))} placeholder="Sub-topic" className="rounded-xl border border-slate-200 px-3 py-2" />
        <input required type="time" value={form.actual_start_time} onChange={(e) => setForm((p: any) => ({ ...p, actual_start_time: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input required type="time" value={form.actual_end_time} onChange={(e) => setForm((p: any) => ({ ...p, actual_end_time: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <textarea value={form.activity_description} onChange={(e) => setForm((p: any) => ({ ...p, activity_description: e.target.value }))} placeholder="Activity description" className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2" />
        <textarea value={form.remarks} onChange={(e) => setForm((p: any) => ({ ...p, remarks: e.target.value }))} placeholder="Remarks" className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2" />
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-white sm:w-fit">Submit</button>
      </form>
    </div>
  )
}
