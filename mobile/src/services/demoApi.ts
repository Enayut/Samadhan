// Thin browser client for the deterministic demo API exposed by client/server.ts.
//
// Both frontends hit the SAME routes on the same origin, so the desktop and the
// mobile app read and mutate the exact same in-memory demo state — that is what
// keeps the demo story synchronized (publish → field evidence → verification).
// NOTE: routes are /api/tasks/:id/... (NOT /api/demo/...) — the demo server has
// no /api/demo prefix, and a wrong prefix silently breaks evidence persistence.
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
  // Mobile-scoped state: only the Piparwar official's tasks (mine-scoped,
  // PROPOSED excluded server-side). Falls back to the full state endpoint.
  getState: async (): Promise<DemoStateResponse> => {
    try {
      const res = await request<{ mine: Record<string, unknown> | null; user: Record<string, unknown> | null; tasks: DemoTask[]; updatedAt: string }>(
        '/api/mobile/state',
      );
      return {
        tasks: res.tasks,
        sites: res.mine ? [res.mine] : [],
        alerts: [],
        notifications: [],
        pipeline: { documents: [] },
        audit: [],
        updatedAt: res.updatedAt,
      };
    } catch {
      return request<DemoStateResponse>('/api/state');
    }
  },
  startTask: (taskId: string) =>
    request<DemoStateResponse>(`/api/tasks/${taskId}/start`, { method: 'POST' }),
  saveDraft: (taskId: string, evidenceItems: DemoEvidence[], remediationNotes: string, formValues?: Record<string, string>) =>
    request<DemoStateResponse>(`/api/tasks/${taskId}/draft`, {
      method: 'POST',
      body: JSON.stringify({ evidenceItems, remediationNotes, formValues }),
    }),
  submitEvidence: (taskId: string, evidenceItems: DemoEvidence[], remediationNotes: string, formValues?: Record<string, string>) =>
    request<DemoStateResponse>(`/api/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ evidenceItems, remediationNotes, formValues }),
    }),
  // Correction loop: REJECTED → resubmit (server clears the rejection reason and
  // moves the task back to AWAITING_VERIFICATION).
  resubmitEvidence: (taskId: string, evidenceItems: DemoEvidence[], remediationNotes: string, formValues?: Record<string, string>) =>
    request<DemoStateResponse>(`/api/tasks/${taskId}/resubmit`, {
      method: 'POST',
      body: JSON.stringify({ evidenceItems, remediationNotes, formValues }),
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
    rejectionReason: item.rejectionReason,
    gpsHint: item.gpsHint,
  };
}

export function mapTaskToMobile(task: DemoTask): Task {
  const status = (['PROPOSED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'VERIFIED', 'REJECTED', 'OVERDUE', 'ESCALATED'] as const).includes(
    task.status as never,
  )
    ? (task.status as Task['status'])
    : 'IN_PROGRESS';
  return {
    id: task.id,
    title: task.title,
    shortTitle: task.shortTitle,
    domain: task.domain,
    status,
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
    observationCategory: task.observationCategory,
    submissionCount: task.submissionCount,
    evidenceItems: task.evidenceItems.map(mapEvidence),
    remediationNotes: task.remediationNotes,
    form: task.form,
    formValues: task.formValues,
  };
}
