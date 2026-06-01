import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Calendar, Info, Paperclip, Send, UserPlus, Users } from 'lucide-react'
import {
  createLetter, fetchLetter, fetchLetterCategories, fetchLetterSettings,
  previewLetter, updateLetter,
} from '../../api/letters'
import LetterCategorySelect from '../../components/letters/LetterCategorySelect'
import TabbedRecipientSelect, { type RecipientOption } from '../../components/letters/TabbedRecipientSelect'
import SimpleRichTextEditor, { type SimpleRichTextEditorRef } from '../../components/letters/SimpleRichTextEditor'
import {
  A4Preview, FieldLabel, LettersCard, PrimaryButton, SecondaryButton,
  SelectInput, TextArea, TextInput,
} from '../../components/letters/LettersUi'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/ToastProvider'
import { useLettersI18n } from '../../hooks/useLettersI18n'
import { useAuth } from '../../context/AuthContext'

const FORWARD_ROUTES: Record<string, string> = {
  editor: '/letters/awaiting-editing',
  approver: '/letters/awaiting-approval',
  signer: '/letters/awaiting-signature',
  sender: '/letters/ready-to-send',
}

const PLACEHOLDERS = ['{name}', '{email}', '{phone_number}', '{address}', '{date}', '{institution_name}', '{reference}']
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

