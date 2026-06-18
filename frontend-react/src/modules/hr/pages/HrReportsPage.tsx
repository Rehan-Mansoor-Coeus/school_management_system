import { useEffect, useState } from 'react'
import { fetchHrSummaryReport, formatHrError } from '../../../api/hr'
import { useToast } from '../../../components/ui/ToastProvider'

export default function HrReportsPage() {
  const { pushToast } = useToast()
  const [summary, setSummary] = useState<any>({ byMonth: [], allowances: [], deductions: [], unpaidTotal: 0 })

  useEffect(() => {
    const run = async () => {
      try {
        setSummary(await fetchHrSummaryReport())
      } catch (error) {
        pushToast(formatHrError(error, 'Failed to load HR reports'), 'error')
      }
    }
    run()
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Unpaid Total</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.unpaidTotal ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-sm text-slate-500">Months in report</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.byMonth?.length ?? 0}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 font-semibold">Gross</th>
              <th className="px-4 py-3 font-semibold">Net</th>
            </tr>
          </thead>
          <tbody>
            {(summary.byMonth || []).map((row: any) => (
              <tr key={row.period} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.period}</td>
                <td className="px-4 py-3">{row.total_gross}</td>
                <td className="px-4 py-3">{row.total_net}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
