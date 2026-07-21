/** Application metadata shown in UI (login footer, about, etc.). */
export const APP_VERSION =
  (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || '2.1.0'

export const APP_NAME = 'ASSMS'

export const APP_DEVELOPER = 'Alpha Bridge Technologies'

export const APP_COPYRIGHT_YEAR = new Date().getFullYear()

/** e.g. ASSMS V2.1.0 */
export function appVersionLabel() {
  return `${APP_NAME} V${APP_VERSION}`
}

export function appDevelopedByLabel() {
  return `Developed By | ${APP_DEVELOPER}`
}

export function appCopyrightLabel() {
  return `Copyright ${APP_COPYRIGHT_YEAR}`
}
