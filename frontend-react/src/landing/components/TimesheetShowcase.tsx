import { motion } from 'framer-motion'
import { ClipboardList, CalendarDays, Clock, BarChart3, Timer } from 'lucide-react'

const items = [
  { icon: ClipboardList, title: 'Create Activity', desc: 'Define work activities and categories for staff.' },
  { icon: CalendarDays, title: 'Fill Timesheet', desc: 'Log daily hours against assigned activities.' },
  { icon: Clock, title: 'Working Week', desc: 'Set standard working hours and schedules.' },
  { icon: BarChart3, title: 'Reports', desc: 'Supervisors review and export timesheet reports.' },
  { icon: Timer, title: 'Overtime', desc: 'Track overtime with approval workflows.' },
]

export default function TimesheetShowcase() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <p className="mb-4 font-semibold text-[#1e3a5f]">Timesheet Overview</p>
            <div className="space-y-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-10 text-sm font-medium text-slate-500">{day}</span>
                  <div className="h-3 flex-1 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-[#1e3a5f]" style={{ width: `${60 + i * 8}%` }} />
                  </div>
                  <span className="text-sm text-slate-600">{7 + i}h</span>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-[#1e3a5f] sm:text-4xl">Timesheet & Workforce Tracking</h2>
            <p className="mt-4 text-slate-600">From activities to overtime — complete visibility for HR and supervisors.</p>
            <div className="mt-8 space-y-3">
              {items.map((item, i) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f]/10 text-[#1e3a5f]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
