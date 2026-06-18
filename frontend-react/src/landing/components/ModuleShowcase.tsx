import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { moduleCards } from '../landingData'

export default function ModuleShowcase() {
  const [showAll, setShowAll] = useState(false)
  const featured = moduleCards.filter((m) => m.featured)
  const displayed = showAll ? moduleCards : featured

  return (
    <section className="bg-white py-20" id="modules">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold text-[#1e3a8a] sm:text-4xl">
              Everything You Need to Run a{' '}
              <span className="text-[#1a56db]">Smarter School</span>
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Powerful modules designed to simplify every aspect of school management.
            </p>
          </div>
          {!showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-[#1a56db] px-5 py-2.5 text-sm font-semibold text-[#1a56db] transition hover:bg-[#eff6ff]"
            >
              View All Modules
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((mod, i) => {
            const Icon = mod.icon
            return (
              <motion.article
                key={mod.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#1a56db]/30 hover:shadow-lg"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${mod.iconBg ?? 'bg-blue-100 text-blue-600'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1e3a8a]">{mod.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{mod.description}</p>
                {showAll && (
                  <ul className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    {mod.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                )}
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
