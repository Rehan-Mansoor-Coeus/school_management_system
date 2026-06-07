import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import {
  createFeedingPlan, deleteFeedingPlan, fetchCanteenMeals, fetchFeedingPlanReference,
  fetchFeedingPlans, updateFeedingPlan, formatCanteenError,
} from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'

export default function FeedingPlansPage() {
  const { t } = useCanteenI18n()
  const { pushToast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [meals, setMeals] = useState<any[]>([])
  const [years, setYears] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', description: '', academic_year_id: '', total_meals: '60', price: '',
    valid_from: '', valid_to: '', meal_id: '', allowance: '0',
  })

  const load = async () => {
    try {
      const [plansRes, mealsRes, refRes] = await Promise.all([
        fetchFeedingPlans(), fetchCanteenMeals({ active_only: true }), fetchFeedingPlanReference(),
      ])
      setItems(plansRes.data?.data || [])
      setMeals(mealsRes.data?.data || [])
      setYears(refRes.data?.data?.academic_years || [])
    } catch (e) {
      pushToast(formatCanteenError(e, 'Failed to load feeding plans'), 'error')
    }
  }

  useEffect(() => { load() }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description,
      academic_year_id: form.academic_year_id ? Number(form.academic_year_id) : null,
      total_meals: Number(form.total_meals),
      price: Number(form.price),
      valid_from: form.valid_from || null,
      valid_to: form.valid_to || null,
      is_active: true,
    }
    if (form.meal_id) {
      payload.meals = [{ meal_id: Number(form.meal_id), allowance: Number(form.allowance) || 0 }]
    }
    try {
      if (editing) await updateFeedingPlan(editing.id, payload)
      else await createFeedingPlan(payload)
      pushToast('Feeding plan saved.')
      setModalOpen(false)
      load()
    } catch (err) {
      pushToast(formatCanteenError(err, 'Unable to save'), 'error')
    }
  }

  const remove = async (item: any) => {
    if (!window.confirm('Delete this feeding plan?')) return
    await deleteFeedingPlan(item.id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">{t('addFeedingPlan')}</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('name')}</th>
              <th className="px-4 py-3">{t('totalMeals')}</th>
              <th className="px-4 py-3">{t('price')}</th>
              <th className="px-4 py-3">{t('validFrom')}</th>
              <th className="px-4 py-3">{t('validTo')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.total_meals}</td>
                <td className="px-4 py-3">{Number(item.price).toFixed(2)}</td>
                <td className="px-4 py-3">{item.valid_from || '—'}</td>
                <td className="px-4 py-3">{item.valid_to || '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(item)} className="rounded-lg bg-rose-100 px-3 py-1 text-rose-700">{t('delete')}</button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={t('addFeedingPlan')} open={modalOpen} onClose={() => setModalOpen(false)} wide footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="feeding-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="feeding-form" onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div><label className="text-sm font-medium">{t('name')}</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">{t('academicYear')}</label><select value={form.academic_year_id} onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">—</option>{years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></div>
          <div><label className="text-sm font-medium">{t('totalMeals')}</label><input required type="number" min="1" value={form.total_meals} onChange={(e) => setForm({ ...form, total_meals: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">{t('price')}</label><input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">{t('validFrom')}</label><input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">{t('validTo')}</label><input type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">Optional meal quota</label><select value={form.meal_id} onChange={(e) => setForm({ ...form, meal_id: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Any meal (general pool)</option>{meals.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div><label className="text-sm font-medium">{t('mealAllowance')}</label><input type="number" min="0" value={form.allowance} onChange={(e) => setForm({ ...form, allowance: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
        </form>
      </Modal>
    </div>
  )
}
