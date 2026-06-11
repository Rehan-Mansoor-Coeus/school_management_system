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
  required_documents?: ProgrammeRequiredDocument[];
  admission_agreement?: AdmissionAgreement | null;
}

export interface ProgrammeRequiredDocument {
  id: number;
  name: string;
  description?: string | null;
  is_required: boolean;
  sort_order: number;
}

export interface AdmissionAgreement {
  id: number;
  institution_id?: number;
  programme_id?: number | null;
  title: string;
  content: string;
  is_required: boolean;
  is_active?: boolean;
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
  | 'enrolled'
  | 'cancelled';

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
  application_fee_proof_pending?: boolean;
  tuition_fee_proof_pending?: boolean;
  can_pay_application_fee?: boolean;
  can_accept_admission?: boolean;
  can_pay_tuition?: boolean;
  can_submit_tuition_proof?: boolean;
  can_cancel?: boolean;
  can_update?: boolean;
  latest_application_fee_payment?: ApplicationPaymentProof | null;
  latest_tuition_payment?: ApplicationPaymentProof | null;
  documents?: ApplicationDocument[];
  accepted_agreement_ids?: number[];
  applicant_signature_url?: string | null;
  progress?: ApplicationProgress;
}

export interface ApplicationDocument {
  id: number;
  document_name: string;
  comment?: string | null;
  programme_required_document_id?: number | null;
  is_required?: boolean | null;
  review_status?: 'pending' | 'approved' | 'rejected';
  review_comment?: string | null;
  reviewed_at?: string | null;
  reviewed_by_name?: string | null;
  file_path?: string;
  url?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
}

export interface ApplicationProgress {
  percent: number;
  current_step: string;
  status: string;
  steps: Array<{ key: string; label_key: string; state: 'pending' | 'current' | 'completed' | 'rejected' }>;
}

export interface ApplicationPaymentProof {
  id: number;
  application_id: number;
  reference_number: string;
  payment_type: string;
  amount: number;
  status: string;
  proof_url?: string | null;
  proof_notes?: string | null;
  review_notes?: string | null;
  created_at?: string;
  application?: Application;
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
