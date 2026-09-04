export type UserRole = 'Mine Manager' | 'Mine Safety Officer' | 'Mine Engineer' | 'Area Safety Officer' | 'Corporate Management' | 'Regulatory Authority';
export type Subsidiary = 'SECL' | 'WCL' | 'ECL' | 'BCCL' | 'CCL' | 'NCL' | 'MCL' | 'NEC';

export interface MineSite {
  id: string;
  name: string;
  subsidiary: Subsidiary;
  district: string;
  lat: number;
  lng: number;
}

export type Domain = 'Safety' | 'Environment' | 'Production' | 'Labour' | 'Contractor' | 'Grievance';
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export type GovStatus = 'Closed' | 'Submitted' | 'In Progress' | 'Overdue' | 'Escalated';

export interface UserRef {
  name: string;
  role: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  status: 'Missing' | 'Present' | 'Flagged';
  timestamp?: string;
  geoTag?: string;
  rejectionReason?: string;
}

export interface EscalationEvent {
  timestamp: string;
  level: string;
  notified: string;
}

export interface ClosureCertificate {
  closedAt: string;
  hash: string;
  ownerName: string;
  verifierName: string;
}

export interface GovernanceObject {
  id: string;
  domain: Domain;
  title: string;
  source: string;
  severity: Severity;
  mineId: string;
  owner: UserRef;
  deadline: string;
  status: GovStatus;
  evidence_checklist: EvidenceItem[];
  verifier: UserRef;
  escalation_level?: string; // 'L1', 'L2'
  created_at: string;
  closed_at?: string;
  escalations: EscalationEvent[];
  closure_certificate?: ClosureCertificate;
}

export interface Alert {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  siteId?: string;
}
