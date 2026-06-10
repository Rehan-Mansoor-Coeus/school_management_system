import { motion } from 'framer-motion'
import { TrendingUp, BarChart3, BookOpen, GraduationCap, LayoutDashboard, Settings, Users, Wallet } from 'lucide-react'

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Users, label: 'Students' },
  { icon: GraduationCap, label: 'Academics' },
  { icon: Wallet, label: 'Finance' },
  { icon: BookOpen, label: 'Library' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
]

export function QuickStatsCard() {
  const rows = [
    { label: 'Students', value: '12,540', delta: '+12%', color: 'text-[#1a56db]' },
    { label: 'Teachers', value: '1,245', delta: '+8%', color: 'text-emerald-600' },
    { label: 'Institutions', value: '156', delta: '+15%', color: 'text-[#f97316]' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="absolute -right-2 top-0 z-30 w-56 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-sm xl:-right-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Quick Overview</p>
      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-slate-600">{row.label}</span>
            <div className="text-right">
              <p className={`font-bold ${row.color}`}>{row.value}</p>
              <p className="flex items-center justify-end gap-0.5 text-[10px] font-semibold text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                {row.delta}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative mr-16 w-full max-w-[520px]"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs font-medium text-slate-500">ASSMS Dashboard</span>
        </div>
        <div className="flex">
          <div className="w-12 shrink-0 bg-[#1e3a8a] py-3 sm:w-14">
            {sidebarItems.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${i === 0 ? 'bg-white/20 text-white' : 'text-white/55'}`}
                  title={item.label}
                >
                  <Icon className="h-4 w-4" />
                </div>
              )
            })}
          </div>
          <div className="flex-1 p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Total Students', value: '12,540', color: 'text-[#1a56db]' },
                { label: 'Attendance', value: '93.5%', color: 'text-emerald-600' },
                { label: 'Fee Collection', value: '98.7%', color: 'text-[#f97316]' },
                { label: 'Total Schools', value: '156', color: 'text-violet-600' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] leading-tight text-slate-500">{stat.label}</p>
                  <p className={`mt-1 text-sm font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3">
              <p className="text-xs font-semibold text-slate-600">Performance Overview</p>
              <div className="mt-2 flex h-20 items-end gap-1.5">
                {[35, 55, 40, 70, 50, 85, 62, 78].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-[#1a56db] to-[#93c5fd]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-semibold text-slate-600">Recent Activity</p>
              {['New admission submitted', 'Library book returned', 'Fee payment received'].map((line) => (
                <div key={line} className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1a56db]" />
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
