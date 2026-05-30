import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLetter, fetchLetterCategories, fetchLetterTemplates } from '../../api/letters'
import RecipientSelect, { type RecipientOption } from '../../components/letters/RecipientSelect'
import SimpleRichTextEditor from '../../components/letters/SimpleRichTextEditor'
import {
  FieldLabel, LettersCard, LettersPageHeader, PrimaryButton,
  SelectInput, TextArea, TextInput,
} from '../../components/letters/LettersUi'
import { useLettersI18n } from '../../hooks/useLettersI18n'
import { useAuth } from '../../hooks/useAuth'

export default function CreateLetterPage() {
  const { t } = useLettersI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [recipients, setRecipients] = useState<RecipientOption[]>([])
  const [ccRecipients, setCcRecipients] = useState<RecipientOption[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState<any>({
    people_type: 'users',
    author_name: user?.name || '',
    subject: '',
    header_html: '',
    body_html: '<p>Dear {name},</p><p>Your phone: {phone_number}</p><p>Reference: {reference}</p>',
    footer_html: '',
    comment: '',
    forward_to: 'editor',
    save_as_template: false,
    template_name: '',
    category_id: '',
    template_id: '',
    scheduled_at: '',
  })

  useEffect(() => {
    Promise.all([fetchLetterCategories(), fetchLetterTemplates()])
      .then(([c, tmpl]) => { setCategories(c.data || []); setTemplates(tmpl.data || []) })
      .catch(() => setError('Failed to load form data'))
  }, [])

  useEffect(() => {
    if (!form.template_id) return
    const tmpl = templates.find(x => String(x.id) === String(form.template_id))
    if (tmpl) setForm((prev: any) => ({ ...prev, subject: tmpl.subject || prev.subject, header_html: tmpl.header_html || '', body_html: tmpl.body_html || '', footer_html: tmpl.footer_html || '' }))
  }, [form.template_id, templates])

  function onAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    setAttachments(Array.from(e.target.files))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!recipients.length) {
      setError('Select at least one recipient.')
      return
    }
    setError('')
    const payload = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v === 'boolean') payload.append(k, v ? '1' : '0')
      else if (v != null && v !== '') payload.append(k, String(v))
    })
    payload.append('recipients', JSON.stringify(recipients))
    payload.append('cc_recipients', JSON.stringify(ccRecipients))
    attachments.forEach(file => payload.append('attachments[]', file))

    try {
      await createLetter(payload)
      window.dispatchEvent(new Event('letters:refresh-counts'))
      navigate('/letters/awaiting-editing')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create letter')
    }
  }

  return (
    <div className="space-y-6">
      <LettersPageHeader title={t('createLetter')} />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <LettersCard>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div><FieldLabel>{t('category')}</FieldLabel><SelectInput value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}><option value="">—</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</SelectInput></div>
            <div><FieldLabel>{t('letterTemplates')}</FieldLabel><SelectInput value={form.template_id} onChange={e => setForm({ ...form, template_id: e.target.value })}><option value="">—</option>{templates.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</SelectInput></div>
            <div><FieldLabel>{t('authorName')}</FieldLabel><TextInput value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })} /></div>
          </div>

          <RecipientSelect label="To" required value={recipients} onChange={setRecipients} />
          <RecipientSelect label={t('ccRecipients')} value={ccRecipients} onChange={setCcRecipients} />

          <div className="grid gap-4 md:grid-cols-2">
            <div><FieldLabel required>{t('subject')}</FieldLabel><TextInput value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required /></div>
            <div><FieldLabel>{t('scheduleDateTime')}</FieldLabel><TextInput type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} /></div>
            <div><FieldLabel>{t('forwardTo')}</FieldLabel><SelectInput value={form.forward_to} onChange={e => setForm({ ...form, forward_to: e.target.value })}><option value="editor">Editor</option><option value="approver">Approver</option><option value="signer">Signer</option><option value="sender">Sender</option></SelectInput></div>
          </div>

          <div>
            <FieldLabel>Attachments</FieldLabel>
            <input type="file" multiple onChange={onAttachmentChange} className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            {attachments.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                {attachments.map(file => <li key={file.name}>{file.name}</li>)}
              </ul>
            )}
          </div>

          <div><FieldLabel>{t('header')}</FieldLabel><SimpleRichTextEditor value={form.header_html} onChange={v => setForm({ ...form, header_html: v })} minHeight={120} /></div>
          <div>
            <FieldLabel>{t('body')}</FieldLabel>
            <p className="mb-2 text-xs text-slate-500">Placeholders: {'{name}'}, {'{email}'}, {'{phone_number}'}, {'{address}'}, {'{reference}'}, {'{date}'}</p>
            <SimpleRichTextEditor value={form.body_html} onChange={v => setForm({ ...form, body_html: v })} />
          </div>
          <div><FieldLabel>{t('footer')}</FieldLabel><SimpleRichTextEditor value={form.footer_html} onChange={v => setForm({ ...form, footer_html: v })} minHeight={120} /></div>
          <div><FieldLabel>{t('comment')}</FieldLabel><TextArea rows={3} value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.save_as_template} onChange={e => setForm({ ...form, save_as_template: e.target.checked })} />{t('saveAsTemplate')}</label>
          {form.save_as_template && <div><FieldLabel>{t('templateName')}</FieldLabel><TextInput value={form.template_name} onChange={e => setForm({ ...form, template_name: e.target.value })} /></div>}
          <PrimaryButton type="submit">{t('submit')}</PrimaryButton>
        </form>
      </LettersCard>
    </div>
  )
}
