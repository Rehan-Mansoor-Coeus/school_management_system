import { Link, Outlet } from 'react-router-dom'
import LandingNav from './components/LandingNav'
import LandingFooter from './components/LandingFooter'
import WhatsAppButton from './components/WhatsAppButton'
import MboleChat from './components/MboleChat'

export default function LandingShell() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LandingNav />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Outlet />
      </main>
      <LandingFooter />
      <WhatsAppButton />
      <MboleChat />
    </div>
  )
}

export function LandingPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <Link to="/" className="text-sm font-medium text-[#1a56db] hover:underline">← Back to home</Link>
      <h1 className="mt-3 text-3xl font-bold text-[#1e3a8a]">{title}</h1>
      {subtitle ? <p className="mt-2 text-slate-600">{subtitle}</p> : null}
    </div>
  )
}
