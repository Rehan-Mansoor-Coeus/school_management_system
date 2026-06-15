import { useState } from 'react'
import { createTask, formatTaskError } from '../../../api/tasks'
import { FormField, formInputClass } from '../../../components/ui/FormField'
import { useToast } from '../../../components/ui/ToastProvider'

export default function CreateTaskPage() {
  const { pushToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    start_date: '',
    deadline: '',
    assignee_ids: '',
    cc_user_ids: '',
    schedule_later: false,
  })

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await createTask({
        ...form,
        assignee_ids: form.assignee_ids
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => Number(value)),
        cc_user_ids: form.cc_user_ids
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => Number(value)),
      })
      pushToast('Task created successfully.')
      setForm({ title: '', description: '', priority: 'medium', start_date: '', deadline: '', assignee_ids: '', cc_user_ids: '', schedule_later: false })
    } catch (error) {
      pushToast(formatTaskError(error, 'Unable to create task'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
      <FormField label="Title" required>
        <input required className={formInputClass} value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
      </FormField>
      <FormField label="Priority" required>
        <select className={formInputClass} value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </FormField>
      <FormField label="Start Date"><input type="date" className={formInputClass} value={form.start_date} onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value }))} /></FormField>
      <FormField label="Deadline"><input type="date" className={formInputClass} value={form.deadline} onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))} /></FormField>
      <FormField label="Assignee IDs (comma separated)"><input className={formInputClass} value={form.assignee_ids} onChange={(event) => setForm((prev) => ({ ...prev, assignee_ids: event.target.value }))} /></FormField>
      <FormField label="CC User IDs (comma separated)"><input className={formInputClass} value={form.cc_user_ids} onChange={(event) => setForm((prev) => ({ ...prev, cc_user_ids: event.target.value }))} /></FormField>
      <FormField label="Description" className="md:col-span-2"><textarea rows={5} className={formInputClass} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></FormField>
      <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.schedule_later} onChange={(event) => setForm((prev) => ({ ...prev, schedule_later: event.target.checked }))} />
        Schedule task for later
      </label>
      <div className="md:col-span-2">
        <button type="submit" disabled={submitting} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? 'Saving...' : 'Create Task'}
        </button>
      </div>
    </form>
  )
}
