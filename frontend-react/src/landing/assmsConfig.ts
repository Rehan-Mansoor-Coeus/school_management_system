export const ASSMS = {
  name: 'African Students School Management System',
  shortName: 'ASSMS',
  developer: 'Alpha Bridge Technologies Ltd',
  website: 'https://alpha-bridge.net',
  email: 'info@alpha-bridge.net',
  phone: '+250794006160',
  phoneDisplay: '+250 794 006 160',
  whatsapp: '250794006160',
}

export const WHATSAPP_URL = `https://wa.me/${ASSMS.whatsapp}`

export const LANDING_NAV_LINKS = [
  { to: '/#modules', label: 'Modules' },
  { to: '/schools', label: 'Institutions' },
  { to: '/register', label: 'Register' },
  { to: '/request-institution', label: 'For Institutions' },
  { to: '/contact', label: 'Contact' },
] as const

export const LANDING_THEME = {
  blue: '#1a56db',
  blueDark: '#1e3a8a',
  navy: '#0f2744',
  orange: '#f97316',
  orangeDark: '#ea580c',
  gold: '#f0c14b',
  sky: '#eff6ff',
}

export const LANDING_STATS = [
  { value: '100+', label: 'Institutions' },
  { value: '50K+', label: 'Students' },
  { value: '1M+', label: 'Transactions' },
  { value: '99.9%', label: 'System Uptime' },
  { value: '24/7', label: 'Support' },
]
