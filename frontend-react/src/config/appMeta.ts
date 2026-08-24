/** Application metadata shown in UI (login footer, about, etc.). */
export const APP_VERSION =
  (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || '2.1.0'

export const APP_NAME = 'ASSMS'

export const APP_DEVELOPER = 'Alpha Bridge Technologies'

export const APP_CONTACT_PHONE = '+250 794 006 160'

export const APP_COPYRIGHT_YEAR = new Date().getFullYear()

/** e.g. ASSMS V2.1.0 */
export function appVersionLabel() {
  return `${APP_NAME} V${APP_VERSION}`
}

/** Compact bar: © year ASSMS. | Developed By: Alpha Bridge Technologies | phone | ASSMS_Vx.y.z */
export function appCompactCreditLine() {
  return `© ${APP_COPYRIGHT_YEAR} ${APP_NAME}. All rights reserved. | Developed By: ${APP_DEVELOPER} | ${APP_CONTACT_PHONE} | ${APP_NAME}_V${APP_VERSION}`
}

export function appDevelopedByLabel() {
  return `Developed By | ${APP_DEVELOPER}`
}

export function appCopyrightLabel() {
  return `Copyright ${APP_COPYRIGHT_YEAR}`
}
