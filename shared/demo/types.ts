// Canonical demo types shared by the demo server (client/server.ts) and, in
// adapted form, by both frontends. These mirror the shape a future FastAPI
// backend would return.

export type DomainId =
  | 'SAFETY'
  | 'ENVIRONMENT'
  | 'PRODUCTION'
  | 'LABOUR'
  | 'CONTRACTOR'
  | 'GRIEVANCE'
  | 'ANOMALY';

export type TaskStatus =
  | 'IN_PROGRESS'
  | 'DUE_SOON'
  | 'AWAITING_VERIFICATION'
  | 'REJECTED'
  | 'VERIFIED'
  | 'OVERDUE'
  | 'ESCALATED';

export type UrgencyGroup = 'OVERDUE' | 'DUE_SOON' | 'AWAITING_VERIFICATION' | 'RECENTLY_CLOSED';

// Where an alert originates. Grounded in the real Indian mining ecosystem:
// - DGMS   → Directorate General of Mines Safety portal (numbered Safety
//            Alerts + Technical Circulars; legal basis CMR 2017 / MMR 1961)
// - CSIS   → CIL Safety Information System (centralized safety-parameter feed)
// - SENSOR → mine telemetry: slope-stability radar, CH4/gas, strata extensometers
// - CMSMS  → Coal Mine Surveillance & Management System (satellite monitoring)
// - EC     → Environmental Clearance conditions / State Pollution Control Board
// - AUDIT  → DGMS audit findings, Safety Committee minutes, JCC grievance logs
export type AlertSourceKey = 'DGMS' | 'CSIS' | 'SENSOR' | 'CMSMS' | 'EC' | 'AUDIT' | 'GRIEVANCE';

export type AlertStatus = 'received' | 'processed' | 'confirmed';

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
}

export interface UserRef {
  id: string;
  name: string;
  role: string;
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
  observationCategory?: string;
  createdAt: string;
  deadline: string;
  closedAt?: string;
  submittedAt?: string;
  verifiedAt?: string;
  escalationEvents: EscalationEvent[];
  closureCertificate?: ClosureCertificate;
}

export interface MineSite {
  id: string;
  name: string;
  subsidiary: string;
  area?: string;
  district: string;
  lat: number;
  lng: number;
  type?: string;
  hasHEMM?: boolean;
  workforce?: number;
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
  status?: AlertStatus;
  source?: AlertSourceKey;
  domain?: DomainId;
  /** Display string shown in the inbox (e.g. "Ack in 48h"). */
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
  /** Styled HTML replica — fallback when no real PDF is available. */
  pdfReplicaSvg?: string;
}

export interface AuditEvent {
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  detail?: string;
}

// One actionable incoming alert with its own pipeline progress. Multiple alerts
// (DGMS, CSIS, sensor, satellite, EC…) can sit in different lifecycle stages
// at the same time — this is what the Alert Intake inbox renders.
export interface AlertPipeline {
  alert: Alert;
  extraction: unknown | null;
  recurrence: unknown | null;
  fanout: unknown | null;
}

export interface PipelineState {
  alerts: AlertPipeline[];
}

export interface DemoState {
  sites: MineSite[];
  tasks: Task[];
  alerts: Alert[];
  notifications: unknown[];
  pipeline: PipelineState;
  audit: AuditEvent[];
  updatedAt: string;
}