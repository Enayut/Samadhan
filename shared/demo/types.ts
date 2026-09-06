// Canonical demo types shared by the demo server (client/server.ts) and, in
// adapted form, by both frontends. These mirror the shape the FastAPI backend
// (backend/app) returns.

export type DomainId =
  | 'SAFETY'
  | 'ENVIRONMENT'
  | 'PRODUCTION'
  | 'LABOUR'
  | 'CONTRACTOR'
  | 'GRIEVANCE';

export type TaskStatus =
  | 'PROPOSED' // rule-derived, awaiting manager review/publish — never visible on mobile
  | 'ASSIGNED' // published to the owning official
  | 'IN_PROGRESS'
  | 'AWAITING_VERIFICATION'
  | 'REJECTED'
  | 'VERIFIED'
  | 'OVERDUE'
  | 'ESCALATED';

export type UrgencyGroup = 'OVERDUE' | 'DUE_SOON' | 'AWAITING_VERIFICATION' | 'RECENTLY_CLOSED';

// Where a compliance document originates.
// - DGMS   → Directorate General of Mines Safety (technical circulars/alerts)
// - EC     → Environmental Clearance conditions / SPCB
// - CSIS   → CIL Safety Information System feed
// - SENSOR → mine instrumentation telemetry
// - AUDIT  → audit/registry feeds (e.g. contractor licence expiry window)
export type AlertSourceKey = 'DGMS' | 'CSIS' | 'SENSOR' | 'EC' | 'AUDIT';

export type DocumentStatus = 'received' | 'processed' | 'determined';

export type EvidenceStatus = 'pending' | 'uploaded' | 'verified' | 'rejected' | 'missing';
export type EvidenceType = 'photo' | 'document' | 'register';

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
  type: EvidenceType;
  status: EvidenceStatus;
  guidance: string;
  artifactId?: string;
  photoUrl?: string;
  fileName?: string;
  metadata?: EvidenceMetadata;
  aiWarning?: string;
  rejectionReason?: string;
  optional?: boolean;
  gpsHint?: string;
}

export interface UserRef {
  id: string;
  name: string;
  role: string;
}

/** Deterministic digital-form spec rendered on mobile before evidence capture. */
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

export interface EscalationEvent {
  level: string;
  notified: string;
  timestampOffsetDays: number;
  timestamp?: string;
}

export interface ClosureCertificate {
  taskId: string;
  source: string;
  ownerName: string;
  ownerRole: string;
  verifierName: string;
  verifierRole: string;
  created: string;
  submitted: string;
  verified: string;
  evidenceCount: number;
  evidenceHashes: string[];
  hash: string;
  auditHash: string;
  closedAt: string;
}

export interface Task {
  id: string;
  title: string;
  shortTitle?: string;
  domain: DomainId;
  obligationRef?: string;
  sourceRef?: string;
  status: TaskStatus;
  urgencyGroup: UrgencyGroup;
  deadlineDate: string;
  deadlineDisplay: string;
  shiftInfo: string;
  hoursRemaining: number;
  sourceCitation: string;
  source: string;
  severity: string;
  mineId: string;
  owner: UserRef;
  verifier: UserRef;
  ownerLabel: string;
  verifierLabel: string;
  escalationRule?: string;
  escalationLevel?: 'ESCALATED_L1' | 'ESCALATED_L2';
  escalationTarget?: string;
  rejectionReason?: string;
  submittedTimestamp?: string;
  closedDate?: string;
  isCriticalDoThisNext?: boolean;
  evidenceItems: EvidenceItem[];
  remediationNotes: string;
  form?: FormSpec;
  formValues?: Record<string, string>;
  observationCategory?: string;
  createdAt: string;
  publishedAt?: string;
  deadline: string;
  closedAt?: string;
  submittedAt?: string;
  verifiedAt?: string;
  escalationEvents: EscalationEvent[];
  closureCertificate?: ClosureCertificate;
  /** Deterministic provenance of the task: rules, not AI. */
  generatedBy?: 'RULE_DERIVED' | 'MANUAL';
  recurring?: boolean;
  cadence?: 'WEEKLY' | 'MONTHLY' | null;
  periodLabel?: string;
  submissionCount?: number;
}

export interface MineSite {
  id: string;
  name: string;
  fullName?: string;
  subsidiary: string;
  area?: string;
  district: string;
  state?: string;
  lat: number;
  lng: number;
  type?: string;
  hasHEMM?: boolean;
  maxHighwallMeters?: number | null;
  workforce?: number;
  gisAnchor?: boolean;
  riskLevel?: string;
}

export interface Alert {
  id: string;
  kind?: string;
  ref?: string;
  alertNo?: string;
  title?: string;
  issued?: string;
  severity?: string;
  timestamp?: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  siteId?: string;
  status?: DocumentStatus;
  source?: AlertSourceKey;
  domain?: DomainId;
  /** Display string shown in the inbox (e.g. "Review in 48h"). */
  ackDeadline?: string;
  /** Seed offset in days from `now`; the store derives `ackDeadlineDate` from it. */
  ackDeadlineOffsetDays?: number;
  /** ISO date computed by the store — used by the calendar page. */
  ackDeadlineDate?: string;
  summary?: string;
  paragraphs?: string[];
  /** Real source document (DGMS PDF etc.) served from client/public — rendered in the viewer. */
  pdfUrl?: string;
  /** Provenance caption shown with the real PDF (source + date). */
  pdfSource?: string;
  /** Source classification of the underlying document (REAL OFFICIAL / REAL PUBLIC / SYNTHETIC). */
  realSourceClass?: string;
  realSourceTitle?: string;
  pdfReplicaSvg?: string;
}

export interface AuditEvent {
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  detail?: string;
}

// One actionable incoming compliance document with its own pipeline progress.
export interface DocumentPipeline {
  alert: Alert;
  extraction: unknown | null;
  recurrence: unknown | null;
  applicability: unknown | null;
}

export interface PipelineState {
  documents: DocumentPipeline[];
}

/** Deterministic rule registry entry (shared shape with obligations.json). */
export interface ObligationRule {
  id: string;
  title: string;
  shortTitle?: string;
  domain: DomainId;
  originRef: string;
  applicability: {
    mineType?: string;
    minHighwallMeters?: number;
    mineIds?: string[];
    condition?: string;
    description: string;
  };
  ownerRole: string;
  verifierRole: string;
  cadence: { kind: 'WEEKLY' | 'MONTHLY'; anchor: string; shift: string } | null;
  deadlinePolicy: { kind: string; weekday?: string; days?: number; leadDays?: number; shift: string };
  escalationRule: string;
  evidenceChecklist: Array<{ id: string; title: string; type: EvidenceType; guidance: string; gps?: string }>;
  statutoryBasis: string;
}

/** Mobile-scoped state: only the Piparwar official's visible tasks. */
export interface MobileState {
  mine: MineSite | null;
  user: UserRef | null;
  tasks: Task[];
  updatedAt: string;
}

export interface DemoState {
  sites: MineSite[];
  tasks: Task[];
  alerts: Alert[];
  rules: ObligationRule[];
  notifications: unknown[];
  pipeline: PipelineState;
  audit: AuditEvent[];
  updatedAt: string;
}
