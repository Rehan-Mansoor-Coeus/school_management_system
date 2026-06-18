import { useEffect, useState } from 'react'
import { fetchCanteenMeals, lookupStudentMeal, serveStudentMeal, formatCanteenError } from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'
import { useToast } from '../../../components/ui/ToastProvider'

export default function VerifyMealPage() {
  const { t } = useCanteenI18n()
  const { pushToast } = useToast()
  const [code, setCode] = useState('')
  const [meals, setMeals] = useState<any[]>([])
  const [lookup, setLookup] = useState<any>(null)
  const [mealId, setMealId] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchCanteenMeals({ active_only: true }).then((res) => setMeals(res.data?.data || []))
  }, [])

  const doLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await lookupStudentMeal(code.trim())
      setLookup(res.data?.data)
      setMealId('')
    } catch (err) {
      setLookup(null)
      pushToast(formatCanteenError(err, 'Lookup failed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const doServe = async () => {
    if (!lookup || !mealId) return
    setBusy(true)
    try {
      await serveStudentMeal({ student_id: lookup.student.id, meal_id: Number(mealId), verification_method: 'qr' })
      pushToast('Meal served successfully.')
      setLookup(null)
      setCode('')
      setMealId('')
    } catch (err) {
      pushToast(formatCanteenError(err, 'Unable to serve meal'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <form onSubmit={doLookup} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <label className="block text-sm font-medium">{t('scanOrEnter')}</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-xl border px-3 py-2 font-mono text-sm" placeholder="CANTEEN:CW-1-2-ABC123 or registration number" />
        <button type="submit" disabled={busy} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">{t('lookup')}</button>
      </form>

      {lookup && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[#1e3a5f]">{lookup.student.name}</h3>
            <p className="text-sm text-slate-600">{lookup.student.registration_number} · {lookup.student.programme || '—'}</p>
            <p className="mt-2 text-sm">{t('balance')}: <strong>{Number(lookup.wallet.balance).toFixed(2)}</strong></p>
            {lookup.subscription && <p className="text-sm">{t('mealsRemaining')}: {lookup.subscription.meals_remaining} ({lookup.subscription.plan_name})</p>}
          </div>
          <div>
            <label className="text-sm font-medium">{t('selectMeal')}</label>
            <select value={mealId} onChange={(e) => setMealId(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
              <option value="">—</option>
              {meals.map((m) => <option key={m.id} value={m.id}>{m.name} — {Number(m.price).toFixed(2)}</option>)}
            </select>
          </div>
          <button type="button" disabled={!mealId || busy} onClick={doServe} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t('serveMeal')}</button>
        </div>
      )}
    </div>
  )
}
