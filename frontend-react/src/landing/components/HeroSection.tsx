import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, GraduationCap, Play, Sparkles } from 'lucide-react'
import { ASSMS } from '../assmsConfig'
import DashboardMockup, { QuickStatsCard } from './DashboardMockup'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <img
        src="/hero-banner.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-28 pt-10 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-6 lg:pb-32 lg:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="z-10 max-w-xl"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/90 px-4 py-1.5 text-xs font-semibold text-[#ea580c] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Built for African Schools. Designed for the Future.
          </p>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-[#1e3a8a] sm:text-5xl lg:text-[3.4rem]">
            One System. Every School.{' '}
            <span className="text-[#f97316]">Endless Possibilities.</span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
            The complete <strong className="font-semibold text-[#1e3a8a]">{ASSMS.name}</strong> for modern
            educational institutions. Empowering students, teachers, and administrators.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1e3a8a] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#1a56db]"
            >
              <GraduationCap className="h-4 w-4" />
              I&apos;m a Student — Register Now
            </Link>
            <Link
              to="/request-institution"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1a56db] bg-white/95 px-6 py-3.5 text-sm font-bold text-[#1a56db] backdrop-blur-sm transition hover:bg-[#eff6ff]"
            >
              <Building2 className="h-4 w-4" />
              I&apos;m an Institution — Request Access
            </Link>
          </div>

          <a
            href="#video"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#1a56db]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
              <Play className="h-4 w-4 fill-[#1a56db] text-[#1a56db]" />
            </span>
            Watch Demo — See How It Works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative z-10 hidden min-h-[420px] lg:block"
        >
          <div className="relative ml-auto w-full max-w-[640px] pt-4">
            <DashboardMockup />
            <QuickStatsCard />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
