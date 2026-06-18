import { useEffect, useState } from 'react'
import { createLetterCategory, deleteLetterCategory, fetchLetterCategories, updateLetterCategory } from '../../api/letters'
import { FieldLabel, LettersCard, LettersPageHeader, PrimaryButton, TextInput } from '../../components/letters/LettersUi'
import { useLettersI18n } from '../../hooks/useLettersI18n'

const defaultColors = ['#3b82f6', '#eab308', '#a855f7', '#22c55e', '#ef4444', '#06b6d4']

export default function LetterCategoriesPage() {
  const { t } = useLettersI18n()
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', description: '', color_tag: '#3b82f6' })
  const [editingId, setEditingId] = useState<number | null>(null)

  async function load() {
    const res = await fetchLetterCategories()
    setCategories(res.data || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (editingId) await updateLetterCategory(editingId, form)
    else await createLetterCategory(form)
    setForm({ name: '', description: '', color_tag: '#3b82f6' })
    setEditingId(null)
    await load()
  }

  return (
    <div className="space-y-6">
      <LettersPageHeader title={t('letterCategories')} action={<PrimaryButton onClick={() => { setEditingId(null); setForm({ name: '', description: '', color_tag: '#3b82f6' }) }}>+ {t('addCategory')}</PrimaryButton>} />
      <LettersCard>
        <form onSubmit={save} className="mb-6 grid gap-4 md:grid-cols-3">
          <div><FieldLabel required>{t('categoryName')}</FieldLabel><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><FieldLabel>{t('description')}</FieldLabel><TextInput value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <FieldLabel>Color</FieldLabel>
            <div className="flex gap-2">
              <TextInput value={form.color_tag} onChange={e => setForm({ ...form, color_tag: e.target.value })} />
              <input type="color" value={form.color_tag} onChange={e => setForm({ ...form, color_tag: e.target.value })} className="h-10 w-12 rounded border" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {defaultColors.map(color => (
                <button key={color} type="button" className="h-6 w-6 rounded-full border-2" style={{ backgroundColor: color, borderColor: form.color_tag === color ? color : 'transparent' }} onClick={() => setForm({ ...form, color_tag: color })} />
              ))}
            </div>
          </div>
          <div className="md:col-span-3"><PrimaryButton type="submit">{editingId ? t('save') : t('addCategory')}</PrimaryButton></div>
        </form>
        <table className="min-w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="py-3 pr-4">{t('categoryName')}</th><th className="py-3 pr-4">{t('description')}</th><th className="py-3 pr-4">Color</th><th className="py-3">{t('actions')}</th></tr></thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b">
                <td className="py-3 pr-4 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color_tag || '#94a3b8' }} />
                    {cat.name}
                  </span>
                </td>
                <td className="py-3 pr-4">{cat.description || '—'}</td>
                <td className="py-3 pr-4 font-mono text-xs">{cat.color_tag || '—'}</td>
                <td className="py-3">
                  <button className="mr-3 text-blue-600" onClick={() => { setEditingId(cat.id); setForm({ name: cat.name, description: cat.description || '', color_tag: cat.color_tag || '#3b82f6' }) }}>{t('edit')}</button>
                  <button className="text-red-600" onClick={async () => { await deleteLetterCategory(cat.id); await load() }}>{t('delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LettersCard>
    </div>
  )
}
