export interface Applicant {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  nationality: string;
  id_number?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  is_international: boolean;
  passport_path?: string | null;
  transcript_path?: string | null;
  passport_url?: string | null;
  transcript_url?: string | null;
}

export interface Programme {
  id: number;
  name: string;
  code: string;
  level: string;
  duration_years: number;
  tuition_fee: number;
}

export interface AcademicYear {
  id: number;
  name: string;
  code: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'registry_reviewed'
  | 'department_approved'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'admitted'
  | 'accepted'
  | 'tuition_paid'
  | 'enrolled';

export interface Application {
  id: number;
  application_number: string;
  status: ApplicationStatus;
  application_fee: number;
  application_fee_paid: boolean;
  fee_paid_at?: string;
  tuition_fee?: number;
  tuition_fee_paid?: boolean;
  admission_letter_sent: boolean;
  admission_accepted: boolean;
  rejection_reason?: string;
  admission_comment?: string;
  applicant: Applicant;
  programme: Programme;
  academic_year: AcademicYear;
  reviewed_at?: string;
  approved_at?: string;
  admitted_at?: string;
  registry_reviewed_at?: string;
  department_reviewed_at?: string;
  admission_accepted_at?: string;
  tuition_verified_at?: string;
  department_review_comment?: string;
  created_at: string;
}

export interface Payment {
  id: number;
  reference_number: string;
  transaction_id?: string;
  payment_type: string;
  payment_method: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paid_at?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}