export default function CreateLetterPage() {
  const { id } = useParams()
  const editId = id ? Number(id) : null
  const isEdit = !!editId
  const { t } = useLettersI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bodyEditorRef = useRef<SimpleRichTextEditorRef>(null)

  const [categories, setCategories] = useState<any[]>([])
  const [recipients, setRecipients] = useState<RecipientOption[]>([])
  const [ccRecipients, setCcRecipients] = useState<RecipientOption[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [letterStatus, setLetterStatus] = useState('')
  const [scheduleLater, setScheduleLater] = useState(false)
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([''])

  const [form, setForm] = useState<any>({
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
    scheduled_at: '',
  })

  function loadDefaultHeader() {
    fetchLetterSettings()
      .then(res => {
        const company = res.data?.company_name
        if (company && !isEdit) setForm((prev: any) => ({ ...prev, header_html: company }))
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchLetterCategories()
      .then(c => setCategories(c.data || []))
      .catch(() => setError('Failed to load form data'))
    if (!isEdit) loadDefaultHeader()
  }, [isEdit])

  useEffect(() => {
    if (!editId) return
    fetchLetter(editId)
      .then(res => {
        const letter = res.data
        setLetterStatus(letter.status || '')
        setForm({
          author_name: letter.author_name || user?.name || '',
          subject: letter.subject || '',
          header_html: letter.header_html || '',
          body_html: letter.body_html || '',
          footer_html: letter.footer_html || '',
          comment: '',
          forward_to: 'editor',
          save_as_template: false,
          template_name: '',
          category_id: letter.category_id ? String(letter.category_id) : '',
          scheduled_at: letter.scheduled_at || '',
        })
        setRecipients((letter.recipients || []).map((r: any) => ({
          name: r.name,
          email: r.email,
          phone: r.phone,
          address: r.address,
          recipient_type: r.recipient_type,
          recipient_id: r.recipient_id,
        })))
        setCcRecipients((letter.cc_recipients || []).map((r: any) => ({
          name: r.name,
          email: r.email,
          phone: r.phone,
          address: r.address,
          recipient_type: r.recipient_type,
          recipient_id: r.recipient_id,
        })))
      })
      .catch(() => setError('Failed to load letter for editing.'))
  }, [editId, user?.name])

  function insertPlaceholder(token: string) {
    bodyEditorRef.current?.insertText(token)
  }

  function onAttachmentChange(files: FileList | File[]) {
    const valid: File[] = []
    Array.from(files).forEach(file => {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        pushToast(`${file.name} exceeds 10MB and was skipped.`, 'error')
        return
      }
      valid.push(file)
    })
    if (valid.length) setAttachments(prev => [...prev, ...valid])
  }

  async function handlePreview() {
    if (!editId) {
      pushToast('Save the letter first to preview the final layout.', 'error')
      return
    }
    setBusy(true)
    try {
      const res = await previewLetter(editId)
      setPreview(res.data.preview)
      setPreviewOpen(true)
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Unable to preview letter', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEdit && !recipients.length) {
      setError('Select at least one recipient.')
      return
    }
    if (!form.subject.trim()) {
      setError('Subject is required.')
      return
    }
    setError('')
    setBusy(true)

    try {
      if (isEdit) {
        await updateLetter(editId!, {
          subject: form.subject,
          header_html: form.header_html,
          body_html: form.body_html,
          footer_html: form.footer_html,
          comment: form.comment || undefined,
        })
        pushToast('Letter updated successfully.')
        window.dispatchEvent(new Event('letters:refresh-counts'))
        const routeMap: Record<string, string> = {
          awaiting_approval: '/letters/awaiting-approval',
          awaiting_signature: '/letters/awaiting-signature',
          awaiting_editing: '/letters/awaiting-editing',
          rejected: '/letters/rejected',
        }
        navigate(routeMap[letterStatus] || '/letters/listing')
        return
      }

      const payload = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === 'boolean') payload.append(k, v ? '1' : '0')
        else if (v != null && v !== '') payload.append(k, String(v))
      })
      payload.append('recipients', JSON.stringify(recipients))
      payload.append('cc_recipients', JSON.stringify(ccRecipients))
      attachments.forEach(file => payload.append('attachments[]', file))
      if (scheduleLater) {
        const times = scheduleTimes.filter(t => t.trim())
        if (times.length) {
          payload.append('schedules', JSON.stringify(times))
          payload.append('scheduled_at', times[0])
        }
      }

      await createLetter(payload)
      window.dispatchEvent(new Event('letters:refresh-counts'))
      pushToast('Letter created successfully.')
      navigate(FORWARD_ROUTES[form.forward_to] || '/letters/listing')
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} letter`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f]">{isEdit ? 'Edit Letter' : t('createLetter')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEdit
              ? 'Update letter content, then forward or approve from the queue.'
              : 'Compose formal letters with rich formatting and route through approval workflow.'}
          </p>
        </div>
        {!isEdit && (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Users className="h-5 w-5 text-[#1e3a5f]" />
            <div>
              <div className="text-xs text-slate-500">Selected Recipients</div>
              <div className="text-lg font-bold text-[#1e3a5f]">{recipients.length}</div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <form onSubmit={submit}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <LettersCard>
            <h2 className="mb-5 text-lg font-bold text-[#1e3a5f]">Letter Content</h2>

            <div className="space-y-4">
              <div>
                <FieldLabel>{t('category')}</FieldLabel>
                <LetterCategorySelect
                  categories={categories}
                  value={form.category_id}
                  onChange={value => setForm({ ...form, category_id: value })}
                  disabled={isEdit}
                />
              </div>

              <div>
                <FieldLabel required>{t('subject')}</FieldLabel>
                  <TextInput
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="Enter letter subject"
                    required
                  />
              </div>

              <div>
                <FieldLabel>{t('header')}</FieldLabel>
                <TextInput
                  value={form.header_html}
                  onChange={e => setForm({ ...form, header_html: e.target.value })}
                  placeholder="e.g. Alpha Bridge Technologies"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Letterhead image from Letter Settings appears on the final A4 PDF. This field is optional intro text below the header.
                </p>
              </div>

              <div>
                <FieldLabel required>{t('body')}</FieldLabel>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Insert Variables:</span>
                  {PLACEHOLDERS.map(token => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => insertPlaceholder(token)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {token}
                    </button>
                  ))}
                </div>
                <SimpleRichTextEditor
                  ref={bodyEditorRef}
                  value={form.body_html}
                  onChange={v => setForm({ ...form, body_html: v })}
                  placeholder="Write your letter body..."
                  minHeight={220}
                />
              </div>

              <div>
                <FieldLabel>{t('footer')}</FieldLabel>
                <SimpleRichTextEditor
                  value={form.footer_html}
                  onChange={v => setForm({ ...form, footer_html: v })}
                  placeholder="Optional footer text..."
                  minHeight={100}
                />
              </div>

              {!isEdit && (
                <div>
                  <FieldLabel>Attachments</FieldLabel>
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      if (e.dataTransfer.files?.length) onAttachmentChange(e.dataTransfer.files)
                    }}
                  >
                    <Paperclip className="mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">Attach PDFs, Documents or Images (Max 10MB each)</p>
                    {attachments.length > 0 ? (
                      <ul className="mt-3 w-full space-y-1 text-left text-sm text-[#1e3a5f]">
                        {attachments.map((file, index) => (
                          <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                            <span className="truncate pr-2">{file.name}</span>
                            <button type="button" className="shrink-0 text-xs text-rose-600 underline" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}>Remove</button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">Drag and drop or browse files</p>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.length) onAttachmentChange(e.target.files)
                        e.target.value = ''
                      }}
                    />
                    <SecondaryButton type="button" className="mt-4" onClick={() => fileInputRef.current?.click()}>Browse Files</SecondaryButton>
                  </div>
                </div>
              )}
            </div>
          </LettersCard>

          <div className="space-y-6">
            <LettersCard>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1e3a5f]">Letter Options</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>

              <div className="space-y-4">
                <div>
                  <FieldLabel>{t('authorName')}</FieldLabel>
                  <TextInput value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })} disabled={isEdit} />
                </div>

                <div>
                  <FieldLabel>{t('comment')}</FieldLabel>
                  <TextArea
                    rows={3}
                    value={form.comment}
                    onChange={e => setForm({ ...form, comment: e.target.value })}
                    placeholder="Optional workflow comment..."
                  />
                </div>

                {!isEdit && (
                  <>
                    <div>
                      <FieldLabel>{t('forwardTo')}</FieldLabel>
                      <SelectInput value={form.forward_to} onChange={e => setForm({ ...form, forward_to: e.target.value })}>
                        <option value="editor">Editor</option>
                        <option value="approver">Approver</option>
                        <option value="signer">Signer</option>
                        <option value="sender">Sender</option>
                      </SelectInput>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={scheduleLater} onChange={e => setScheduleLater(e.target.checked)} className="rounded" />
                      <Calendar className="h-4 w-4 text-slate-500" />
                      Schedule for later
                    </label>

                    {scheduleLater && (
                      <div className="space-y-3">
                        <FieldLabel>Schedule Date &amp; Time</FieldLabel>
                        {scheduleTimes.map((time, index) => (
                          <div key={`schedule-${index}`} className="flex gap-2">
                            <TextInput
                              type="datetime-local"
                              value={time}
                              onChange={e => setScheduleTimes(prev => prev.map((item, i) => (i === index ? e.target.value : item)))}
                              className="flex-1"
                            />
                            {scheduleTimes.length > 1 && (
                              <button type="button" className="rounded-xl px-3 text-sm text-rose-600 hover:bg-rose-50" onClick={() => setScheduleTimes(prev => prev.filter((_, i) => i !== index))}>
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" className="text-sm font-semibold text-[#1e3a5f]" onClick={() => setScheduleTimes(prev => [...prev, ''])}>
                          + Add another schedule
                        </button>
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.save_as_template} onChange={e => setForm({ ...form, save_as_template: e.target.checked })} />
                      {t('saveAsTemplate')}
                    </label>
                    {form.save_as_template && (
                      <div>
                        <FieldLabel>{t('templateName')}</FieldLabel>
                        <TextInput value={form.template_name} onChange={e => setForm({ ...form, template_name: e.target.value })} />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                {isEdit && (
                  <SecondaryButton type="button" className="w-full" onClick={handlePreview} disabled={busy}>
                    Preview Letter
                  </SecondaryButton>
                )}
                <PrimaryButton type="submit" className="flex w-full items-center justify-center gap-2" disabled={busy}>
                  <Send className="h-4 w-4" />
                  {isEdit ? 'Save Changes' : t('submit')}
                </PrimaryButton>
                {isEdit && (
                  <SecondaryButton type="button" className="w-full" onClick={() => navigate(-1)}>Cancel</SecondaryButton>
                )}
              </div>
            </LettersCard>

            {!isEdit && (
              <>
                <LettersCard>
                  <div className="mb-1 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-[#1e3a5f]" />
                    <h2 className="text-lg font-bold text-[#1e3a5f]">To Recipients</h2>
                  </div>
                  <p className="mb-4 text-sm text-slate-500">Required — choose who will receive this letter.</p>
                  <TabbedRecipientSelect label="To" required value={recipients} onChange={setRecipients} />
                </LettersCard>

                <LettersCard>
                  <div className="mb-1 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-[#1e3a5f]" />
                    <h2 className="text-lg font-bold text-[#1e3a5f]">{t('ccRecipients')}</h2>
                  </div>
                  <TabbedRecipientSelect label={t('ccRecipients')} value={ccRecipients} onChange={setCcRecipients} />
                </LettersCard>
              </>
            )}

            {isEdit && recipients.length > 0 && (
              <LettersCard>
                <h2 className="mb-3 text-lg font-bold text-[#1e3a5f]">Recipients</h2>
                <ul className="space-y-2 text-sm text-slate-700">
                  {recipients.map((r, i) => (
                    <li key={`${r.name}-${i}`} className="rounded-lg bg-slate-50 px-3 py-2">{r.name}{r.phone ? ` · ${r.phone}` : ''}</li>
                  ))}
                </ul>
              </LettersCard>
            )}
          </div>
        </div>
      </form>

      <Modal
        title="Letter Preview"
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        wide
        footer={<SecondaryButton onClick={() => setPreviewOpen(false)}>Close</SecondaryButton>}
      >
        {preview ? <A4Preview preview={preview} /> : null}
      </Modal>
    </div>
  )
}
