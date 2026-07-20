import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchPublicSettings, type PublicSettings } from '../../api/landing'

export default function PricingSection() {
  const [settings, setSettings] = useState<PublicSettings | null>(null)

  useEffect(() => {
    fetchPublicSettings()
      .then((res) => setSettings(res.data))
      .catch(() => setSettings({
        per_student_license_fee: 0,
        per_student_license_currency: 'USD',
        per_student_license_period: 'per_semester',
        per_student_license_label: 'Per Semester',
      }))
  }, [])

  const fee = settings?.per_student_license_fee ?? settings?.student_registration_fee ?? 0
  const currency = settings?.per_student_license_currency ?? settings?.registration_fee_currency ?? 'USD'
  const label = settings?.per_student_license_label ?? settings?.registration_fee_label ?? 'Per Semester'

  return (
    <section className="bg-slate-50 py-20" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#1e3a8a] sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-slate-600">Per-student license fee — configurable by platform administrators</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-10 max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1a56db] px-6 py-4 text-center text-white">
            <p className="text-sm font-medium uppercase tracking-wider text-white/80">Per Student License</p>
          </div>
          <div className="p-8 text-center">
            <p className="text-5xl font-bold text-[#1e3a8a]">
              {currency === 'USD' ? '$' : ''}{fee}
              {currency !== 'USD' ? ` ${currency}` : ''}
            </p>
            <p className="mt-2 text-lg font-medium text-slate-600">{label}</p>
            <p className="mt-4 text-sm text-slate-500">
              Institution registration fees are set by each school and may apply during admissions.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
