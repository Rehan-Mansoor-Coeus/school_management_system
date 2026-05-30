import { useEffect, useState } from 'react'
import { createLetterCategory, deleteLetterCategory, fetchLetterCategories, updateLetterCategory } from '../../api/letters'
import { FieldLabel, LettersCard, LettersPageHeader, PrimaryButton, TextArea, TextInput } from '../../components/letters/LettersUi'
import { useLettersI18n } from '../../hooks/useLettersI18n'

export default function LetterCategoriesPage() {
  const { t } = useLettersI18n()
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', description: '' })
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
    setForm({ name: '', description: '' })
    setEditingId(null)
    await load()
  }

  return (
    <div className="space-y-6">
      <LettersPageHeader title={t('letterCategories')} action={<PrimaryButton onClick={() => { setEditingId(null); setForm({ name: '', description: '' }) }}>+ {t('addCategory')}</PrimaryButton>} />
      <LettersCard>
        <form onSubmit={save} className="mb-6 grid gap-4 md:grid-cols-2">
          <div><FieldLabel required>{t('categoryName')}</FieldLabel><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><FieldLabel>{t('description')}</FieldLabel><TextInput value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="md:col-span-2"><PrimaryButton type="submit">{editingId ? t('save') : t('addCategory')}</PrimaryButton></div>
        </form>
        <table className="min-w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="py-3 pr-4">{t('categoryName')}</th><th className="py-3 pr-4">{t('description')}</th><th className="py-3">{t('actions')}</th></tr></thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b">
                <td className="py-3 pr-4 font-semibold">{cat.name}</td>
                <td className="py-3 pr-4">{cat.description || '—'}</td>
                <td className="py-3">
                  <button className="mr-3 text-blue-600" onClick={() => { setEditingId(cat.id); setForm({ name: cat.name, description: cat.description || '' }) }}>{t('edit')}</button>
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
