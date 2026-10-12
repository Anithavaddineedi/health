export interface Profile {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string;
  blood_group: string;
  phone: string;
  abha_id: string;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_url: string | null;
  storage_path?: string | null;
  status: string;
  ocr_text: string;
  document_type: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  user_id: string;
  document_id: string | null;
  record_type: string;
  fhir_resource_type: string;
  code: string;
  display_name: string;
  value: string;
  unit: string;
  reference_range: string;
  status: string;
  is_abnormal: boolean;
  notes: string;
  record_date: string | null;
  created_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  prescribed_for: string;
  notes: string;
  created_at: string;
}

export interface HealthSummary {
  id: string;
  user_id: string;
  document_id: string | null;
  summary_english: string;
  summary_telugu: string;
  abnormal_findings: Array<{
    test_name: string;
    value: string;
    reference_range: string;
    explanation: string;
  }>;
  key_findings: string[];
  recommendations: string[];
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  user_id: string;
  event_date: string;
  event_type: string;
  title: string;
  description: string;
  related_record_id: string | null;
  created_at: string;
}

export type Page =
  | 'dashboard'
  | 'upload'
  | 'records'
  | 'medications'
  | 'appointments'
  | 'healthtrends'
  | 'healthinsurance'
  | 'timeline'
  | 'profile'
  | 'summaries'
  | 'settings';
