import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchHrPayrollRun, formatHrError } from '../../../api/hr'
import { useToast } from '../../../components/ui/ToastProvider'

export default function HrPayrollDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { pushToast } = useToast()
  const [run, setRun] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        setRun(await fetchHrPayrollRun(Number(id)))
      } catch (error) {
        pushToast(formatHrError(error, 'Failed to load payroll details'), 'error')
      }
    }
    load()
  }, [id])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{run?.title || `Payroll Run #${id}`}</h2>
        <p className="mt-1 text-sm text-slate-500">Status: {run?.status || 'n/a'} | Gross: {run?.total_gross || 0} | Net: {run?.total_net || 0}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Staff ID</th>
              <th className="px-4 py-3 font-semibold">Days</th>
              <th className="px-4 py-3 font-semibold">Basic</th>
              <th className="px-4 py-3 font-semibold">Net</th>
              <th className="px-4 py-3 font-semibold">Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {(run?.items || []).map((item: any) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{item.staff_profile_id}</td>
                <td className="px-4 py-3">{item.days_worked}</td>
                <td className="px-4 py-3">{item.basic_amount}</td>
                <td className="px-4 py-3">{item.net_amount}</td>
                <td className="px-4 py-3">{item.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
