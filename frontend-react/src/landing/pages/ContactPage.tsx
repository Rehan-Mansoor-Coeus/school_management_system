import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ASSMS, WHATSAPP_URL } from '../assmsConfig'
import { submitSupportTicket } from '../../api/landing'
import { LandingPageHeader } from '../LandingShell'
import { FormField, formInputClass } from '../../components/ui/FormField'

export default function ContactPage() {
  const [searchParams] = useSearchParams()
  const isDemo = searchParams.get('demo') === '1'
  const [form, setForm] = useState({ name: '', email: '', phone: '', institution: '', question: isDemo ? 'I would like to book a demo of ASSMS.' : '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitSupportTicket({ ...form, source: isDemo ? 'demo_request' : 'contact' })
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <LandingPageHeader
        title={isDemo ? 'Book a Demo' : 'Contact Us'}
        subtitle={`Reach ${ASSMS.developer} for support, demos, and institution onboarding.`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <a href={`mailto:${ASSMS.email}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#1e3a5f]/30">{ASSMS.email}</a>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#1e3a5f]/30">{ASSMS.phone}</a>
      </div>

      {done ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">Thank you! We will contact you shortly.</div>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormField label="Name" required><input required className={formInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Email" required><input required type="email" className={formInputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
          <FormField label="Phone"><input className={formInputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
          <FormField label="Institution"><input className={formInputClass} value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} /></FormField>
          <FormField label="Message" required><textarea required rows={4} className={formInputClass} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></FormField>
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#1e3a5f] py-3 text-sm font-semibold text-white disabled:opacity-60">{submitting ? 'Sending…' : 'Send Message'}</button>
        </form>
      )}
    </div>
  )
}
