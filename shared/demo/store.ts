// Deterministic in-memory demo store + state machine for the SAMAADHAN demo.
//
// Five mines, one operational area (North Karanpura, CCL, Jharkhand). Every
// mutation here is a pure, deterministic state transition over the JSON seed
// data. The demo server (client/server.ts) exposes these as /api/* endpoints;
// both frontends consume them through thin API clients. This module is also the
// reference implementation mirrored by the FastAPI backend (backend/app).
//
// IMPORTANT: this file runs in Node (the demo server). It must NOT be imported
// by browser code. Browser code goes through the API fetch wrappers instead.
//
// No randomness. No network. The same sequence of calls always produces the
// same result, so the recorded demo is reproducible from a fresh state.

import { createHash } from 'crypto';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISO(date: Date): string {
  return date.toISOString();
}

import minesData from '../data/mines.json';
import usersData from '../data/users.json';
import domainsData from '../data/domains.json';
import tasksData from '../data/tasks.json';
import evidenceData from '../data/evidence.json';
import alertsData from '../data/alerts.json';
import notificationsData from '../data/notifications.json';
import historyData from '../data/history.json';
import recurrenceData from '../data/recurrence.json';
import aiExtractionByAlertData from '../data/aiExtractionByAlert.json';
import applicabilityByDocData from '../data/applicabilityByDoc.json';
import obligationsData from '../data/obligations.json';

import type {
  Alert,
  AuditEvent,
  ClosureCertificate,
  DemoState,
  DocumentStatus,
  DomainId,
  EscalationEvent,
  EvidenceItem,
  EvidenceMetadata,
  EvidenceStatus,
  EvidenceType,
  MineSite,
  MobileState,
  ObligationRule,
  Task,
  TaskStatus,
  UrgencyGroup,
  UserRef,
} from './types';

// ---------------------------------------------------------------------------
// Raw JSON shapes
// ---------------------------------------------------------------------------

interface RawUser {
  id: string;
  name: string;
  role: string;
  actor?: string;
  employeeId?: string;
  mineId?: string | null;
}

interface RawEvidenceArtifact {
  id: string;
  type: string;
  title: string;
  gps: string;
  sha256: string;
  fileSize: string;
  svg: string;
}

interface RawEvidenceItem {
  id: string;
  title: string;
  type: EvidenceType;
  status: EvidenceStatus;
  guidance: string;
  artifactId?: string;
  photoUrl?: string;
  fileName?: string;
  optional?: boolean;
  gpsHint?: string;
  aiWarning?: string;
  rejectionReason?: string;
  metadata?: EvidenceMetadata;
}

interface RawTask {
  id: string;
  title: string;
  shortTitle?: string;
  domain: DomainId;
  obligationRef?: string;
  sourceRef?: string;
  status: TaskStatus;
  urgencyGroup: UrgencyGroup;
  deadlineDate?: string;
  deadlineDisplay: string;
  shiftInfo: string;
  hoursRemaining: number;
  sourceCitation?: string;
  source?: string;
  severity: string;
  mineId: string;
  owner: UserRef;
  verifier: UserRef;
  ownerLabel?: string;
  verifierLabel?: string;
  escalationRule?: string;
  escalationLevel?: 'ESCALATED_L1' | 'ESCALATED_L2';
  escalationTarget?: string;
  rejectionReason?: string;
  submittedTimestamp?: string;
  submittedOffsetDays?: number;
  closedDate?: string;
  isCriticalDoThisNext?: boolean;
  generatedBy?: 'RULE_DERIVED' | 'MANUAL';
  recurring?: boolean;
  cadence?: 'WEEKLY' | 'MONTHLY' | null;
  form?: Task['form'];
  remediationNotes: string;
  createdOffsetDays?: number;
  deadlineOffsetDays: number;
  escalationEvents?: EscalationEvent[];
  evidenceItems: RawEvidenceItem[];
}

interface Seed {
  mines: MineSite[];
  users: RawUser[];
  domains: unknown[];
  tasks: RawTask[];
  evidenceArtifacts: RawEvidenceArtifact[];
  alerts: Alert[];
  notifications: unknown[];
  history: unknown;
  recurrence: unknown;
  aiExtractionByAlert: Record<string, { recurrence?: unknown } | undefined>;
  applicabilityByDoc: Record<string, object | undefined>;
  rules: ObligationRule[];
}

