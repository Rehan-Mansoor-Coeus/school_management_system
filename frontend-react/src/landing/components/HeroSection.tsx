import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, GraduationCap, Play, Sparkles } from 'lucide-react'
import { ASSMS } from '../assmsConfig'

export default function HeroSection() {
  return (
    <section className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden bg-[#0b1f3a]">
      <picture>
        <source
          type="image/webp"
          srcSet="/hero-campus.webp 1920w, /hero-campus-2560.webp 2560w"
          sizes="100vw"
        />
        <img
          src="/hero-campus-2560.jpg"
          srcSet="/hero-campus.jpg 1920w, /hero-campus-2560.jpg 2560w"
          sizes="100vw"
          width={2560}
          height={1440}
          alt="Students on a sunny African school campus"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[68%_38%] sm:object-[62%_40%]"
        />
      </picture>

      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0b1f3a]/80 via-[#0b1f3a]/45 to-transparent sm:from-[#0b1f3a]/75 sm:via-[#0b1f3a]/30"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b1f3a]/50 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="z-10 max-w-xl"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#f0c14b]" />
            Built for African Schools. Designed for the Future.
          </p>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            One System. Every School.{' '}
            <span className="text-[#fb923c]">Endless Possibilities.</span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-white/90 sm:text-lg">
            The complete <strong className="font-semibold text-white">{ASSMS.name}</strong> for modern
            educational institutions. Empowering students, teachers, and administrators.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#ea580c]"
            >
              <GraduationCap className="h-4 w-4" />
              I&apos;m a Student — Register Now
            </Link>
            <Link
              to="/request-institution"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/80 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <Building2 className="h-4 w-4" />
              I&apos;m an Institution — Request Access
            </Link>
          </div>

          <a
            href="#video"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 shadow-sm backdrop-blur-md">
              <Play className="h-4 w-4 fill-white text-white" />
            </span>
            Watch Demo — See How It Works
          </a>
        </motion.div>
      </div>
    </section>
  )
}
