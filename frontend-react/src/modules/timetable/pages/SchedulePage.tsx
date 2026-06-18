import { useEffect, useState } from 'react'
import {
  DAY_LABELS,
  approveEntry,
  createEntry,
  deleteEntry,
  fetchEntries,
  fetchTimetableOptions,
  formatTimetableError,
  type TimetableOptions,
} from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'
import { useAuth } from '../../../context/AuthContext'
import { Field, Modal } from '../components/ttui'

type Entry = {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  status: string
  source: string
  course?: { code: string; name: string } | null
  teacher?: { name: string } | null
  classroom?: { name: string } | null
  programme?: { name: string } | null
  programme_semester?: { name: string } | null
}

const emptyForm = {
  course_id: '', teacher_id: '', classroom_id: '', programme_id: '', programme_semester_id: '',
  day_of_week: '1', start_time: '08:00', end_time: '10:00', academic_year: '',
}

export default function SchedulePage() {
  const { pushToast } = useToast()
  const { canAccess } = useAuth()
  const canManage = canAccess({ permissions: ['timetable.edit', 'timetable.create', 'timetable.manage'] })
  const canDelete = canAccess({ permissions: ['timetable.delete', 'timetable.manage'] })
  const canApprove = canAccess({ permissions: ['timetable.approve', 'timetable.manage'] })

  const [options, setOptions] = useState<TimetableOptions | null>(null)
  const [filters, setFilters] = useState({ programme_id: '', programme_semester_id: '', department_id: '' })
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Record<string, unknown>>(emptyForm)
  const [conflicts, setConflicts] = useState<Array<{ type: string; message: string }>>([])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      setEntries((await fetchEntries(params)) as Entry[])
    } catch (error) { pushToast(formatTimetableError(error, 'Failed to load timetable'), 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const run = async () => {
      try { setOptions(await fetchTimetableOptions()) } catch { /* ignore */ }
    }
    run()
  }, [])
  useEffect(() => { load() /* eslint-disable-next-line */ }, [filters])

  const submit = async (force = false) => {
    setSaving(true)
    setConflicts([])
    try {
      const payload = {
        ...form,
        teacher_id: form.teacher_id || null,
        classroom_id: form.classroom_id || null,
        programme_id: form.programme_id || null,
        programme_semester_id: form.programme_semester_id || null,
        day_of_week: Number(form.day_of_week),
        force,
      }
      const res = await createEntry(payload)
      const warnings = (res as { warnings?: string[] })?.warnings || []
      warnings.forEach((w) => pushToast(w, 'error'))
      pushToast('Slot added.', 'success')
      setShowForm(false); setForm(emptyForm); await load()
    } catch (error) {
      const resp = (error as { response?: { status?: number; data?: { conflicts?: Array<{ type: string; message: string }> } } }).response
      if (resp?.status === 422 && resp.data?.conflicts) {
        setConflicts(resp.data.conflicts)
      } else {
        pushToast(formatTimetableError(error, 'Failed to add slot'), 'error')
      }
    } finally { setSaving(false) }
  }

  const remove = async (e: Entry) => {
    if (!window.confirm('Delete this slot?')) return
    try { await deleteEntry(e.id); pushToast('Slot deleted.', 'success'); await load() }
    catch (error) { pushToast(formatTimetableError(error, 'Failed to delete'), 'error') }
  }

  const approve = async (e: Entry) => {
    try { await approveEntry(e.id, 'published'); pushToast('Slot published.', 'success'); await load() }
    catch (error) { pushToast(formatTimetableError(error, 'Failed to approve'), 'error') }
  }

  const semestersForProgramme = (options?.programme_semesters || []).filter((s) => !form.programme_id || s.programme_id === Number(form.programme_id))
  const byDay = (d: number) => entries.filter((e) => e.day_of_week === d).sort((a, b) => a.start_time.localeCompare(b.start_time))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Programme</label>
            <select value={filters.programme_id} onChange={(e) => setFilters({ ...filters, programme_id: e.target.value, programme_semester_id: '' })} className="ttinput min-w-[180px]">
              <option value="">All programmes</option>
              {options?.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Semester</label>
            <select value={filters.programme_semester_id} onChange={(e) => setFilters({ ...filters, programme_semester_id: e.target.value })} className="ttinput min-w-[160px]">
              <option value="">All semesters</option>
              {(options?.programme_semesters || []).filter((s) => !filters.programme_id || s.programme_id === Number(filters.programme_id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        {canManage && <button onClick={() => { setForm(emptyForm); setConflicts([]); setShowForm(true) }} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800">+ Add Slot</button>}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => {
            const slots = byDay(d)
            if (slots.length === 0 && d > 5) return null
            return (
              <div key={d} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">{DAY_LABELS[d]}</h3>
                {slots.length === 0 ? (
                  <p className="text-xs text-slate-400">No classes.</p>
                ) : (
                  <ul className="space-y-2">
                    {slots.map((e) => (
                      <li key={e.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">{e.start_time.slice(0, 5)}–{e.end_time.slice(0, 5)}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${e.status === 'published' ? 'bg-green-100 text-green-700' : e.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{e.status}</span>
                        </div>
                        <div className="mt-1 text-slate-700">{e.course ? `${e.course.code} ${e.course.name}` : '-'}</div>
                        <div className="text-xs text-slate-500">{e.teacher?.name || 'No teacher'} · {e.classroom?.name || 'No room'}</div>
                        <div className="text-xs text-slate-400">{e.programme?.name || ''} {e.programme_semester?.name ? `· ${e.programme_semester.name}` : ''}</div>
                        <div className="mt-2 flex gap-3">
                          {canApprove && e.status !== 'published' && <button onClick={() => approve(e)} className="text-xs font-medium text-green-600 hover:underline">Publish</button>}
                          {canDelete && <button onClick={() => remove(e)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Add Timetable Slot" onClose={() => setShowForm(false)}>
          {conflicts.length > 0 && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">Conflicts detected:</p>
              <ul className="mt-1 list-disc pl-5">{conflicts.map((c, i) => <li key={i}>{c.message}</li>)}</ul>
              <p className="mt-2 text-xs">You can force-save anyway.</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Course *">
              <select value={String(form.course_id)} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="ttinput">
                <option value="">Select…</option>
                {options?.courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </Field>
            <Field label="Teacher">
              <select value={String(form.teacher_id)} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className="ttinput">
                <option value="">—</option>
                {options?.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Classroom">
              <select value={String(form.classroom_id)} onChange={(e) => setForm({ ...form, classroom_id: e.target.value })} className="ttinput">
                <option value="">—</option>
                {options?.classrooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Programme">
              <select value={String(form.programme_id)} onChange={(e) => setForm({ ...form, programme_id: e.target.value, programme_semester_id: '' })} className="ttinput">
                <option value="">—</option>
                {options?.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Semester">
              <select value={String(form.programme_semester_id)} onChange={(e) => setForm({ ...form, programme_semester_id: e.target.value })} className="ttinput">
                <option value="">—</option>
                {semestersForProgramme.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Day *">
              <select value={String(form.day_of_week)} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} className="ttinput">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
            </Field>
            <Field label="Start Time *"><input type="time" value={String(form.start_time)} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="ttinput" /></Field>
            <Field label="End Time *"><input type="time" value={String(form.end_time)} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="ttinput" /></Field>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
            {conflicts.length > 0 && <button onClick={() => submit(true)} disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Force Save</button>}
            <button onClick={() => submit(false)} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
