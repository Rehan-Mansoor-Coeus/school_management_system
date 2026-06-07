import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { fetchCanteenReport } from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'

export default function ReportsPage() {
  const { t } = useCanteenI18n()
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState<any>(null)

  const load = async () => {
    const res = await fetchCanteenReport({ date_from: dateFrom, date_to: dateTo })
    setReport(res.data?.data)
  }

  useEffect(() => { load() }, [dateFrom, dateTo])

  const chartData = (report?.by_day || []).map((row: any) => ({ day: row.day, total: row.total }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
        <button onClick={load} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('generateReport')}</button>
      </div>

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{t('mealsServed')}</p><p className="text-3xl font-bold text-[#1e3a5f]">{report.meals_served}</p></div>
            <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{t('walletRevenue')}</p><p className="text-3xl font-bold text-[#1e3a5f]">{Number(report.wallet_revenue).toFixed(2)}</p></div>
            <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{t('subscriptionMeals')}</p><p className="text-3xl font-bold text-[#1e3a5f]">{report.subscription_meals}</p></div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Meals per day</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left"><tr><th className="px-4 py-3">Meal</th><th className="px-4 py-3">Count</th></tr></thead>
              <tbody>
                {(report.by_meal || []).map((row: any) => (
                  <tr key={row.meal_id} className="border-t">
                    <td className="px-4 py-3">{row.meal?.name || `#${row.meal_id}`}</td>
                    <td className="px-4 py-3">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
