// Thin browser client for the deterministic demo API exposed by client/server.ts.
//
// This is the seam a future FastAPI backend replaces: every function here maps
// 1:1 to a future REST endpoint. Nothing here talks to a real backend today —
// the demo server serves hardcoded JSON with in-memory transitions.
import type {
  ClosureCertificate,
  EvidenceItem as DemoEvidence,
  Task as DemoTask,
} from '../../../shared/demo/types';
import type {
  Alert,
  Domain,
  EscalationEvent,
  EvidenceItem,
  GovernanceObject,
  GovStatus,
  UserRef,
} from '../types';

const BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Demo API error ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
}

export interface DemoAlertPipeline {
  alert: Alert;
  extraction: unknown | null;
  recurrence: unknown | null;
  fanout: unknown | null;
}

export interface DemoPipeline {
  alerts: DemoAlertPipeline[];
}

export interface DemoStateResponse {
  sites: Array<Record<string, unknown>>;
  tasks: DemoTask[];
  alerts: Alert[];
  notifications: unknown[];
  pipeline: DemoPipeline;
  audit: Array<Record<string, unknown>>;
  updatedAt: string;
}

export const demoApi = {
  getState: () => request<DemoStateResponse>('/api/demo/state'),
  reset: () => request<DemoStateResponse>('/api/demo/reset', { method: 'POST' }),
  processAlert: (alertId?: string) =>
    request<DemoStateResponse>('/api/demo/alert/process', {
      method: 'POST',
      body: JSON.stringify({ alertId }),
    }),
  confirmExtraction: (alertId?: string) =>
    request<{ state: DemoStateResponse; createdTasks: DemoTask[]; fanout: unknown }>(
      '/api/demo/alert/confirm',
      { method: 'POST', body: JSON.stringify({ alertId }) },
    ),
  saveDraft: (taskId: string, evidenceItems: DemoEvidence[], remediationNotes: string) =>
    request<DemoStateResponse>(`/api/demo/tasks/${taskId}/draft`, {
      method: 'POST',
      body: JSON.stringify({ evidenceItems, remediationNotes }),
    }),
  submitEvidence: (taskId: string, evidenceItems: DemoEvidence[], remediationNotes: string) =>
    request<DemoStateResponse>(`/api/demo/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ evidenceItems, remediationNotes }),
    }),
  rejectEvidence: (taskId: string, evidenceId: string, reason: string) =>
    request<DemoStateResponse>(`/api/demo/tasks/${taskId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ evidenceId, reason }),
    }),
  resubmit: (taskId: string) =>
    request<DemoStateResponse>(`/api/demo/tasks/${taskId}/resubmit`, { method: 'POST' }),
  approve: (taskId: string) =>
    request<DemoStateResponse>(`/api/demo/tasks/${taskId}/approve`, { method: 'POST' }),
};

// ---------------------------------------------------------------------------
// Mapping: canonical demo Task → client GovernanceObject
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, GovStatus> = {
  IN_PROGRESS: 'In Progress',
  DUE_SOON: 'In Progress',
  AWAITING_VERIFICATION: 'Submitted',
  REJECTED: 'Rejected',
  VERIFIED: 'Closed',
  OVERDUE: 'Overdue',
  ESCALATED: 'Escalated',
};

const EVIDENCE_STATUS_MAP: Record<string, EvidenceItem['status']> = {
  pending: 'Missing',
  missing: 'Missing',
  uploaded: 'Present',
  verified: 'Present',
  rejected: 'Flagged',
};

const DOMAIN_MAP: Record<string, Domain> = {
  SAFETY: 'Safety',
  ENVIRONMENT: 'Environment',
  PRODUCTION: 'Production',
  LABOUR: 'Labour',
  CONTRACTOR: 'Contractor',
  GRIEVANCE: 'Grievance',
  ANOMALY: 'Safety',
};

// Seed timestamps are display strings like "2026-08-27 15:10 IST". Browsers
// (V8) treat `new Date("... 15:10 IST")` as Invalid Date, which crashed the
// governance modal's date formatting. Strip the trailing timezone token so the
// value parses as local time (the modal renders it back as local time, so the
// display is unchanged).
function normalizeTimestamp(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value.replace(/\s+[A-Za-z]{2,5}$/, ''));
  return isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

export function mapEvidence(item: DemoEvidence): EvidenceItem {
  return {
    id: item.id,
    title: item.title,
    status: EVIDENCE_STATUS_MAP[item.status] || 'Missing',
    timestamp: normalizeTimestamp(item.metadata?.timestamp),
    geoTag: item.metadata?.gps,
    rejectionReason: item.rejectionReason,
  };
}

export function mapTaskToGovObject(task: DemoTask): GovernanceObject {
  const owner: UserRef = { name: task.owner.name, role: task.owner.role };
  const verifier: UserRef = { name: task.verifier.name, role: task.verifier.role };
  const escalations: EscalationEvent[] = task.escalationEvents
    .filter((ev) => ev.timestamp)
    .map((ev) => ({
      timestamp: ev.timestamp as string,
      level: ev.level,
      notified: ev.notified,
    }));
  let closure_certificate: ClosureCertificate | undefined;
  if (task.closureCertificate) {
    const c = task.closureCertificate;
    closure_certificate = {
      taskId: c.taskId,
      source: c.source,
      ownerName: c.ownerName,
      ownerRole: c.ownerRole,
      verifierName: c.verifierName,
      verifierRole: c.verifierRole,
      created: c.created,
      submitted: c.submitted,
      verified: c.verified,
      evidenceCount: c.evidenceCount,
      evidenceHashes: c.evidenceHashes,
      hash: c.hash,
      auditHash: c.auditHash,
      closedAt: c.closedAt,
    };
  }
  return {
    id: task.id,
    domain: DOMAIN_MAP[task.domain] || 'Safety',
    title: task.title,
    source: task.source || task.sourceCitation,
    severity: (task.severity as GovernanceObject['severity']) || 'Medium',
    mineId: task.mineId,
    owner,
    deadline: task.deadline,
    status: STATUS_MAP[task.status] || 'In Progress',
    evidence_checklist: task.evidenceItems.map(mapEvidence),
    verifier,
    escalation_level:
      task.escalationLevel === 'ESCALATED_L2'
        ? 'L2'
        : task.escalationLevel === 'ESCALATED_L1'
          ? 'L1'
          : undefined,
    created_at: task.createdAt,
    closed_at: task.closedAt,
    escalations,
    closure_certificate,
  };
}