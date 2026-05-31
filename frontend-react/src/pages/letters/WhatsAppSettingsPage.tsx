import { useEffect, useState } from 'react'
import { fetchWhatsAppSettings, saveWhatsAppSettings } from '../../api/letters'
import { FieldLabel, LettersCard, LettersPageHeader, PrimaryButton, TextInput } from '../../components/letters/LettersUi'
import { useToast } from '../../components/ui/ToastProvider'

export default function WhatsAppSettingsPage() {
  const { pushToast } = useToast()
  const [form, setForm] = useState({
    enabled: true,
    otp_enabled: true,
    otp_expiry_seconds: 180,
    otp_resend_cooldown_seconds: 60,
    session_id: '',
  })
  const [meta, setMeta] = useState<any>(null)

  async function load() {
    const res = await fetchWhatsAppSettings()
    setForm({
      enabled: res.data.settings?.enabled ?? true,
      otp_enabled: res.data.settings?.otp_enabled ?? true,
      otp_expiry_seconds: res.data.settings?.otp_expiry_seconds ?? 180,
      otp_resend_cooldown_seconds: res.data.settings?.otp_resend_cooldown_seconds ?? 60,
      session_id: res.data.settings?.session_id || '',
    })
    setMeta(res.data)
  }

  useEffect(() => { load().catch(() => pushToast('Unable to load WhatsApp settings', 'error')) }, [])

  async function save() {
    try {
      await saveWhatsAppSettings(form)
      pushToast('WhatsApp settings saved.')
      await load()
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Save failed', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <LettersPageHeader
        title="WhatsApp Settings"
        subtitle="Configure OTP and delivery preferences. API credentials are stored in server .env only."
      />

      <LettersCard>
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div><strong>Provider:</strong> WasenderAPI</div>
          <div><strong>Env configured:</strong> {meta?.env_configured ? 'Yes' : 'No — set WASENDER_API_KEY in .env'}</div>
          <div><strong>Base URL:</strong> {meta?.base_url || '—'}</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
            Enable WhatsApp messaging
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.otp_enabled} onChange={e => setForm({ ...form, otp_enabled: e.target.checked })} />
            Require OTP for sensitive letter actions
          </label>
          <div>
            <FieldLabel>OTP expiry (seconds)</FieldLabel>
            <TextInput type="number" value={form.otp_expiry_seconds} onChange={e => setForm({ ...form, otp_expiry_seconds: Number(e.target.value) })} />
          </div>
          <div>
            <FieldLabel>OTP resend cooldown (seconds)</FieldLabel>
            <TextInput type="number" value={form.otp_resend_cooldown_seconds} onChange={e => setForm({ ...form, otp_resend_cooldown_seconds: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Session ID (optional override)</FieldLabel>
            <TextInput value={form.session_id} onChange={e => setForm({ ...form, session_id: e.target.value })} placeholder="Stored in DB; API key remains in .env" />
          </div>
        </div>

        <PrimaryButton className="mt-6" onClick={save}>Save Settings</PrimaryButton>
      </LettersCard>
    </div>
  )
}
