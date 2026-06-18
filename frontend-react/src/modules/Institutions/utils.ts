import type { Institution } from './types'
import { backendBaseUrl, publicFileUrl } from '../../utils/publicFileUrl'

export { backendBaseUrl, publicFileUrl }

type BrandingField = 'logo' | 'letterhead' | 'footer' | 'registrar_signature'

export function institutionFileUrl(institution: Partial<Institution>, field: BrandingField) {
  const urlField = `${field}_url` as keyof Institution
  const explicitUrl = institution[urlField]

  // Backend returns null _url when the file is missing on disk — don't fall back to stale paths.
  if (urlField in institution && (explicitUrl === null || explicitUrl === '')) {
    return null
  }

  if (typeof explicitUrl === 'string' && explicitUrl) return publicFileUrl(explicitUrl)

  const directPath = institution[field]
  if (typeof directPath === 'string' && directPath) return publicFileUrl(directPath)

  const legacyPathField = `${field}_path` as keyof Institution
  const legacyPath = institution[legacyPathField]
  if (typeof legacyPath === 'string' && legacyPath) return publicFileUrl(legacyPath)

  return null
}
