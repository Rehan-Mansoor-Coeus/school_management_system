import { useEffect, useState } from 'react'
import { fetchHrPayslipDetail, fetchHrPayslips, formatHrError, generateHrPayslip } from '../../../api/hr'
import { useToast } from '../../../components/ui/ToastProvider'

export default function HrPayslipsPage() {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])

  const load = async () => {
    try {
      setRows(await fetchHrPayslips())
    } catch (error) {
      pushToast(formatHrError(error, 'Failed to load payslips'), 'error')
    }
  }

  useEffect(() => { load() }, [])

  const generate = async (itemId: number) => {
    try {
      await generateHrPayslip(itemId)
      pushToast('Payslip generated.')
      load()
    } catch (error) {
      pushToast(formatHrError(error, 'Unable to generate payslip'), 'error')
    }
  }

  const openDetail = async (itemId: number) => {
    try {
      const detail = await fetchHrPayslipDetail(itemId)
      alert(`Payslip detail loaded for item ${itemId}. Net: ${detail.item?.net_amount ?? '-'}`)
    } catch (error) {
      pushToast(formatHrError(error, 'Unable to load payslip detail'), 'error')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Payslip ID</th>
            <th className="px-4 py-3 font-semibold">Payroll Item</th>
            <th className="px-4 py-3 font-semibold">Code</th>
            <th className="px-4 py-3 font-semibold">Generated</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No payslips found.</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{row.id}</td>
              <td className="px-4 py-3">{row.payroll_item_id}</td>
              <td className="px-4 py-3">{row.verification_code}</td>
              <td className="px-4 py-3">{row.generated_at || '-'}</td>
              <td className="px-4 py-3">
                <button type="button" onClick={() => generate(Number(row.payroll_item_id))} className="mr-2 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white">Generate</button>
                <button type="button" onClick={() => openDetail(Number(row.payroll_item_id))} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">Detail</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
