export type InstitutionType = 'university' | 'college' | 'school' | 'vocational' | 'technical' | 'training'

export type Institution = {
  id: number
  name: string
  code: string
  type: InstitutionType
  logo?: string | null
  letterhead?: string | null
  registrar_signature?: string | null
  official_stamp?: string | null
  logo_path?: string | null
  letterhead_path?: string | null
  registrar_signature_path?: string | null
  logo_url?: string | null
  letterhead_url?: string | null
  registrar_signature_url?: string | null
  official_stamp_url?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  website?: string | null
  currency?: string | null
  timezone?: string | null
  language?: 'en' | 'fr'
  is_active: boolean
  subscription_plan?: string | null
  settings?: InstitutionSettings | null
  created_at?: string
  updated_at?: string
}

export type InstitutionSettings = {
  institution_id: number
  academic_structure?: any
  fee_structure?: any
  grading_system?: any
  academic_calendar?: any
  payment_settings?: any
}

export type PaginatedResponse<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

