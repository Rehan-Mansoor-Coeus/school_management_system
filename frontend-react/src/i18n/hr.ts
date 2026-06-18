export type HrLocale = 'en' | 'fr'

const en: Record<string, string> = {
  moduleTitle: 'HR & Payroll',
  moduleSubtitle: 'Manage staff, payroll runs, approvals, and finance workflow.',
  overview: 'Overview',
  staff: 'Staff',
  categories: 'Categories',
  jobs: 'Jobs',
  monthlyPayroll: 'Monthly Payroll',
  allowances: 'Allowances',
  deductions: 'Deductions',
  advances: 'Advances',
  payslips: 'Payslips',
  approvals: 'Approvals',
  finance: 'Finance',
  reports: 'Reports',
  letters: 'Letters',
  loading: 'Loading...',
  noRecords: 'No records found.',
  actions: 'Actions',
  add: 'Add',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  search: 'Search',
  status: 'Status',
  amount: 'Amount',
  date: 'Date',
}

const fr: Record<string, string> = {
  moduleTitle: 'RH & Paie',
  moduleSubtitle: 'Gerez le personnel, les paies, les validations et les paiements.',
  overview: 'Apercu',
  staff: 'Personnel',
  categories: 'Categories',
  jobs: 'Missions',
  monthlyPayroll: 'Paie mensuelle',
  allowances: 'Indemnites',
  deductions: 'Retenues',
  advances: 'Avances',
  payslips: 'Bulletins',
  approvals: 'Validations',
  finance: 'Finance',
  reports: 'Rapports',
  letters: 'Lettres',
  loading: 'Chargement...',
  noRecords: 'Aucun enregistrement.',
  actions: 'Actions',
  add: 'Ajouter',
  edit: 'Modifier',
  delete: 'Supprimer',
  save: 'Enregistrer',
  cancel: 'Annuler',
  search: 'Rechercher',
  status: 'Statut',
  amount: 'Montant',
  date: 'Date',
}

const dictionary: Record<HrLocale, Record<string, string>> = { en, fr }

export function t(key: string, locale: HrLocale = 'en'): string {
  return dictionary[locale]?.[key] ?? dictionary.en[key] ?? key
}
