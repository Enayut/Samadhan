// Deterministic in-memory demo store + state machine for the SIH demo.
//
// This module is the seam that a future FastAPI backend would replace: every
// mutation here is a pure, deterministic state transition on hardcoded JSON
// seed data. The demo server (client/server.ts) exposes these as /api/demo/*
// endpoints; both frontends consume them through a thin demoApi client.
//
// IMPORTANT: this file runs in Node (the demo server). It must NOT be
// imported by browser code. Browser code goes through the demoApi fetch
// wrapper instead.
//
// No randomness. No network. The same sequence of calls always produces the
// same result, so the recorded demo is reproducible from a fresh state.

import { createHash } from 'crypto';

// Minimal local date helpers so this module has zero runtime dependencies
// (the demo server bundles it, and the browser apps never import it directly).
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
import dashboardData from '../data/dashboard.json';
import historyData from '../data/history.json';
import recurrenceData from '../data/recurrence.json';
import aiExtractionByAlertData from '../data/aiExtractionByAlert.json';
import fanoutByAlertData from '../data/fanoutByAlert.json';

import type {
  Alert,
  AuditEvent,
  ClosureCertificate,
  DemoState,
  DomainId,
  EscalationEvent,
  EvidenceItem,
  EvidenceMetadata,
  MineSite,
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
  type: 'photo' | 'document' | 'register';
  status: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'missing';
  guidance: string;
  artifactId?: string;
  photoUrl?: string;
  fileName?: string;
  aiWarning?: string;
  rejectionReason?: string;
  metadata?: EvidenceMetadata;
}

interface RawTask {
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
  ownerLabel?: string;
  verifierLabel?: string;
  escalationRule?: string;
  escalationLevel?: 'ESCALATED_L1' | 'ESCALATED_L2';
  escalationTarget?: string;
  rejectionReason?: string;
  submittedTimestamp?: string;
  closedDate?: string;
  isCriticalDoThisNext?: boolean;
  remediationNotes: string;
  createdOffsetDays: number;
  deadlineOffsetDays: number;
  escalationEvents?: EscalationEvent[];
  evidenceItems: RawEvidenceItem[];
}

interface TaskTemplate {
  id: string;
  title: string;
  shortTitle?: string;
  domain: DomainId;
  severity: string;
  status: TaskStatus;
  ownerId: string;
  verifierId: string;
  hoursRemaining: number;
  deadlineOffsetDays: number;
  deadlineDisplay?: string;
  shiftInfo: string;
  sourceCitation: string;
  escalationRule?: string;
  isCriticalDoThisNext?: boolean;
  remediationNotes: string;
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
  dashboard: unknown;
  history: unknown;
  recurrence: unknown;
  aiExtractionByAlert: unknown;
  fanoutByAlert: unknown;
}

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
  return {
    ...raw,
    ownerLabel,
    verifierLabel,
    createdAt: toISO(addDays(now, raw.createdOffsetDays)),
    deadline: toISO(addDays(now, raw.deadlineOffsetDays)),
    escalationEvents,
    evidenceItems: raw.evidenceItems.map((ev) => buildEvidenceItem(ev, artifacts)),
  };
}

function buildTemplateTask(
  tpl: TaskTemplate,
  users: RawUser[],
  artifacts: RawEvidenceArtifact[],
  now: Date,
  sourceRef: string,
  mineId: string,
): Task {
  const owner = users.find((u) => u.id === tpl.ownerId) || users[0];
  const verifier = users.find((u) => u.id === tpl.verifierId) || users[1];
  const ownerRef: UserRef = { id: owner.id, name: owner.name, role: owner.role };
  const verifierRef: UserRef = { id: verifier.id, name: verifier.name, role: verifier.role };
  const urgencyGroup: UrgencyGroup = tpl.status === 'IN_PROGRESS' || tpl.status === 'DUE_SOON' ? 'DUE_SOON' : 'DUE_SOON';
  const deadlineDate = `Due ${toISO(addDays(now, tpl.deadlineOffsetDays)).slice(5, 10)}`;
  return {
    id: tpl.id,
    title: tpl.title,
    shortTitle: tpl.shortTitle,
    domain: tpl.domain,
    status: tpl.status,
    urgencyGroup,
    deadlineDate,
    deadlineDisplay: tpl.deadlineDisplay || deadlineDate,
    shiftInfo: tpl.shiftInfo,
    hoursRemaining: tpl.hoursRemaining,
    sourceCitation: tpl.sourceCitation,
    source: sourceRef,
    severity: tpl.severity,
    mineId,

    owner: ownerRef,
    verifier: verifierRef,
    ownerLabel: `${owner.name} (${owner.role})`,
    verifierLabel: `${verifier.role} — ≠ owner`,
    escalationRule: tpl.escalationRule,
    isCriticalDoThisNext: tpl.isCriticalDoThisNext,
    remediationNotes: tpl.remediationNotes,
    createdAt: toISO(now),
    deadline: toISO(addDays(now, tpl.deadlineOffsetDays)),
    escalationEvents: [],
    evidenceItems: tpl.evidenceItems.map((ev) => buildEvidenceItem(ev, artifacts)),
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
    dashboard: dashboardData,
    history: historyData,
    recurrence: recurrenceData,
    aiExtractionByAlert: aiExtractionByAlertData,
    fanoutByAlert: fanoutByAlertData,
  };
}

