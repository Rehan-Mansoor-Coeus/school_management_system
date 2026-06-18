import { useEffect, useState } from 'react'
import { approveHrPayroll, fetchHrPayrollRuns, formatHrError, forwardHrPayrollToFinance, rejectHrPayroll, submitHrPayrollReview } from '../../../api/hr'
import { useToast } from '../../../components/ui/ToastProvider'

export default function HrApprovalsPage() {
  const { pushToast } = useToast()
  const [runs, setRuns] = useState<any[]>([])

  const load = async () => {
    try {
      setRuns(await fetchHrPayrollRuns())
    } catch (error) {
      pushToast(formatHrError(error, 'Failed to load payroll approvals'), 'error')
    }
  }

  useEffect(() => { load() }, [])

  const perform = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      pushToast(success)
      load()
    } catch (error) {
      pushToast(formatHrError(error, 'Unable to update payroll approval stage'), 'error')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Run</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Net Total</th>
            <th className="px-4 py-3 font-semibold">Workflow Actions</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{run.title || `Run #${run.id}`}</td>
              <td className="px-4 py-3">{run.status}</td>
              <td className="px-4 py-3">{run.total_net}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => perform(() => submitHrPayrollReview(Number(run.id)), 'Submitted for review.')} className="rounded-lg bg-slate-100 px-2 py-1 text-xs">Submit</button>
                  <button type="button" onClick={() => perform(() => approveHrPayroll(Number(run.id)), 'Payroll approved.')} className="rounded-lg bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Approve</button>
                  <button type="button" onClick={() => perform(() => forwardHrPayrollToFinance(Number(run.id)), 'Sent to finance.')} className="rounded-lg bg-blue-100 px-2 py-1 text-xs text-blue-700">Finance</button>
                  <button type="button" onClick={() => perform(() => rejectHrPayroll(Number(run.id)), 'Payroll rejected.')} className="rounded-lg bg-rose-100 px-2 py-1 text-xs text-rose-700">Reject</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
