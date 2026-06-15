import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createHrMonthlyPayroll, fetchHrPayrollRuns, formatHrError } from '../../../api/hr'
import { FormField, formInputClass } from '../../../components/ui/FormField'
import { useToast } from '../../../components/ui/ToastProvider'

export default function HrMonthlyPayrollPage() {
  const { pushToast } = useToast()
  const [runs, setRuns] = useState<any[]>([])
  const [form, setForm] = useState({ period_start: '', period_end: '', title: '' })

  const load = async () => {
    try {
      setRuns(await fetchHrPayrollRuns({ run_type: 'monthly' }))
    } catch (error) {
      pushToast(formatHrError(error, 'Failed to load monthly payroll runs'), 'error')
    }
  }

  useEffect(() => { load() }, [])

  const createRun = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await createHrMonthlyPayroll(form)
      pushToast('Monthly payroll run created.')
      setForm({ period_start: '', period_end: '', title: '' })
      load()
    } catch (error) {
      pushToast(formatHrError(error, 'Unable to create monthly payroll run'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createRun} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <FormField label="Title"><input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={formInputClass} /></FormField>
        <FormField label="Period Start" required><input type="date" required value={form.period_start} onChange={(e) => setForm((p) => ({ ...p, period_start: e.target.value }))} className={formInputClass} /></FormField>
        <FormField label="Period End" required><input type="date" required value={form.period_end} onChange={(e) => setForm((p) => ({ ...p, period_end: e.target.value }))} className={formInputClass} /></FormField>
        <div className="flex items-end"><button type="submit" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">Create Run</button></div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Gross</th>
              <th className="px-4 py-3 font-semibold">Net</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No monthly payroll runs.</td></tr>
            ) : runs.map((run) => (
              <tr key={run.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{run.title || `Run #${run.id}`}</td>
                <td className="px-4 py-3">{run.status}</td>
                <td className="px-4 py-3">{run.total_gross}</td>
                <td className="px-4 py-3">{run.total_net}</td>
                <td className="px-4 py-3"><Link className="text-[#1e3a5f] underline" to={`/hr/payroll-runs/${run.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
