import { useEffect, useState } from 'react'
import { fetchClearances, formatHostelError, updateClearance } from '../../../api/hostel'
import { useToast } from '../../../components/ui/ToastProvider'
import { useHostelI18n } from '../../../hooks/useHostelI18n'

export default function ClearancePage() {
  const { t } = useHostelI18n()
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])

  const load = () => fetchClearances().then((res) => setRows(res.data?.data?.data || res.data?.data || [])).catch(() => setRows([]))
  useEffect(() => { load() }, [])

  const toggle = async (row: any, field: string, value: boolean) => {
    try {
      await updateClearance(row.id, { [field]: value })
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Update failed'), 'error')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-3">{t('student')}</th>
            <th className="px-4 py-3">Room</th>
            <th className="px-4 py-3">{t('roomInspected')}</th>
            <th className="px-4 py-3">{t('itemsReturned')}</th>
            <th className="px-4 py-3">{t('feesCleared')}</th>
            <th className="px-4 py-3">{t('status')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="px-4 py-3">{c.allocation?.student?.user?.name}</td>
              <td className="px-4 py-3">{c.allocation?.room?.hostel?.name} — {c.allocation?.room?.room_number}</td>
              <td className="px-4 py-3">
                <input type="checkbox" checked={c.room_inspected} onChange={(e) => toggle(c, 'room_inspected', e.target.checked)} />
              </td>
              <td className="px-4 py-3">
                <input type="checkbox" checked={c.items_returned} onChange={(e) => toggle(c, 'items_returned', e.target.checked)} />
              </td>
              <td className="px-4 py-3">
                <input type="checkbox" checked={c.fees_cleared} onChange={(e) => toggle(c, 'fees_cleared', e.target.checked)} />
              </td>
              <td className="px-4 py-3">{t(c.status)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
