export type AttendanceLocale = 'en' | 'fr'

const en: Record<string, string> = {
  moduleTitle: 'Attendance',
  moduleSubtitle: 'Clock in/out and review attendance performance.',
  clockIn: 'Clock In',
  clockOut: 'Clock Out',
  todayStatus: "Today's Status",
  monthlySummary: 'Monthly Summary',
  adminReport: 'Admin Report',
  myRecords: 'My Records',
  loading: 'Loading...',
  noRecords: 'No records found.',
}

const fr: Record<string, string> = {
  moduleTitle: 'Presence',
  moduleSubtitle: 'Pointage entree/sortie et suivi des presences.',
  clockIn: 'Pointer entree',
  clockOut: 'Pointer sortie',
  todayStatus: 'Statut du jour',
  monthlySummary: 'Resume mensuel',
  adminReport: 'Rapport admin',
  myRecords: 'Mes enregistrements',
  loading: 'Chargement...',
  noRecords: 'Aucun enregistrement.',
}

const dictionary: Record<AttendanceLocale, Record<string, string>> = { en, fr }

export function t(key: string, locale: AttendanceLocale = 'en'): string {
  return dictionary[locale]?.[key] ?? dictionary.en[key] ?? key
}
