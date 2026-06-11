import { Link } from 'react-router-dom'
import { ASSMS, LANDING_NAV_LINKS } from '../assmsConfig'
import AlphaBridgeLogo, { landingCopyright } from './AlphaBridgeLogo'

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#0f2744] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-2">
          <AlphaBridgeLogo />
          <p className="max-w-md text-sm leading-relaxed text-white/75">
            <strong className="text-white">{ASSMS.name}</strong> — a complete multi-institution platform
            for admissions, finance, library, timesheets, letters, and more across modern campuses.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#f0c14b]">Quick Links</h3>
          <ul className="space-y-2 text-sm text-white/80">
            {LANDING_NAV_LINKS.map((link) => (
              <li key={link.to}>
                <a href={link.to} className="hover:text-white">{link.label}</a>
              </li>
            ))}
            <li><Link to="/admin" className="hover:text-white">Admin Portal</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#f0c14b]">Contact</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li><a href={`mailto:${ASSMS.email}`} className="hover:text-white">{ASSMS.email}</a></li>
            <li><a href={`tel:${ASSMS.phone}`} className="hover:text-white">{ASSMS.phoneDisplay}</a></li>
            <li><a href={ASSMS.website} target="_blank" rel="noreferrer" className="hover:text-white">{ASSMS.website.replace('https://', '')}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/60 sm:px-6">
        {landingCopyright()}
      </div>
    </footer>
  )
}
