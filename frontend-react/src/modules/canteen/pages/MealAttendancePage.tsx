import { useEffect, useState } from 'react'
import { fetchMealAttendance, voidMealAttendance, formatCanteenError } from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'
import { useToast } from '../../../components/ui/ToastProvider'

export default function MealAttendancePage() {
  const { t } = useCanteenI18n()
  const { pushToast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = async () => {
    try {
      const params: Record<string, string> = {}
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const res = await fetchMealAttendance(params)
      setItems(res.data?.data?.data || res.data?.data || [])
    } catch (e) {
      pushToast(formatCanteenError(e, 'Failed to load attendance'), 'error')
    }
  }

  useEffect(() => { load() }, [dateFrom, dateTo])

  const voidRecord = async (id: number) => {
    if (!window.confirm('Void this meal record?')) return
    try {
      await voidMealAttendance(id)
      load()
    } catch (e) {
      pushToast(formatCanteenError(e, 'Unable to void'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('servedAt')}</th>
              <th className="px-4 py-3">{t('student')}</th>
              <th className="px-4 py-3">Meal</th>
              <th className="px-4 py-3">{t('paymentSource')}</th>
              <th className="px-4 py-3">{t('price')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">{new Date(row.served_at).toLocaleString()}</td>
                <td className="px-4 py-3">{row.student?.user?.name}</td>
                <td className="px-4 py-3">{row.meal?.name}</td>
                <td className="px-4 py-3 capitalize">{row.payment_source}</td>
                <td className="px-4 py-3">{Number(row.amount_charged).toFixed(2)}</td>
                <td className="px-4 py-3 capitalize">{row.status}</td>
                <td className="px-4 py-3">{row.status === 'served' && <button onClick={() => voidRecord(row.id)} className="rounded-lg bg-rose-100 px-2 py-1 text-rose-700">{t('void')}</button>}</td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
