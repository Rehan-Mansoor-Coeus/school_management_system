import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import { createCanteenMeal, deleteCanteenMeal, fetchCanteenMeals, updateCanteenMeal, formatCanteenError } from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export default function MealPlansPage() {
  const { t } = useCanteenI18n()
  const { pushToast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', name_fr: '', meal_type: 'lunch', price: '', description: '', is_active: true })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchCanteenMeals()
      setItems(res.data?.data || [])
    } catch (e) {
      pushToast(formatCanteenError(e, 'Failed to load meals'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', name_fr: '', meal_type: 'lunch', price: '', description: '', is_active: true })
    setModalOpen(true)
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setForm({
      name: item.name,
      name_fr: item.name_fr || '',
      meal_type: item.meal_type,
      price: String(item.price),
      description: item.description || '',
      is_active: item.is_active,
    })
    setModalOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, price: Number(form.price) }
    try {
      if (editing) {
        await updateCanteenMeal(editing.id, payload)
        pushToast('Meal plan updated.')
      } else {
        await createCanteenMeal(payload)
        pushToast('Meal plan created.')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      pushToast(formatCanteenError(err, 'Unable to save meal plan'), 'error')
    }
  }

  const remove = async (item: any) => {
    if (!window.confirm('Delete this meal plan?')) return
    try {
      await deleteCanteenMeal(item.id)
      pushToast('Meal plan deleted.')
      load()
    } catch (err) {
      pushToast(formatCanteenError(err, 'Unable to delete'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">{t('addMealPlan')}</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('name')}</th>
              <th className="px-4 py-3">{t('type')}</th>
              <th className="px-4 py-3">{t('price')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 capitalize">{t(item.meal_type)}</td>
                <td className="px-4 py-3">{Number(item.price).toFixed(2)}</td>
                <td className="px-4 py-3">{item.is_active ? t('active') : t('inactive')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(item)} className="mr-2 rounded-lg bg-slate-100 px-3 py-1">{t('edit')}</button>
                  <button onClick={() => remove(item)} className="rounded-lg bg-rose-100 px-3 py-1 text-rose-700">{t('delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title={editing ? t('edit') : t('addMealPlan')} open={modalOpen} onClose={() => setModalOpen(false)} wide footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="meal-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="meal-form" onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div><label className="text-sm font-medium">{t('name')}</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">{t('type')}</label><select value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2">{mealTypes.map((type) => <option key={type} value={type}>{t(type)}</option>)}</select></div>
          <div><label className="text-sm font-medium">{t('price')}</label><input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div className="md:col-span-2"><label className="text-sm font-medium">{t('description')}</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} /></div>
        </form>
      </Modal>
    </div>
  )
}