// ---------------------------------------------------------------------------
// Demo store
// ---------------------------------------------------------------------------

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function buildInitial(seed: Seed): DemoState {
  const now = new Date();
  // Alerts carry an ack-deadline display string + a seed offset; the store
  // derives a machine-readable ISO date so the calendar page can plot them.
  const alerts = seed.alerts.map((a) =>
    a.ackDeadlineOffsetDays ? { ...a, ackDeadlineDate: toISO(addDays(now, a.ackDeadlineOffsetDays)) } : a,
  );
  return {
    sites: seed.mines.map((m) => ({ ...m })),
    tasks: seed.tasks.map((t) => buildTask(t, seed.evidenceArtifacts, now)),
    alerts,
    notifications: seed.notifications,
    pipeline: {
      // Actionable alerts (they carry a ref + title and are not feed noise)
      // each get their own pipeline slot so several can be in different
      // lifecycle stages at once. Feed items (kind 'operational') stay in
      // `alerts` only.
      alerts: alerts
        .filter((a) => a.ref && (a.title || a.alertNo) && a.kind !== 'operational')
        .map((a) => ({ alert: { ...a }, extraction: null, recurrence: null, fanout: null })),
    },
    audit: [],
    updatedAt: toISO(now),
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export interface DemoStore {
  getState: () => DemoState;
  reset: () => DemoState;
  /** Runs the (simulated) AI pipeline for one alert; defaults to the first unprocessed alert. */
  processAlert: (alertId?: string) => DemoState;
  /** Confirms an alert's extraction and fans obligations out; defaults to the processed-but-unconfirmed alert. */
  confirmExtraction: (alertId?: string) => { state: DemoState; createdTasks: Task[]; fanout: unknown };
  saveDraft: (taskId: string, evidenceItems: EvidenceItem[], remediationNotes: string) => DemoState;
  submitTask: (taskId: string, evidenceItems: EvidenceItem[], remediationNotes: string) => DemoState;
  rejectEvidence: (taskId: string, evidenceId: string, reason: string) => DemoState;
  resubmitTask: (taskId: string) => DemoState;
  approveTask: (taskId: string) => DemoState;
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
    state.audit = [...state.audit.slice(-49), event];
  };

  // The mobile camera (frozen UI) stamps every capture with the same placeholder
  // SHA-256. The server seals the authoritative artifact hash per task + item so
  // the closure certificate lists distinct, realistic hashes — without touching
  // the mobile UI.
  const sealEvidence = (item: EvidenceItem, taskId: string): EvidenceItem => {
    if (!item.metadata || (item.status !== 'uploaded' && item.status !== 'verified')) {
      return item;
    }
    const sealed = sha256(`${taskId}:${item.id}:${item.metadata.sha256}:${toISO(new Date())}`);
    return {
      ...item,
      metadata: {
        ...item.metadata,
        sha256: `0x${sealed.slice(0, 24)}…${sealed.slice(-8)}`,
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
      hash: `0x${sha256(payload).slice(0, 16)}…${sha256(payload).slice(-8)}`,
      auditHash: `0x${sha256(JSON.stringify(state.audit)).slice(0, 16)}…`,
      closedAt: toISO(verifiedAt),
    };
  };

  return {
    getState: () => clone(state),

    reset: () => {
      state = buildInitial(seed);
      return clone(state);
    },

    processAlert: (alertId?: string) => {
      const idx = state.pipeline.alerts.findIndex((p) =>
        alertId ? p.alert.id === alertId || p.alert.ref === alertId : p.alert.status === 'received',
      );
      if (idx === -1) return clone(state);
      const entry = state.pipeline.alerts[idx];
      if (!entry.extraction) {
        const ref = entry.alert.ref ?? entry.alert.id;
        const byAlert = seed.aiExtractionByAlert as Record<string, { recurrence?: unknown } | undefined>;
        const extraction = byAlert[ref] ?? null;
        const recurrence = extraction?.recurrence ?? seed.recurrence;
        state = {
          ...state,
          pipeline: {
            ...state.pipeline,
            alerts: state.pipeline.alerts.map((p, i) =>
              i === idx
                ? { ...p, alert: { ...p.alert, status: 'processed' }, extraction, recurrence }
                : p,
            ),
          },
          updatedAt: toISO(new Date()),
        };
        log('system-ai', 'ALERT_PROCESSED', ref);
      }
      return clone(state);
    },

    confirmExtraction: (alertId?: string) => {
      const idx = state.pipeline.alerts.findIndex((p) =>
        alertId ? p.alert.id === alertId || p.alert.ref === alertId : !!p.extraction && !p.fanout,
      );
      if (idx === -1) {
        return { state: clone(state), createdTasks: [], fanout: null };
      }
      const entry = state.pipeline.alerts[idx];
      if (entry.fanout) {
        return { state: clone(state), createdTasks: [], fanout: entry.fanout };
      }
      if (!entry.extraction) {
        return { state: clone(state), createdTasks: [], fanout: null };
      }
      const now = new Date();
      const extraction = entry.extraction as { taskTemplates?: TaskTemplate[]; sourceRef?: string };
      const ref = entry.alert.ref ?? entry.alert.id;
      const sourceRef = extraction.sourceRef ?? ref;
      const mineId = entry.alert.siteId ?? 'MINE-001';
      const createdTasks = (extraction.taskTemplates ?? []).map((tpl) =>
        buildTemplateTask(tpl, seed.users, seed.evidenceArtifacts, now, sourceRef, mineId),
      );
      const fanout = {
        ...((seed.fanoutByAlert as Record<string, object>)[ref] ?? {}),
        generatedAt: toISO(now),
      };
      state = {
        ...state,
        tasks: [...state.tasks, ...createdTasks],
        pipeline: {
          ...state.pipeline,
          alerts: state.pipeline.alerts.map((p, i) =>
            i === idx ? { ...p, alert: { ...p.alert, status: 'confirmed' }, fanout } : p,
          ),
        },
        updatedAt: toISO(now),
      };
      log(
        'system-rules',
        'FANOUT_COMPLETE',
        ref,
        `${(fanout as { governanceObjects?: number }).governanceObjects ?? createdTasks.length} governance objects created`,
      );
      createdTasks.forEach((t) => log('system-rules', 'TASK_CREATED', t.id, t.ownerLabel));
      return { state: clone(state), createdTasks: clone(createdTasks), fanout };
    },

    saveDraft: (taskId, evidenceItems, remediationNotes) => {
      const sealed = sealEvidenceList(evidenceItems, taskId);
      patchTask(taskId, (t) => ({
        ...t,
        evidenceItems: sealed,
        remediationNotes,
      }));
      log('owner', 'EVIDENCE_DRAFT', taskId, `${evidenceItems.length} item(s)`);
      return clone(state);
    },

    submitTask: (taskId, evidenceItems, remediationNotes) => {
      let submitted = false;
      const sealed = sealEvidenceList(evidenceItems, taskId);
      patchTask(taskId, (t) => {
        const updated: Task = {
          ...t,
          evidenceItems: sealed,
          remediationNotes,
        };
        const allComplete = updated.evidenceItems.every(
          (ev) => ev.status === 'uploaded' || ev.status === 'verified',
        );
        const canAdvance = ['IN_PROGRESS', 'DUE_SOON', 'REJECTED', 'OVERDUE', 'ESCALATED'].includes(
          t.status,
        );
        if (canAdvance && allComplete) {
          submitted = true;
          return {
            ...updated,
            status: 'AWAITING_VERIFICATION',
            urgencyGroup: 'AWAITING_VERIFICATION',
            isCriticalDoThisNext: false,
            rejectionReason: undefined,
            submittedTimestamp: 'Just now (Shift III)',
            submittedAt: toISO(new Date()),
          };
        }
        return updated;
      });
      if (submitted) {
        log('owner', 'EVIDENCE_SUBMITTED', taskId, '→ AWAITING_VERIFICATION');
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
      log('verifier', 'EVIDENCE_REJECTED', taskId, reason);
      return clone(state);
    },

    resubmitTask: (taskId) => {
      patchTask(taskId, (t) => ({
        ...t,
        status: 'AWAITING_VERIFICATION',
        urgencyGroup: 'AWAITING_VERIFICATION',
        isCriticalDoThisNext: false,
        rejectionReason: undefined,
        submittedAt: toISO(new Date()),
      }));
      log('owner', 'EVIDENCE_RESUBMITTED', taskId, '→ AWAITING_VERIFICATION');
      return clone(state);
    },

    approveTask: (taskId) => {
      const verifiedAt = new Date();
      let approved = false;
      patchTask(taskId, (t) => {
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
        log('verifier', 'CLOSURE_VERIFIED', taskId, '→ VERIFIED_CLOSED');
      }
      return clone(state);
    },
  };
}