// The one mobile user: Ram Singh, Mine Safety Officer, MINE-001 Piparwar OCP.
export const MOBILE_USER_ID = 'u-ram';
export const MOBILE_MINE_ID = 'MINE-001';

// Fixed hero rejection reason used by the demo script (DEMO_FLOW scene 6).
export const HERO_REJECTION_REASON =
  'Crest photo timestamp inconsistent with the recorded visit window and berm markers are not clearly visible — re-capture at the bench crest showing the berm and crack gauge.';

// ---------------------------------------------------------------------------
// Seed loading
// ---------------------------------------------------------------------------

function artifactUri(art: RawEvidenceArtifact): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(art.svg)}`;
}

function buildEvidenceItem(raw: RawEvidenceItem, artifacts: RawEvidenceArtifact[]): EvidenceItem {
  let photoUrl = raw.photoUrl;
  if (!photoUrl && raw.artifactId) {
    const art = artifacts.find((a) => a.id === raw.artifactId);
    if (art) photoUrl = artifactUri(art);
  }
  return { ...raw, photoUrl };
}

function buildTask(raw: RawTask, artifacts: RawEvidenceArtifact[], now: Date): Task {
  const ownerLabel = raw.ownerLabel || `${raw.owner.name} (${raw.owner.role})`;
  const verifierLabel = raw.verifierLabel || `${raw.verifier.role} — ≠ owner`;
  const escalationEvents: EscalationEvent[] = (raw.escalationEvents || []).map((ev) => ({
    ...ev,
    timestamp: toISO(addDays(now, ev.timestampOffsetDays)),
  }));
  const createdAt = toISO(addDays(now, raw.createdOffsetDays ?? -2));
  return {
    ...raw,
    sourceCitation: raw.sourceCitation || raw.sourceRef || raw.source || '—',
    source: raw.source || raw.sourceRef || '—',
    deadlineDate: raw.deadlineDate || `Due ${toISO(addDays(now, raw.deadlineOffsetDays)).slice(5, 10)}`,
    ownerLabel,
    verifierLabel,
    createdAt,
    deadline: toISO(addDays(now, raw.deadlineOffsetDays)),
    publishedAt: raw.status === 'PROPOSED' ? undefined : createdAt,
    submittedAt:
      raw.submittedOffsetDays !== undefined ? toISO(addDays(now, raw.submittedOffsetDays)) : undefined,
    escalationEvents,
    evidenceItems: raw.evidenceItems.map((ev) => buildEvidenceItem(ev, artifacts)),
  };
}

export function loadSeed(): Seed {
  return {
    mines: minesData as MineSite[],
    users: usersData as RawUser[],
    domains: domainsData as unknown[],
    tasks: tasksData as RawTask[],
    evidenceArtifacts: evidenceData as RawEvidenceArtifact[],
    alerts: alertsData as Alert[],
    notifications: notificationsData as unknown[],
    history: historyData,
    recurrence: recurrenceData,
    aiExtractionByAlert: aiExtractionByAlertData as Record<string, { recurrence?: unknown } | undefined>,
    applicabilityByDoc: applicabilityByDocData as unknown as Record<string, object | undefined>,
    rules: (obligationsData as { rules: ObligationRule[] }).rules,
  };
}

// ---------------------------------------------------------------------------
// Demo store
// ---------------------------------------------------------------------------

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export interface DemoStore {
  getState: () => DemoState;
  getMobileState: () => MobileState;
  reset: () => DemoState;
  /** Runs the (simulated) AI extraction for one compliance document. */
  processDocument: (documentId?: string) => DemoState;
  /** Deterministic rules engine: applicability per mine for a processed document. */
  determineApplicability: (documentId?: string) => DemoState;
  /** Manager publishes a PROPOSED task → ASSIGNED (visible on mobile). */
  publishTask: (
    taskId: string,
    adjustments?: { deadlineOffsetDays?: number; hoursRemaining?: number; deadlineDisplay?: string; title?: string },
  ) => DemoState;
  /** Manager creates a manual obligation (provenance = MANUAL). */
  createTask: (payload: {
    title: string;
    mineId: string;
    domain: DomainId;
    severity?: string;
    deadlineOffsetDays?: number;
    ownerId?: string;
    notes?: string;
  }) => { state: DemoState; task: Task | null };
  /** Mobile: officer opens/starts an ASSIGNED task. */
  startTask: (taskId: string) => DemoState;
  saveDraft: (taskId: string, evidenceItems: EvidenceItem[], remediationNotes: string, formValues?: Record<string, string>) => DemoState;
  submitTask: (taskId: string, evidenceItems: EvidenceItem[], remediationNotes: string, formValues?: Record<string, string>) => DemoState;
  /** Regulatory official rejects one evidence item with a mandatory reason. */
  rejectEvidence: (taskId: string, evidenceId: string, reason: string) => DemoState;
  resubmitTask: (taskId: string, evidenceItems: EvidenceItem[], remediationNotes: string, formValues?: Record<string, string>) => DemoState;
  approveTask: (taskId: string) => DemoState;
  /** Idempotent recurring-instance generator (weekly/monthly cadence). */
  schedulerTick: () => { state: DemoState; created: Task[] };
}

function statusToUrgency(status: TaskStatus): UrgencyGroup {
  switch (status) {
    case 'VERIFIED':
      return 'RECENTLY_CLOSED';
    case 'AWAITING_VERIFICATION':
      return 'AWAITING_VERIFICATION';
    case 'OVERDUE':
    case 'ESCALATED':
      return 'OVERDUE';
    default:
      return 'DUE_SOON';
  }
}

export function createDemoStore(seed: Seed): DemoStore {
  let state: DemoState = buildInitial(seed);

  const log = (actor: string, action: string, entity: string, detail?: string) => {
    const event: AuditEvent = {
      timestamp: toISO(new Date()),
      actor,
      action,
      entity,
      detail,
    };
    state.audit = [...state.audit.slice(-99), event];
  };

  // The mobile camera (frozen UI) stamps every capture with the same placeholder
  // SHA-256. The server seals the authoritative artifact hash per task + item so
  // the closure record lists distinct, realistic hashes — without touching the
  // mobile UI.
  const sealEvidence = (item: EvidenceItem, taskId: string): EvidenceItem => {
    if (!item.metadata || (item.status !== 'uploaded' && item.status !== 'verified')) {
      return item;
    }
    const sealed = sha256(`${taskId}:${item.id}:${item.metadata.sha256}:${toISO(new Date())}`);
    return {
      ...item,
      metadata: {
        ...item.metadata,
        sha256: `${sealed.slice(0, 24)}…${sealed.slice(-8)}`,
      },
    };
  };

  const sealEvidenceList = (items: EvidenceItem[], taskId: string): EvidenceItem[] =>
    items.map((ev) => sealEvidence(clone(ev), taskId));

  const patchTask = (taskId: string, patch: (t: Task) => Task) => {
    state = {
      ...state,
      tasks: state.tasks.map((t) => (t.id === taskId ? patch(clone(t)) : t)),
      updatedAt: toISO(new Date()),
    };
  };

  const buildClosureCertificate = (task: Task, verifiedAt: Date): ClosureCertificate => {
    const evidenceHashes = task.evidenceItems
      .filter((ev) => ev.metadata?.sha256)
      .map((ev) => ev.metadata!.sha256);
    const payload = JSON.stringify({
      taskId: task.id,
      source: task.sourceCitation,
      owner: task.ownerLabel,
      verifier: task.verifierLabel,
      submitted: task.submittedAt,
      verified: toISO(verifiedAt),
      evidenceHashes,
    });
    return {
      taskId: task.id,
      source: task.sourceCitation,
      ownerName: task.owner.name,
      ownerRole: task.owner.role,
      verifierName: task.verifier.name,
      verifierRole: task.verifier.role,
      created: task.createdAt,
      submitted: task.submittedAt || '',
      verified: toISO(verifiedAt),
      evidenceCount: evidenceHashes.length,
      evidenceHashes,
      hash: `${sha256(payload).slice(0, 16)}…${sha256(payload).slice(-8)}`,
      auditHash: `${sha256(JSON.stringify(state.audit)).slice(0, 16)}…`,
      closedAt: toISO(verifiedAt),
    };
  };

  function buildInitial(seed: Seed): DemoState {
    const now = new Date();
    const alerts = seed.alerts.map((a) =>
      a.ackDeadlineOffsetDays ? { ...a, ackDeadlineDate: toISO(addDays(now, a.ackDeadlineOffsetDays)) } : a,
    );
    return {
      sites: seed.mines.map((m) => ({ ...m })),
      tasks: seed.tasks.map((t) => buildTask(t, seed.evidenceArtifacts, now)),
      alerts,
      rules: clone(seed.rules),
      notifications: clone(seed.notifications),
      pipeline: {
        // Actionable compliance documents each get their own pipeline slot so
        // several can be in different lifecycle stages at once. Operational
        // feed items (kind 'operational') stay in `alerts` only.
        documents: alerts
          .filter((a) => a.ref && (a.title || a.alertNo) && a.kind !== 'operational')
          .map((a) => ({ alert: { ...a }, extraction: null, recurrence: null, applicability: null })),
      },
      audit: [],
      updatedAt: toISO(now),
    };
  }

  function audienceFilterForMobile(tasks: Task[], mine: MineSite | null, user: UserRef | null): Task[] {
    return tasks.filter((t) => {
      if (t.mineId !== MOBILE_MINE_ID) return false;
      // PROPOSED is invisible on mobile until the manager publishes it.
      if (t.status === 'PROPOSED') return false;
      return t.owner.id === MOBILE_USER_ID;
    });
  }

  return {
    getState: () => clone(state),

    getMobileState: () => {
      const mine = state.sites.find((s) => s.id === MOBILE_MINE_ID) ?? null;
      const user = state.tasks.find((t) => t.owner.id === MOBILE_USER_ID)?.owner ?? null;
      return {
        mine,
        user: user ?? { id: MOBILE_USER_ID, name: 'Ram Singh', role: 'Mine Safety Officer' },
        tasks: audienceFilterForMobile(state.tasks, mine, user),
        updatedAt: state.updatedAt,
      };
    },

    reset: () => {
      state = buildInitial(seed);
      return clone(state);
    },

    processDocument: (documentId?: string) => {
      const idx = state.pipeline.documents.findIndex((p) =>
        documentId ? p.alert.id === documentId || p.alert.ref === documentId : p.alert.status === 'received',
      );
      if (idx === -1) return clone(state);
      const entry = state.pipeline.documents[idx];
      if (!entry.extraction) {
        const ref = entry.alert.ref ?? entry.alert.id;
        const byDoc = seed.aiExtractionByAlert as Record<string, { recurrence?: unknown } | undefined>;
        const extraction = byDoc[ref] ?? null;
        const recurrence = extraction?.recurrence ?? seed.recurrence;
        state = {
          ...state,
          pipeline: {
            ...state.pipeline,
            documents: state.pipeline.documents.map((p, i) =>
              i === idx
                ? { ...p, alert: { ...p.alert, status: 'processed' as DocumentStatus }, extraction, recurrence }
                : p,
            ),
          },
          updatedAt: toISO(new Date()),
        };
        log('AI-EXTRACTION', 'DOCUMENT_PROCESSED', ref, 'advisory — rules decide next');
      }
      return clone(state);
    },

    determineApplicability: (documentId?: string) => {
      const idx = state.pipeline.documents.findIndex((p) =>
        documentId ? p.alert.id === documentId || p.alert.ref === documentId : !!p.extraction && !p.applicability,
      );
      if (idx === -1) return clone(state);
      const entry = state.pipeline.documents[idx];
      if (entry.applicability) return clone(state);
      if (!entry.extraction) return clone(state);
      const ref = entry.alert.ref ?? entry.alert.id;
      const applicability =
        (seed.applicabilityByDoc as unknown as Record<string, object | undefined>)[ref] ?? null;
      state = {
        ...state,
        pipeline: {
          ...state.pipeline,
          documents: state.pipeline.documents.map((p, i) =>
            i === idx
              ? { ...p, alert: { ...p.alert, status: 'determined' as DocumentStatus }, applicability }
              : p,
          ),
        },
        updatedAt: toISO(new Date()),
      };
      log('RULES-ENGINE', 'APPLICABILITY_DETERMINED', ref, 'deterministic — not AI');
      return clone(state);
    },

    publishTask: (taskId, adjustments) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task || task.status !== 'PROPOSED') return clone(state);
      const now = new Date();
      const deadlineOffset = adjustments?.deadlineOffsetDays ?? Math.ceil((new Date(task.deadline).getTime() - now.getTime()) / 86400000);
      patchTask(taskId, (t) => ({
        ...t,
        status: 'ASSIGNED',
        urgencyGroup: 'DUE_SOON',
        deadline: toISO(addDays(now, deadlineOffset)),
        deadlineDate: `Due ${toISO(addDays(now, deadlineOffset)).slice(5, 10)}`,
        deadlineDisplay: adjustments?.deadlineDisplay ?? t.deadlineDisplay,
        hoursRemaining: adjustments?.hoursRemaining ?? Math.max(1, Math.round(deadlineOffset * 24)),
        title: adjustments?.title ?? t.title,
        publishedAt: toISO(now),
        createdAt: t.createdAt || toISO(now),
      }));
      log('AREA-MANAGER', 'TASK_PUBLISHED', taskId, `→ ASSIGNED · owner ${task.ownerLabel}`);
      return clone(state);
    },

    createTask: (payload) => {
      const now = new Date();
      const mine = state.sites.find((s) => s.id === payload.mineId);
      if (!mine) return { state: clone(state), task: null };
      const owner =
        state.tasks.find((t) => t.mineId === payload.mineId && t.owner.role === 'Mine Safety Officer')?.owner ??
        ({ id: 'u-ram', name: 'Ram Singh', role: 'Mine Safety Officer' } as UserRef);
      const verifier = ({ id: 'u-regulator', name: 'R. Sharma', role: 'Regulatory Official' } as UserRef);
      const offset = payload.deadlineOffsetDays ?? 7;
      const id = `TASK-MANUAL-${sha256(payload.title + payload.mineId).slice(0, 6).toUpperCase()}`;
      const task: Task = {
        id,
        title: payload.title,
        domain: payload.domain,
        status: 'PROPOSED',
        urgencyGroup: 'DUE_SOON',
        deadlineDate: `Due ${toISO(addDays(now, offset)).slice(5, 10)}`,
        deadlineDisplay: `Due in ${offset}d`,
        shiftInfo: 'General Shift',
        hoursRemaining: offset * 24,
        sourceCitation: payload.notes || 'Manual obligation — Area Manager',
        source: 'MANUAL',
        severity: payload.severity || 'Medium',
        mineId: payload.mineId,
        owner,
        verifier,
        ownerLabel: `${owner.name} (${owner.role})`,
        verifierLabel: `${verifier.name} (${verifier.role}) — ≠ owner`,
        escalationRule: 'Auto-escalates at deadline to Area General Manager',
        isCriticalDoThisNext: false,
        generatedBy: 'MANUAL',
        evidenceItems: [
          {
            id: 'ev-manual-1',
            title: 'Completion evidence (photo/document)',
            type: 'photo',
            status: 'pending',
            guidance: 'Geo-tagged photo or document proving the obligation was completed',
          },
        ],
        remediationNotes: payload.notes || '',
        createdAt: toISO(now),
        deadline: toISO(addDays(now, offset)),
        escalationEvents: [],
      };
      state = { ...state, tasks: [...state.tasks, task], updatedAt: toISO(now) };
      log('AREA-MANAGER', 'TASK_CREATED_MANUAL', id, `${payload.title} @ ${mine.id}`);
      return { state: clone(state), task: clone(task) };
    },

    startTask: (taskId) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task || task.status !== 'ASSIGNED') return clone(state);
      patchTask(taskId, (t) => ({ ...t, status: 'IN_PROGRESS', urgencyGroup: 'DUE_SOON' }));
      log('MINE-OFFICIAL', 'TASK_STARTED', taskId, 'field execution started');
      return clone(state);
    },

    saveDraft: (taskId, evidenceItems, remediationNotes, formValues) => {
      patchTask(taskId, (t) => {
        // Guard: an empty/missing evidence push must never wipe persisted
        // evidence (e.g. a malformed request or notes-only client update).
        const incoming =
          Array.isArray(evidenceItems) && evidenceItems.length > 0
            ? sealEvidenceList(evidenceItems, taskId)
            : t.evidenceItems;
        return {
          ...t,
          evidenceItems: incoming,
          remediationNotes: remediationNotes ?? t.remediationNotes,
          formValues: formValues ?? t.formValues,
        };
      });
      log('MINE-OFFICIAL', 'EVIDENCE_DRAFT', taskId, `${(evidenceItems ?? []).length} item(s)`);
      return clone(state);
    },

    submitTask: (taskId, evidenceItems, remediationNotes, formValues) => {
      let submitted = false;
      const sealed = sealEvidenceList(evidenceItems, taskId);
      patchTask(taskId, (t) => {
        const updated: Task = {
          ...t,
          evidenceItems: sealed,
          remediationNotes,
          formValues: formValues ?? t.formValues,
        };
        const allComplete = updated.evidenceItems
          .filter((ev) => !ev.optional)
          .every((ev) => ev.status === 'uploaded' || ev.status === 'verified');
        const notesOk = (remediationNotes || '').trim().length >= 15;
        const canAdvance = ['IN_PROGRESS', 'ASSIGNED', 'REJECTED', 'OVERDUE', 'ESCALATED'].includes(t.status);
        if (canAdvance && allComplete && notesOk) {
          submitted = true;
          return {
            ...updated,
            status: 'AWAITING_VERIFICATION',
            urgencyGroup: 'AWAITING_VERIFICATION',
            isCriticalDoThisNext: false,
            rejectionReason: undefined,
            submittedTimestamp: 'Just now (Shift I)',
            submittedAt: toISO(new Date()),
            submissionCount: (t.submissionCount ?? 0) + 1,
          };
        }
        return updated;
      });
      if (submitted) {
        log('MINE-OFFICIAL', 'EVIDENCE_SUBMITTED', taskId, '→ AWAITING_VERIFICATION');
      }
      return clone(state);
    },

    rejectEvidence: (taskId, evidenceId, reason) => {
      patchTask(taskId, (t) => ({
        ...t,
        status: 'REJECTED',
        urgencyGroup: 'DUE_SOON',
        rejectionReason: reason,
        isCriticalDoThisNext: true,
        submittedAt: undefined,
        evidenceItems: t.evidenceItems.map((ev) =>
          ev.id === evidenceId
            ? { ...ev, status: 'rejected' as const, rejectionReason: reason }
            : ev,
        ),
      }));
      log('REGULATORY-OFFICIAL', 'EVIDENCE_REJECTED', taskId, reason);
      return clone(state);
    },

    resubmitTask: (taskId, evidenceItems, remediationNotes, formValues) => {
      if (evidenceItems && evidenceItems.length > 0) {
        // Correction: submit the corrected evidence packet through the normal
        // submit transition (REJECTED is an allowed source state).
        const sealed = sealEvidenceList(evidenceItems, taskId);
        let resubmitted = false;
        patchTask(taskId, (t) => {
          const updated: Task = {
            ...t,
            evidenceItems: sealed,
            remediationNotes: remediationNotes ?? t.remediationNotes,
            formValues: formValues ?? t.formValues,
          };
          const allComplete = updated.evidenceItems
            .filter((ev) => !ev.optional)
            .every((ev) => ev.status === 'uploaded' || ev.status === 'verified');
          const notesOk = (remediationNotes ?? '').trim().length >= 15;
          if (t.status === 'REJECTED' && allComplete && notesOk) {
            resubmitted = true;
            return {
              ...updated,
              status: 'AWAITING_VERIFICATION',
              urgencyGroup: 'AWAITING_VERIFICATION',
              isCriticalDoThisNext: false,
              rejectionReason: undefined,
              submittedTimestamp: 'Just now (Shift I)',
              submittedAt: toISO(new Date()),
              submissionCount: (t.submissionCount ?? 0) + 1,
            };
          }
          return updated;
        });
        if (resubmitted) {
          log('MINE-OFFICIAL', 'EVIDENCE_RESUBMITTED', taskId, '→ AWAITING_VERIFICATION');
        }
        return clone(state);
      }
      patchTask(taskId, (t) => ({
        ...t,
        status: 'AWAITING_VERIFICATION',
        urgencyGroup: 'AWAITING_VERIFICATION',
        isCriticalDoThisNext: false,
        rejectionReason: undefined,
        submittedAt: toISO(new Date()),
        submittedTimestamp: 'Just now (Shift I)',
        evidenceItems: t.evidenceItems.map((ev) =>
          ev.status === 'rejected' ? { ...ev, status: 'uploaded' as const, rejectionReason: undefined } : ev,
        ),
        submissionCount: (t.submissionCount ?? 0) + 1,
      }));
      log('MINE-OFFICIAL', 'EVIDENCE_RESUBMITTED', taskId, '→ AWAITING_VERIFICATION');
      return clone(state);
    },

    approveTask: (taskId) => {
      const verifiedAt = new Date();
      let approved = false;
      patchTask(taskId, (t) => {
        if (!['AWAITING_VERIFICATION'].includes(t.status)) return t;
        const certificate = buildClosureCertificate(
          { ...t, submittedAt: t.submittedAt || t.submittedTimestamp },
          verifiedAt,
        );
        approved = true;
        return {
          ...t,
          status: 'VERIFIED',
          urgencyGroup: 'RECENTLY_CLOSED',
          closedDate: 'Verified & closed',
          isCriticalDoThisNext: false,
          closedAt: toISO(verifiedAt),
          verifiedAt: toISO(verifiedAt),
          closureCertificate: certificate,
          evidenceItems: t.evidenceItems.map((ev) =>
            ev.status === 'uploaded' || ev.status === 'rejected'
              ? { ...ev, status: 'verified' as const }
              : ev,
          ),
        };
      });
      if (approved) {
        log('REGULATORY-OFFICIAL', 'CLOSURE_VERIFIED', taskId, '→ VERIFIED');
      }
      return clone(state);
    },

    schedulerTick: () => {
      // Deterministic recurring-instance generation: for WEEKLY/MONTHLY rules
      // whose current instances are VERIFIED, generate the next period instance
      // as PROPOSED (manager review). Idempotent per rule+mine+period.
      const created: Task[] = [];
      const now = new Date();
      for (const rule of state.rules) {
        if (!rule.cadence) continue;
        const instances = state.tasks.filter((t) => t.obligationRef === rule.id);
        const allClosed = instances.length > 0 && instances.every((t) => t.status === 'VERIFIED');
        if (!allClosed) continue;
        const nextOffset = rule.cadence.kind === 'WEEKLY' ? 7 : 30;
        const periodLabel =
          rule.cadence.kind === 'WEEKLY'
            ? `Week ${Math.ceil((now.getTime() / 86400000 + 4) % 52)} · ${now.getFullYear()}`
            : `Month ${now.getMonth() + 2} · ${now.getFullYear()}`;
        for (const template of instances) {
          const exists = state.tasks.some(
            (t) => t.obligationRef === rule.id && t.mineId === template.mineId && t.periodLabel === periodLabel,
          );
          if (exists) continue;
          const nextId = `${template.id.replace(/W\d+/, 'W' + Math.ceil((now.getTime() / 86400000 + 4) % 52))}-N${created.length}`;
          const next: Task = {
            ...clone(template),
            id: nextId,
            status: 'PROPOSED',
            urgencyGroup: 'DUE_SOON',
            periodLabel,
            createdAt: toISO(now),
            deadline: toISO(addDays(now, nextOffset)),
            deadlineDate: `Due ${toISO(addDays(now, nextOffset)).slice(5, 10)}`,
            hoursRemaining: nextOffset * 24,
            isCriticalDoThisNext: false,
            evidenceItems: template.evidenceItems.map((ev) => ({
              ...ev,
              status: 'pending' as const,
              metadata: undefined,
              photoUrl: undefined,
              rejectionReason: undefined,
            })),
            remediationNotes: '',
            submittedAt: undefined,
            verifiedAt: undefined,
            closedAt: undefined,
            closureCertificate: undefined,
          };
          state.tasks = [...state.tasks, next];
          created.push(clone(next));
          log('SCHEDULER', 'RECURRING_INSTANCE_GENERATED', next.id, `${rule.id} · ${periodLabel}`);
        }
      }
      if (created.length > 0) {
        state = { ...state, updatedAt: toISO(now) };
      }
      return { state: clone(state), created };
    },
  };
}
