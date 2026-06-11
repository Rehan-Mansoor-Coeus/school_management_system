import { motion } from 'framer-motion'
import { whyChooseItems, testimonials } from '../landingData'

export function WhyChooseSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-[#1e3a8a] sm:text-4xl">
          Why Choose <span className="text-[#1a56db]">ASSMS</span>
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {whyChooseItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#1a56db]/20 hover:shadow-md"
            >
              <p className="font-semibold text-[#1e3a8a]">{item.title}</p>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-[#eff6ff] to-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-[#1e3a8a]">Trusted by Institutions</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-slate-700">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4">
                <p className="font-semibold text-[#1e3a8a]">{t.name}</p>
                <p className="text-sm text-slate-500">{t.role}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
