import { useEffect, useState } from 'react'
import { createTimesheetCategory, deleteTimesheetCategory, fetchTimesheetCategories, updateTimesheetCategory } from '../api/timesheets'
import { FieldLabel, PrimaryButton, TextArea, TextInput, TimesheetCard, TimesheetPageHeader } from '../components/timesheets/TimesheetUi'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'

const defaultColors = ['#3b82f6', '#eab308', '#a855f7', '#22c55e', '#ef4444', '#06b6d4']

export default function TimesheetCategoriesPage() {
  const { t } = useTimesheetI18n()
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', description: '', color_tag: '#3b82f6' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetchTimesheetCategories()
    setCategories(res.data || [])
  }

  useEffect(() => { load().catch(() => setError('Failed to load categories')) }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await updateTimesheetCategory(editingId, form)
      } else {
        await createTimesheetCategory(form)
      }
      setForm({ name: '', description: '', color_tag: '#3b82f6' })
      setEditingId(null)
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this category?')) return
    await deleteTimesheetCategory(id)
    await load()
  }

  return (
    <div className="space-y-6">
      <TimesheetPageHeader
        title={t('categories')}
        subtitle={t('categoriesSubtitle')}
        action={<PrimaryButton onClick={() => { setEditingId(null); setForm({ name: '', description: '', color_tag: '#3b82f6' }) }}>+ {t('addCategory')}</PrimaryButton>}
      />
      {error && <div className="text-sm text-red-600">{error}</div>}

      <TimesheetCard>
        <form onSubmit={save} className="mb-6 grid gap-4 md:grid-cols-3">
          <div>
            <FieldLabel required>{t('categoryName')}</FieldLabel>
            <TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <FieldLabel>{t('description')}</FieldLabel>
            <TextInput value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <FieldLabel>{t('colorTag')}</FieldLabel>
            <div className="flex gap-2">
              <TextInput value={form.color_tag} onChange={e => setForm({ ...form, color_tag: e.target.value })} />
              <input type="color" value={form.color_tag} onChange={e => setForm({ ...form, color_tag: e.target.value })} className="h-10 w-12 rounded border" />
            </div>
          </div>
          <div className="md:col-span-3">
            <PrimaryButton type="submit">{editingId ? t('save') : t('addCategory')}</PrimaryButton>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-3 pr-4">{t('categoryName')}</th>
                <th className="py-3 pr-4">{t('description')}</th>
                <th className="py-3 pr-4">{t('colorTag')}</th>
                <th className="py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b">
                  <td className="py-3 pr-4 font-semibold">{cat.name}</td>
                  <td className="py-3 pr-4 text-slate-600">{cat.description || '—'}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: cat.color_tag || '#3b82f6' }} />
                      {cat.color_tag}
                    </span>
                  </td>
                  <td className="py-3">
                    <button className="mr-3 text-blue-600" onClick={() => { setEditingId(cat.id); setForm({ name: cat.name, description: cat.description || '', color_tag: cat.color_tag || '#3b82f6' }) }}>{t('edit')}</button>
                    <button className="text-red-600" onClick={() => remove(cat.id)}>{t('delete')}</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">{t('noData')}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {defaultColors.map(color => (
            <span key={color} className="rounded-full px-3 py-1 text-xs text-white" style={{ backgroundColor: color }}>{color}</span>
          ))}
        </div>
      </TimesheetCard>
    </div>
  )
}
