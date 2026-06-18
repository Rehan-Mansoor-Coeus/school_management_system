import { useEffect, useState } from 'react'
import { fetchGeneralSettings, updateGeneralSettings } from '../api/landing'
import { FormField, formInputClass } from '../components/ui/FormField'
import { useToast } from '../components/ui/ToastProvider'

export default function GeneralSettingsPage() {
  const { pushToast } = useToast()
  const [form, setForm] = useState({ student_registration_fee: '2', registration_fee_currency: 'USD', registration_fee_period: 'per_semester' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGeneralSettings()
      .then((res) => {
        const d = res.data
        setForm({
          student_registration_fee: String(d.student_registration_fee ?? 2),
          registration_fee_currency: d.registration_fee_currency || 'USD',
          registration_fee_period: d.registration_fee_period || 'per_semester',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateGeneralSettings({
        student_registration_fee: Number(form.student_registration_fee),
        registration_fee_currency: form.registration_fee_currency,
        registration_fee_period: form.registration_fee_period,
      })
      pushToast('General settings saved.', 'success')
    } catch {
      pushToast('Unable to save settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">General Settings</h1>
        <p className="text-sm text-slate-500">Platform-wide settings shown on the public landing page.</p>
      </div>
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <FormField label="Student Registration Fee" required>
          <input required type="number" min="0" step="0.01" className={formInputClass} value={form.student_registration_fee} onChange={(e) => setForm({ ...form, student_registration_fee: e.target.value })} />
        </FormField>
        <FormField label="Currency">
          <input className={formInputClass} value={form.registration_fee_currency} onChange={(e) => setForm({ ...form, registration_fee_currency: e.target.value })} />
        </FormField>
        <FormField label="Fee Period Label" hint="e.g. per_semester displays as Per Semester">
          <input className={formInputClass} value={form.registration_fee_period} onChange={(e) => setForm({ ...form, registration_fee_period: e.target.value })} />
        </FormField>
        <button type="submit" disabled={saving} className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
