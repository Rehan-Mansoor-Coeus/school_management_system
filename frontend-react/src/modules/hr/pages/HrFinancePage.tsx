import { useEffect, useState } from 'react'
import { fetchHrFinanceItems, formatHrError, updateHrFinanceItem } from '../../../api/hr'
import { useToast } from '../../../components/ui/ToastProvider'

export default function HrFinancePage() {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])

  const load = async () => {
    try {
      setRows(await fetchHrFinanceItems())
    } catch (error) {
      pushToast(formatHrError(error, 'Failed to load finance queue'), 'error')
    }
  }

  useEffect(() => { load() }, [])

  const markStatus = async (id: number, status: string) => {
    try {
      await updateHrFinanceItem(id, { status })
      pushToast('Finance status updated.')
      load()
    } catch (error) {
      pushToast(formatHrError(error, 'Unable to update finance status'), 'error')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Payment ID</th>
            <th className="px-4 py-3 font-semibold">Payroll Item</th>
            <th className="px-4 py-3 font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No finance records.</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{row.id}</td>
              <td className="px-4 py-3">{row.payroll_item_id}</td>
              <td className="px-4 py-3">{row.amount}</td>
              <td className="px-4 py-3">{row.status}</td>
              <td className="px-4 py-3">
                <button type="button" onClick={() => markStatus(Number(row.id), 'paid')} className="mr-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">Mark Paid</button>
                <button type="button" onClick={() => markStatus(Number(row.id), 'partially_paid')} className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700">Partially Paid</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
