import { useEffect, useState } from 'react'
import { createLetterTemplate, deleteLetterTemplate, fetchLetterCategories, fetchLetterTemplates, updateLetterTemplate } from '../../api/letters'
import SimpleRichTextEditor from '../../components/letters/SimpleRichTextEditor'
import { FieldLabel, LettersCard, LettersPageHeader, PrimaryButton, SelectInput, TextInput } from '../../components/letters/LettersUi'
import { useLettersI18n } from '../../hooks/useLettersI18n'

export default function LetterTemplatesPage() {
  const { t } = useLettersI18n()
  const [templates, setTemplates] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState<any>({ name: '', subject: '', header_html: '', body_html: '', footer_html: '', category_id: '' })
  const [editingId, setEditingId] = useState<number | null>(null)

  async function load() {
    const [tRes, cRes] = await Promise.all([fetchLetterTemplates(), fetchLetterCategories()])
    setTemplates(tRes.data || [])
    setCategories(cRes.data || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...form, category_id: form.category_id || null }
    if (editingId) await updateLetterTemplate(editingId, payload)
    else await createLetterTemplate(payload)
    setForm({ name: '', subject: '', header_html: '', body_html: '', footer_html: '', category_id: '' })
    setEditingId(null)
    await load()
  }

  return (
    <div className="space-y-6">
      <LettersPageHeader title={t('letterTemplates')} action={<PrimaryButton onClick={() => setEditingId(null)}>+ {t('addTemplate')}</PrimaryButton>} />
      <LettersCard>
        <form onSubmit={save} className="mb-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div><FieldLabel required>{t('templateName')}</FieldLabel><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><FieldLabel>{t('category')}</FieldLabel><SelectInput value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}><option value="">—</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</SelectInput></div>
            <div className="md:col-span-2"><FieldLabel>{t('subject')}</FieldLabel><TextInput value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
          </div>
          <div><FieldLabel>{t('header')}</FieldLabel><SimpleRichTextEditor value={form.header_html} onChange={v => setForm({ ...form, header_html: v })} minHeight={120} /></div>
          <div><FieldLabel>{t('body')}</FieldLabel><SimpleRichTextEditor value={form.body_html} onChange={v => setForm({ ...form, body_html: v })} /></div>
          <div><FieldLabel>{t('footer')}</FieldLabel><SimpleRichTextEditor value={form.footer_html} onChange={v => setForm({ ...form, footer_html: v })} minHeight={120} /></div>
          <PrimaryButton type="submit">{editingId ? t('save') : t('addTemplate')}</PrimaryButton>
        </form>
        <table className="min-w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="py-3 pr-4">{t('templateName')}</th><th className="py-3 pr-4">{t('subject')}</th><th className="py-3">{t('actions')}</th></tr></thead>
          <tbody>
            {templates.map(item => (
              <tr key={item.id} className="border-b">
                <td className="py-3 pr-4 font-semibold">{item.name}</td>
                <td className="py-3 pr-4">{item.subject}</td>
                <td className="py-3">
                  <button className="mr-3 text-blue-600" onClick={() => { setEditingId(item.id); setForm(item) }}>{t('edit')}</button>
                  <button className="text-red-600" onClick={async () => { await deleteLetterTemplate(item.id); await load() }}>{t('delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LettersCard>
    </div>
  )
}
