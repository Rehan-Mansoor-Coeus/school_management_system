import { motion } from 'framer-motion'
import { Building2, Clock, CreditCard, Headphones, Users } from 'lucide-react'
import { LANDING_STATS } from '../assmsConfig'

const icons = [Building2, Users, CreditCard, Clock, Headphones]

export default function StatsBar() {
  return (
    <section className="relative bg-[#1e3a8a] py-10 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-5">
        {LANDING_STATS.map((stat, i) => {
          const Icon = icons[i]
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Icon className="h-5 w-5 text-[#f0c14b]" />
              </div>
              <p className="text-2xl font-bold sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-white/75">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
