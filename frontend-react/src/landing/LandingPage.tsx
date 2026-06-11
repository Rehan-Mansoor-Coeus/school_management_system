import LandingNav from './components/LandingNav'
import LandingFooter from './components/LandingFooter'
import WhatsAppButton from './components/WhatsAppButton'
import MboleChat from './components/MboleChat'
import HeroSection from './components/HeroSection'
import StatsBar from './components/StatsBar'
import PricingSection from './components/PricingSection'
import ModuleShowcase from './components/ModuleShowcase'
import LibraryShowcase from './components/LibraryShowcase'
import TimesheetShowcase from './components/TimesheetShowcase'
import { WhyChooseSection, TestimonialsSection } from './components/WhyTestimonials'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LandingNav />
      <main>
        <HeroSection />
        <StatsBar />
        <ModuleShowcase />
        <LibraryShowcase />
        <TimesheetShowcase />
        <PricingSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <section className="bg-slate-50 py-16" id="video">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-[#1e3a8a] sm:text-3xl">See ASSMS in Action</h2>
            <p className="mt-2 text-slate-600">Book a demo to walk through admissions, finance, library, and more.</p>
            <div className="mt-8 aspect-video overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#1e3a8a] to-[#1a56db] shadow-xl">
              <div className="flex h-full items-center justify-center px-6 text-white/90">
                <p className="text-lg">Demo video placeholder — contact us to schedule a live walkthrough.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
      <WhatsAppButton />
      <MboleChat />
    </div>
  )
}
