import { Link } from 'react-router-dom'
import { ASSMS } from '../assmsConfig'
import { appVersionLabel } from '../../config/appMeta'

/** Compact OGERA-style credit bar — keep landing pages short. */
export default function LandingFooter() {
  return (
    <footer className="border-t border-[#c9a227]/40 bg-[#0f2744] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-3 text-center text-[11px] leading-relaxed text-white/85 sm:px-6 sm:text-xs">
        <span>© {new Date().getFullYear()} {ASSMS.shortName}. All rights reserved.</span>
        <span className="hidden text-[#c9a227]/70 sm:inline" aria-hidden="true">|</span>
        <span>Developed By: Alpha Bridge Technologies</span>
        <span className="hidden text-[#c9a227]/70 sm:inline" aria-hidden="true">|</span>
        <a href={`tel:${ASSMS.phone}`} className="hover:text-white">{ASSMS.phoneDisplay}</a>
        <span className="hidden text-[#c9a227]/70 sm:inline" aria-hidden="true">|</span>
        <span className="font-semibold tracking-wide text-[#f0c14b]">{appVersionLabel().replace(' ', '_')}</span>
        <span className="hidden text-[#c9a227]/70 sm:inline" aria-hidden="true">|</span>
        <Link to="/admin" className="hover:text-white">Admin</Link>
      </div>
    </footer>
  )
}
