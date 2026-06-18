import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { fetchLetterSettings, saveLetterSettings } from '../../api/letters'
import { FieldLabel, LettersCard, LettersPageHeader, PrimaryButton, TextArea, TextInput } from '../../components/letters/LettersUi'
import { useLettersI18n } from '../../hooks/useLettersI18n'

type AssetField = 'letterhead' | 'footer' | 'logo'

function AssetUpload({
  label,
  field,
  url,
  pendingFile,
  onPick,
  onRemove,
}: {
  label: string
  field: AssetField
  url?: string | null
  pendingFile?: File
  onPick: (field: AssetField, file?: File) => void
  onRemove: (field: AssetField) => void
}) {
  const previewUrl = pendingFile ? URL.createObjectURL(pendingFile) : url

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input type="file" accept="image/*" onChange={e => onPick(field, e.target.files?.[0])} className="block w-full text-sm" />
      {(previewUrl || pendingFile || url) && (
        <div className="relative mt-2 inline-block rounded-xl border border-slate-200 bg-slate-50 p-2">
          {previewUrl ? (
            <img src={previewUrl} alt={label} className="h-20 max-w-[220px] object-contain" />
          ) : (
            <div className="flex h-20 w-32 items-center justify-center text-xs text-slate-500">Attached</div>
          )}
          <button
            type="button"
            onClick={() => onRemove(field)}
            className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white shadow hover:bg-rose-700"
            aria-label={`Remove ${label}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function LetterSettingsPage() {
  const { t } = useLettersI18n()
  const [form, setForm] = useState<any>({})
  const [files, setFiles] = useState<Partial<Record<AssetField, File>>>({})
  const [removeFlags, setRemoveFlags] = useState<Partial<Record<AssetField, boolean>>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const res = await fetchLetterSettings()
    setForm(res.data || {})
    setFiles({})
    setRemoveFlags({})
  }

  useEffect(() => { load().catch(() => setError('Failed to load settings')) }, [])

  function pickAsset(field: AssetField, file?: File) {
    if (!file) return
    setFiles(prev => ({ ...prev, [field]: file }))
    setRemoveFlags(prev => ({ ...prev, [field]: false }))
  }

  function removeAsset(field: AssetField) {
    setFiles(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setRemoveFlags(prev => ({ ...prev, [field]: true }))
    const urlKey = field === 'footer' ? 'footer_url' : field === 'letterhead' ? 'letterhead_url' : 'logo_url'
    setForm((prev: any) => ({ ...prev, [urlKey]: null }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const payload = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (v != null && typeof v !== 'object' && !k.endsWith('_url')) payload.append(k, String(v))
    })
    Object.entries(files).forEach(([k, v]) => { if (v) payload.append(k, v as File) })
    ;(['letterhead', 'footer', 'logo'] as AssetField[]).forEach(field => {
      if (removeFlags[field]) payload.append(`remove_${field}`, '1')
    })
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
          <AssetUpload label={t('letterhead')} field="letterhead" url={removeFlags.letterhead ? null : form.letterhead_url} pendingFile={files.letterhead} onPick={pickAsset} onRemove={removeAsset} />
          <AssetUpload label={t('footerImage')} field="footer" url={removeFlags.footer ? null : form.footer_url} pendingFile={files.footer} onPick={pickAsset} onRemove={removeAsset} />
          <AssetUpload label={t('logo')} field="logo" url={removeFlags.logo ? null : form.logo_url} pendingFile={files.logo} onPick={pickAsset} onRemove={removeAsset} />
          <div className="md:col-span-2"><FieldLabel>{t('defaultFooterText')}</FieldLabel><TextArea rows={4} value={form.default_footer_text || ''} onChange={e => setForm({ ...form, default_footer_text: e.target.value })} /></div>
          <div className="md:col-span-2"><PrimaryButton type="submit">{t('save')}</PrimaryButton></div>
        </form>
      </LettersCard>
    </div>
  )
}
