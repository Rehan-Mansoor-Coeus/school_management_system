import { useEffect, useState } from 'react'
import { createTimesheetActivity, deleteTimesheetActivity, fetchTimesheetActivities, fetchTimesheetCategories, updateTimesheetActivity } from '../api/timesheets'
import { FieldLabel, PrimaryButton, SelectInput, TextArea, TextInput, TimesheetCard, TimesheetPageHeader } from '../components/timesheets/TimesheetUi'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'

export default function TimesheetActivitiesPage() {
  const { t } = useTimesheetI18n()
  const [activities, setActivities] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [filterCategory, setFilterCategory] = useState('')
  const [form, setForm] = useState({ name: '', category_id: '', description: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function load() {
    const [acts, cats] = await Promise.all([
      fetchTimesheetActivities(filterCategory ? { category_id: filterCategory } : undefined),
      fetchTimesheetCategories(),
    ])
    setActivities(acts.data || [])
    setCategories(cats.data || [])
  }

  useEffect(() => { load().catch(() => setError('Failed to load activities')) }, [filterCategory])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, category_id: form.category_id || null }
      if (editingId) await updateTimesheetActivity(editingId, payload)
      else await createTimesheetActivity(payload)
      setForm({ name: '', category_id: '', description: '' })
      setEditingId(null)
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="space-y-6">
      <TimesheetPageHeader title={t('createActivity')} subtitle={t('createActivitySubtitle')} />
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <TimesheetCard>
          <h2 className="mb-1 text-lg font-bold text-[#1e3a5f]">{t('createNewActivity')}</h2>
          <p className="mb-4 text-sm text-slate-500">{t('defineTaskType')}</p>
          <form onSubmit={save} className="space-y-4">
            <div>
              <FieldLabel required>{t('activityName')}</FieldLabel>
              <TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Frontend Development" required />
            </div>
            <div>
              <FieldLabel>{t('category')}</FieldLabel>
              <SelectInput value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                <option value="">{t('selectCategory')}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectInput>
            </div>
            <div>
              <FieldLabel>{t('description')}</FieldLabel>
              <TextArea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('optionalDetails')} />
            </div>
            <PrimaryButton type="submit" className="w-full">+ {editingId ? t('save') : t('createActivity')}</PrimaryButton>
          </form>
        </TimesheetCard>

        <TimesheetCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1e3a5f]">{t('yourActivities')}</h2>
              <p className="text-sm text-slate-500">{t('manageActivities')}</p>
            </div>
            <SelectInput value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-48">
              <option value="">{t('allCategories')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectInput>
          </div>

          <div className="space-y-3">
            {activities.map(act => (
              <div key={act.id} className="flex items-start justify-between rounded-2xl border border-slate-200 p-4">
                <div>
                  <div className="font-bold uppercase tracking-wide">{act.name}</div>
                  {act.category && (
                    <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs text-white" style={{ backgroundColor: act.category.color_tag || '#3b82f6' }}>
                      {act.category.name}
                    </span>
                  )}
                  <div className="mt-2 text-sm text-slate-500">{act.description || '—'}</div>
                </div>
                <div className="flex gap-3">
                  <button className="text-blue-600" onClick={() => { setEditingId(act.id); setForm({ name: act.name, category_id: act.category_id || '', description: act.description || '' }) }}>{t('edit')}</button>
                  <button className="text-red-600" onClick={() => deleteTimesheetActivity(act.id).then(load)}>{t('delete')}</button>
                </div>
              </div>
            ))}
            {activities.length === 0 && <div className="py-10 text-center text-slate-500">{t('noData')}</div>}
          </div>
        </TimesheetCard>
      </div>
    </div>
  )
}
