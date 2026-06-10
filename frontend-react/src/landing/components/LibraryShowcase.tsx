import { motion } from 'framer-motion'
import { BookOpen, Inbox, QrCode, CalendarClock, Star, BarChart3 } from 'lucide-react'

const items = [
  { icon: BookOpen, title: 'Book Registration', desc: 'Register titles, ISBNs, copies, and shelf locations.' },
  { icon: Inbox, title: 'Borrow Requests', desc: 'Students request books; librarians approve and issue.' },
  { icon: QrCode, title: 'QR Approval', desc: 'Scan QR codes for fast issue and return at the desk.' },
  { icon: CalendarClock, title: 'Due For Return', desc: 'Automated reminders before and after due dates.' },
  { icon: Star, title: 'Book Reviews', desc: 'Students rate and review frequently borrowed books.' },
  { icon: BarChart3, title: 'Dashboard Statistics', desc: 'Overdue, borrowed, and popular books at a glance.' },
]

export default function LibraryShowcase() {
  return (
    <section className="bg-[#0f2744] py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Modern Library Management</h2>
            <p className="mt-4 text-white/75">From cataloguing to QR-powered borrowing — built for busy campus libraries.</p>
            <div className="mt-8 space-y-4">
              {items.map((item, i) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0c14b]/20 text-[#f0c14b]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-white/70">{item.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] p-6 shadow-2xl"
          >
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold">Library Dashboard</p>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['Borrowed', 'Due', 'Overdue', 'Requests'].map((label, i) => (
                  <div key={label} className="rounded-xl bg-white/10 p-3">
                    <p className="text-2xl font-bold">{[128, 34, 7, 12][i]}</p>
                    <p className="text-xs text-white/70">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-white/10" />
                  <div className="flex-1">
                    <div className="h-2 w-3/4 rounded bg-white/20" />
                    <div className="mt-2 h-2 w-1/2 rounded bg-white/10" />
                  </div>
                  <QrCode className="h-8 w-8 text-[#f0c14b]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
