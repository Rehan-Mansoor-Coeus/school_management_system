export type TasksLocale = 'en' | 'fr'

const en: Record<string, string> = {
  moduleTitle: 'Task Manager',
  moduleSubtitle: 'Create, schedule, assign, and track institutional tasks.',
  dashboard: 'Dashboard',
  allTasks: 'All Tasks',
  create: 'Create',
  scheduled: 'Scheduled',
  settings: 'Settings',
  myTasks: 'My Tasks',
  pending: 'Pending',
  loading: 'Loading...',
  noRecords: 'No records found.',
  save: 'Save',
  cancel: 'Cancel',
  actions: 'Actions',
}

const fr: Record<string, string> = {
  moduleTitle: 'Gestion des taches',
  moduleSubtitle: 'Creez, planifiez, affectez et suivez les taches.',
  dashboard: 'Tableau de bord',
  allTasks: 'Toutes les taches',
  create: 'Creer',
  scheduled: 'Planifiees',
  settings: 'Parametres',
  myTasks: 'Mes taches',
  pending: 'En attente',
  loading: 'Chargement...',
  noRecords: 'Aucun enregistrement.',
  save: 'Enregistrer',
  cancel: 'Annuler',
  actions: 'Actions',
}

const dictionary: Record<TasksLocale, Record<string, string>> = { en, fr }

export function t(key: string, locale: TasksLocale = 'en'): string {
  return dictionary[locale]?.[key] ?? dictionary.en[key] ?? key
}
