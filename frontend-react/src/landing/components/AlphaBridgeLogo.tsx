import { ASSMS } from '../assmsConfig'

const LOGO_SRC = '/alpha-bridge-logo.png'

export default function AlphaBridgeLogo({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={LOGO_SRC}
        alt="Alpha Bridge Technologies"
        className="h-12 w-auto object-contain"
      />
      {!compact && (
        <div className="leading-tight">
          <p className="text-xs font-bold uppercase tracking-wide text-white">
            <span className="text-white">Alpha</span>
            <span className="text-cyan-300">.Bridge</span>
          </p>
          <p className="text-[10px] text-white/70">Technologies Ltd</p>
        </div>
      )}
    </div>
  )
}

export function AssmsLogoMark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={LOGO_SRC}
        alt="Alpha Bridge Technologies"
        className="h-11 w-auto shrink-0 object-contain"
      />
      <p className="max-w-[10.5rem] text-sm font-bold leading-snug text-[#1e3a8a] sm:max-w-none sm:text-base lg:text-[15px]">
        {ASSMS.name}
      </p>
    </div>
  )
}

export function landingCopyright() {
  return `© ${new Date().getFullYear()} ${ASSMS.name}. Developed and Maintained by ${ASSMS.developer}`
}
