import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchTimetableOptions,
  formatTimetableError,
  generateTimetable,
  type TimetableOptions,
} from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'
import { Field } from '../components/ttui'

type GenResult = { created: number; entries: number[]; unscheduled: Array<Record<string, unknown>>; message: string }

export default function GeneratePage() {
  const { pushToast } = useToast()
  const [options, setOptions] = useState<TimetableOptions | null>(null)
  const [form, setForm] = useState({ department_id: '', programme_id: '', programme_semester_id: '', academic_year: '', replace: true })
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<GenResult | null>(null)

  useEffect(() => {
    const run = async () => {
      try { setOptions(await fetchTimetableOptions()) } catch (error) { pushToast(formatTimetableError(error, 'Failed to load options'), 'error') }
    }
    run()
  }, [pushToast])

  const generate = async () => {
    setRunning(true); setResult(null)
    try {
      const res = await generateTimetable({
        department_id: form.department_id || null,
        programme_id: form.programme_id || null,
        programme_semester_id: form.programme_semester_id || null,
        academic_year: form.academic_year || null,
        replace: form.replace,
      })
      setResult(res)
      pushToast(res.message, res.created > 0 ? 'success' : 'error')
    } catch (error) { pushToast(formatTimetableError(error, 'Generation failed'), 'error') }
    finally { setRunning(false) }
  }

  const semestersForProgramme = (options?.programme_semesters || []).filter((s) => !form.programme_id || s.programme_id === Number(form.programme_id))

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Auto-Generate Timetable</h2>
        <p className="mt-1 text-xs text-slate-500">
          Generates conflict-free slots from course assignments, respecting teacher availability, classroom availability and the weekly load limit. You can adjust slots manually afterwards.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Department">
            <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="ttinput">
              <option value="">All</option>
              {options?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Programme">
            <select value={form.programme_id} onChange={(e) => setForm({ ...form, programme_id: e.target.value, programme_semester_id: '' })} className="ttinput">
              <option value="">All</option>
              {options?.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Semester">
            <select value={form.programme_semester_id} onChange={(e) => setForm({ ...form, programme_semester_id: e.target.value })} className="ttinput">
              <option value="">All</option>
              {semestersForProgramme.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Academic Year"><input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} className="ttinput" placeholder="2026/2027" /></Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.replace} onChange={(e) => setForm({ ...form, replace: e.target.checked })} className="h-4 w-4" />
          Replace existing slots in this scope before generating
        </label>
        <div className="mt-5">
          <button onClick={generate} disabled={running} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{running ? 'Generating…' : 'Generate Timetable'}</button>
        </div>
      </div>

      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Result</h3>
            <Link to="/timetable/schedule" className="text-sm font-medium text-blue-600 hover:underline">View timetable →</Link>
          </div>
          <p className="mt-2 text-sm text-slate-700">{result.created} slot(s) created.</p>
          {result.unscheduled.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-amber-700">Could not place {result.unscheduled.length} item(s):</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {result.unscheduled.map((u, i) => (
                  <li key={i} className="rounded-lg bg-amber-50 px-3 py-2">
                    <span className="font-medium">{String(u.course_code)} {String(u.course_name)}</span> — placed {String(u.placed_sessions)}/{String(u.requested_sessions)}. {String(u.reason)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
