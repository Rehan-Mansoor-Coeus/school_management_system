import { useMemo } from 'react'
import { useTimesheetI18n } from './useTimesheetI18n'
import { t as translate, type CharacterCertLocale } from '../i18n/characterCertificates'

export function useCharacterCertificatesI18n() {
  const { locale, setAppLocale } = useTimesheetI18n()

  return useMemo(
    () => ({
      locale: locale as CharacterCertLocale,
      setAppLocale,
      t: (key: string) => translate(key, locale as CharacterCertLocale),
    }),
    [locale, setAppLocale],
  )
}
