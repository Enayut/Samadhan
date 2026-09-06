// Thin browser client for the demo API exposed by client/server.ts.
//
// The demo server is the seam a FastAPI backend replaces: every function here
// maps 1:1 to a REST endpoint that backend/app also implements. Desktop and
// mobile both read/mutate the same state through these routes — one source of
// truth for the demo.
import type {
  Alert,
  ClosureCertificate,
  DocumentPipeline,
  DomainId,
  EscalationEvent,
  EvidenceItem,
  MineSite,
  ObligationRule,
  Task,
} from '../../../shared/demo/types';

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

export interface DemoStateResponse {
  sites: MineSite[];
  tasks: Task[];
  alerts: Alert[];
  rules: ObligationRule[];
  notifications: unknown[];
  pipeline: { documents: DocumentPipeline[] };
  audit: Array<{ timestamp: string; actor: string; action: string; entity: string; detail?: string }>;
  updatedAt: string;
}

export interface RagResult {
  chunk_key: string;
  score: number;
  snippet: string;
  doc_id: string;
  title: string;
  source_class: string;
  origin: string;
  why_relevant: string;
  domain: string;
  concepts?: string[];
}

export interface RagSearchResponse {
  query: string;
  mode: string;
  embedding_backend: string;
  top_k: number;
  results: RagResult[];
  disclaimer: string;
  error?: string;
  detail?: string;
}

export const demoApi = {
  getState: () => request<DemoStateResponse>('/api/state'),
  reset: () => request<DemoStateResponse>('/api/reset', { method: 'POST' }),
  processDocument: (documentId: string) =>
    request<DemoStateResponse>(`/api/documents/${documentId}/process`, { method: 'POST' }),
  determineApplicability: (documentId: string) =>
    request<DemoStateResponse>(`/api/documents/${documentId}/determine`, { method: 'POST' }),
  publishTask: (taskId: string, adjustments?: Record<string, unknown>) =>
    request<DemoStateResponse>(`/api/tasks/${taskId}/publish`, {
      method: 'POST',
      body: JSON.stringify(adjustments ?? {}),
    }),
  createTask: (payload: {
    title: string;
    mineId: string;
    domain: DomainId;
    severity?: string;
    deadlineOffsetDays?: number;
    notes?: string;
  }) => request<{ state: DemoStateResponse; task: Task | null }>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  startTask: (taskId: string) =>
    request<DemoStateResponse>(`/api/tasks/${taskId}/start`, { method: 'POST' }),
  rejectEvidence: (taskId: string, evidenceId: string, reason: string) =>
    request<DemoStateResponse>(`/api/tasks/${taskId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ evidenceId, reason }),
    }),
  approve: (taskId: string) =>
    request<DemoStateResponse>(`/api/tasks/${taskId}/approve`, { method: 'POST' }),
  schedulerTick: () =>
    request<{ state: DemoStateResponse; created: Task[] }>('/api/scheduler/tick', { method: 'POST' }),
  ragSearch: (query: string, topK = 6, mineId?: string) => {
    const params = new URLSearchParams({ q: query, top_k: String(topK) });
    if (mineId) params.set('mine_id', mineId);
    return request<RagSearchResponse>(`/api/rag/search?${params.toString()}`);
  },
  ragStatus: () => request<Record<string, unknown>>('/api/rag/status'),
};

// ---------------------------------------------------------------------------
// Desktop view model — a light wrapper over the canonical Task. Kept so the
// existing components can use friendly names without diverging from shared
// state.
// ---------------------------------------------------------------------------

export const DOMAIN_LABEL: Record<string, string> = {
  SAFETY: 'Safety',
  ENVIRONMENT: 'Environment',
  PRODUCTION: 'Production',
  LABOUR: 'Labour',
  CONTRACTOR: 'Contractor',
  GRIEVANCE: 'Grievance',
};

export const STATUS_LABEL: Record<string, string> = {
  PROPOSED: 'Proposed',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  AWAITING_VERIFICATION: 'Awaiting Verification',
  REJECTED: 'Action Required',
  VERIFIED: 'Verified',
  OVERDUE: 'Overdue',
  ESCALATED: 'Escalated',
};

export const STATUS_COLOR: Record<string, string> = {
  PROPOSED: '#8A9098',
  ASSIGNED: '#4A7C9B',
  IN_PROGRESS: '#F2A93B',
  AWAITING_VERIFICATION: '#4A7C9B',
  REJECTED: '#A93226',
  VERIFIED: '#4C7A66',
  OVERDUE: '#C1502E',
  ESCALATED: '#C1502E',
};

export function evidenceStatusDesktop(ev: EvidenceItem): 'Missing' | 'Present' | 'Flagged' | 'Verified' {
  if (ev.status === 'uploaded') return 'Present';
  if (ev.status === 'verified') return 'Verified';
  if (ev.status === 'rejected') return 'Flagged';
  return 'Missing';
}

export function mapEvidence(item: EvidenceItem): EvidenceItem {
  return item;
}

export function mapTask(task: Task): Task {
  return task;
}

export function mapTaskEscalations(task: Task): EscalationEvent[] {
  return (task.escalationEvents ?? []).filter((ev) => ev.timestamp);
}

export function mapClosure(c: ClosureCertificate): ClosureCertificate {
  return c;
}
