import { useEffect, useState } from 'react'
import { fetchLetterSettings, saveLetterSettings } from '../../api/letters'
import { FieldLabel, LettersCard, LettersPageHeader, PrimaryButton, TextArea, TextInput } from '../../components/letters/LettersUi'
import { useLettersI18n } from '../../hooks/useLettersI18n'

export default function LetterSettingsPage() {
  const { t } = useLettersI18n()
  const [form, setForm] = useState<any>({})
  const [files, setFiles] = useState<any>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const res = await fetchLetterSettings()
    setForm(res.data || {})
  }

  useEffect(() => { load().catch(() => setError('Failed to load settings')) }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const payload = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (v != null && typeof v !== 'object') payload.append(k, String(v))
    })
    Object.entries(files).forEach(([k, v]) => { if (v) payload.append(k, v as File) })
    try {
      await saveLetterSettings(payload)
      setMessage(t('settingsSaved'))
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="space-y-6">
      <LettersPageHeader title={t('letterSettings')} />
      {message && <div className="text-sm text-emerald-600">{message}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <LettersCard>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div><FieldLabel>{t('companyName')}</FieldLabel><TextInput value={form.company_name || ''} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
          <div><FieldLabel>{t('serialPrefix')}</FieldLabel><TextInput value={form.serial_prefix || ''} onChange={e => setForm({ ...form, serial_prefix: e.target.value })} placeholder="ABT/Admin/26/L-" /></div>
          <div><FieldLabel>{t('defaultSignerTitle')}</FieldLabel><TextInput value={form.default_signer_title || ''} onChange={e => setForm({ ...form, default_signer_title: e.target.value })} /></div>
          <div><FieldLabel>{t('letterhead')}</FieldLabel><input type="file" accept="image/*" onChange={e => setFiles({ ...files, letterhead: e.target.files?.[0] })} />{form.letterhead_url && <img src={form.letterhead_url} alt="" className="mt-2 h-16 object-contain" />}</div>
          <div><FieldLabel>{t('footerImage')}</FieldLabel><input type="file" accept="image/*" onChange={e => setFiles({ ...files, footer: e.target.files?.[0] })} />{form.footer_url && <img src={form.footer_url} alt="" className="mt-2 h-16 object-contain" />}</div>
          <div><FieldLabel>{t('logo')}</FieldLabel><input type="file" accept="image/*" onChange={e => setFiles({ ...files, logo: e.target.files?.[0] })} />{form.logo_url && <img src={form.logo_url} alt="" className="mt-2 h-16 object-contain" />}</div>
          <div className="md:col-span-2"><FieldLabel>{t('defaultFooterText')}</FieldLabel><TextArea rows={4} value={form.default_footer_text || ''} onChange={e => setForm({ ...form, default_footer_text: e.target.value })} /></div>
          <div className="md:col-span-2"><PrimaryButton type="submit">{t('save')}</PrimaryButton></div>
        </form>
      </LettersCard>
    </div>
  )
}
