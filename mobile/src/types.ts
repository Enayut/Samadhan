export type DomainType =
  | 'SAFETY'
  | 'ENVIRONMENT'
  | 'PRODUCTION'
  | 'LABOUR'
  | 'CONTRACTOR'
  | 'GRIEVANCE'
  | 'ANOMALY';

export type TaskStatus =
  | 'OVERDUE'
  | 'DUE_SOON'
  | 'IN_PROGRESS'
  | 'AWAITING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ESCALATED';

export type UrgencyGroup =
  | 'OVERDUE'
  | 'DUE_SOON'
  | 'AWAITING_VERIFICATION'
  | 'RECENTLY_CLOSED';

export type SyncStatusType = 'synced' | 'pending' | 'offline';

export type ScreenId = 'M0' | 'M1' | 'M2' | 'M3' | 'PROFILE';

export type QueueFilter = 'ALL' | 'CRITICAL' | 'DUE_3D' | 'VERIFYING' | 'CLOSED';

export interface EvidenceMetadata {
  timestamp: string;
  gps: string;
  user: string;
  sha256: string;
  fileSize?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  type: 'photo' | 'document' | 'register';
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  guidance: string;
  photoUrl?: string;
  fileName?: string;
  metadata?: EvidenceMetadata;
  aiWarning?: string; // non-blocking amber chip
  rejectionReason?: string;
  gpsHint?: string; // demo GPS hint from the rule-derived evidence checklist
}

export interface FormFieldSpec {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  value?: string;
  placeholder?: string;
  hint?: string;
  options?: string[];
  readOnly?: boolean;
}

export interface FormSpec {
  formId: string;
  title: string;
  fields: FormFieldSpec[];
}

export interface Task {
  id: string;
  title: string;
  shortTitle?: string;
  domain: DomainType;
  status: TaskStatus;
  urgencyGroup: UrgencyGroup;
  deadlineDate: string;
  deadlineDisplay: string;
  shiftInfo: string;
  hoursRemaining: number; // negative if overdue
  sourceCitation: string;
  owner: string;
  verifier: string;
  escalationRule?: string;
  escalationLevel?: 'ESCALATED_L1' | 'ESCALATED_L2';
  escalationTarget?: string;
  rejectionReason?: string;
  submittedTimestamp?: string;
  closedDate?: string;
  isCriticalDoThisNext?: boolean;
  evidenceItems: EvidenceItem[];
  remediationNotes: string;
  observationCategory?: string;
  form?: FormSpec;
  formValues?: Record<string, string>;
  submissionCount?: number;
}

export type TaskStatusShared =
  | 'PROPOSED'
  | 'ASSIGNED'
  | TaskStatus
  | 'OVERDUE'
  | 'ESCALATED';

export interface ObservationReport {
  id: string;
  category: 'Safety Observation' | 'Environment Anomaly' | 'Labour Grievance' | 'Contractor Violation';
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  photoUrl?: string;
  gps: string;
  timestamp: string;
  mineLocation: string;
}
