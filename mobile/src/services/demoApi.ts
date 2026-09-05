// Thin browser client for the deterministic demo API exposed by client/server.ts.
//
// This is the seam a future FastAPI backend replaces. The mobile app runs at
// /mobile on the same origin as the desktop app, so both frontends read and
// mutate the exact same in-memory demo state — that is what keeps the demo
// story synchronized between the two UIs.
import type {
  Task as DemoTask,
  EvidenceItem as DemoEvidence,
} from '../../../shared/demo/types';
import type { Task, EvidenceItem } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Demo API error ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
}

export interface DemoStateResponse {
  tasks: DemoTask[];
  sites: Array<Record<string, unknown>>;
  alerts: unknown[];
  notifications: unknown[];
  pipeline: unknown;
  audit: unknown[];
  updatedAt: string;
}

export const demoApi = {
  getState: () => request<DemoStateResponse>('/api/demo/state'),
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
};

// ---------------------------------------------------------------------------
// Mapping: canonical demo Task → mobile Task (display strings, mobile statuses)
// ---------------------------------------------------------------------------

function mapEvidence(item: DemoEvidence): EvidenceItem {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status === 'missing' ? 'pending' : item.status,
    guidance: item.guidance,
    photoUrl: item.photoUrl,
    fileName: item.fileName,
    metadata: item.metadata,
    aiWarning: item.aiWarning,
  };
}

export function mapTaskToMobile(task: DemoTask): Task {
  return {
    id: task.id,
    title: task.title,
    shortTitle: task.shortTitle,
    domain: task.domain,
    status: task.status,
    urgencyGroup: task.urgencyGroup,
    deadlineDate: task.deadlineDate,
    deadlineDisplay: task.deadlineDisplay,
    shiftInfo: task.shiftInfo,
    hoursRemaining: task.hoursRemaining,
    sourceCitation: task.sourceCitation,
    owner: task.ownerLabel,
    verifier: task.verifierLabel,
    escalationRule: task.escalationRule,
    escalationLevel: task.escalationLevel,
    escalationTarget: task.escalationTarget,
    rejectionReason: task.rejectionReason,
    submittedTimestamp: task.submittedTimestamp,
    closedDate: task.closedDate,
    isCriticalDoThisNext: task.isCriticalDoThisNext,
    evidenceItems: task.evidenceItems.map(mapEvidence),
    remediationNotes: task.remediationNotes,
    observationCategory: task.observationCategory,
  };
}