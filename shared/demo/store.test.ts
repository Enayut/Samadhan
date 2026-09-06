// Temporary verification script for the demo store state machine.
// Run: cd client && node_modules/.bin/tsx ../shared/demo/store.test.ts
import { createDemoStore, loadSeed } from './store';

const store = createDemoStore(loadSeed());
let state = store.getState();
const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
  console.log('ok  :', msg);
};

// Helpers for per-alert pipeline access
const heroEntry = () => state.pipeline.alerts.find((p) => p.alert.ref === 'DGMS/2026/SA-041')!;
const entryByRef = (ref: string) => state.pipeline.alerts.find((p) => p.alert.ref === ref)!;

// 1. Fresh state: hero task does NOT exist yet
assert(!state.tasks.some((t) => t.id === 'TASK-001'), 'TASK-001 not present in fresh state');
assert(state.pipeline.alerts.length === 6, `inbox has 6 actionable alerts (got ${state.pipeline.alerts.length})`);
assert(state.pipeline.alerts.every((p) => p.alert.status === 'received'), 'all alerts start received');
assert(state.pipeline.alerts.every((p) => p.extraction === null), 'no extraction before processing');
assert(heroEntry().alert.ref === 'DGMS/2026/SA-041', 'hero alert is the DGMS safety alert');
assert(state.tasks.length === 11, `seed has 11 tasks (got ${state.tasks.length})`);

// 2. Process alert (AI extraction)
state = store.processAlert();
assert(heroEntry().alert.status === 'processed', 'hero alert processed after AI pipeline');
assert(heroEntry().extraction !== null, 'extraction present after processing');
assert(heroEntry().recurrence !== null, 'recurrence present after processing');
assert(state.pipeline.alerts.filter((p) => p.alert.status === 'processed').length === 1, 'only hero processed');

// 3. Confirm extraction → fan-out creates tasks
const { state: state2, createdTasks } = store.confirmExtraction();
state = state2;
assert(createdTasks.length === 3, `fan-out created 3 tasks (got ${createdTasks.length})`);
assert(createdTasks.map((t) => t.id).join(',') === 'TASK-101,TASK-001,TASK-102', 'created TASK-101, TASK-001, TASK-102');
assert(state.tasks.length === 14, `now 14 tasks (got ${state.tasks.length})`);
assert(heroEntry().fanout !== null, 'fanout present after confirm');
assert(heroEntry().alert.status === 'confirmed', 'hero alert confirmed');
const fanout = heroEntry().fanout as { affected: number; filteredOut: number; governanceObjects: number };
assert(fanout.affected === 61 && fanout.filteredOut === 261 && fanout.governanceObjects === 183, 'hero fanout counters 61/261/183');

// 3b. A different alert processes independently — per-alert pipeline state
state = store.processAlert('CSIS/2026/IN-118');
assert(entryByRef('CSIS/2026/IN-118').alert.status === 'processed', 'CSIS alert processed independently');
assert(heroEntry().alert.status === 'confirmed', 'hero alert state untouched');
const { state: state3, createdTasks: csisTasks } = store.confirmExtraction('CSIS/2026/IN-118');
state = state3;
assert(csisTasks.map((t) => t.id).join(',') === 'TASK-PPE-001', 'CSIS fan-out creates TASK-PPE-001');
assert(entryByRef('CSIS/2026/IN-118').fanout !== null, 'CSIS fanout present');
assert((entryByRef('CSIS/2026/IN-118').fanout as { affected: number }).affected === 24, 'CSIS fanout counters (24 affected)');
assert(heroEntry().fanout !== null && heroEntry().alert.status === 'confirmed', 'hero unaffected by second alert');
assert(state.tasks.length === 15, `now 15 tasks (got ${state.tasks.length})`);

// 3c. Sensor alert fans out to its own mine (siteId drives mine routing)
state = store.processAlert('SEN/2026/M004-ST-22');
const { state: state4, createdTasks: sensorTasks } = store.confirmExtraction('SEN/2026/M004-ST-22');
state = state4;
assert(sensorTasks.every((t) => t.mineId === 'MINE-004'), 'sensor-alert tasks routed to MINE-004');
assert(sensorTasks.every((t) => t.source === 'SEN/2026/M004-ST-22'), 'sensor-alert tasks carry their own source');

// 4. Hero task state
const hero = state.tasks.find((t) => t.id === 'TASK-001')!;
assert(hero.status === 'IN_PROGRESS', 'hero task IN_PROGRESS');
assert(hero.isCriticalDoThisNext === true, 'hero task flagged DO THIS NEXT');
assert(hero.evidenceItems.length === 3, 'hero task has 3 evidence items');
assert(hero.evidenceItems.every((ev) => ev.status === 'pending'), 'all hero evidence pending');
assert(hero.evidenceItems[0].photoUrl === undefined, 'pending evidence has no photoUrl');
assert(hero.owner.name === 'Ram Singh' && hero.verifier.name === 'R. Sharma', 'hero owner Ram Singh / verifier R. Sharma');
assert(hero.verifier.id !== hero.owner.id, 'owner ≠ verifier structurally');

// 5. Draft evidence (mobile captures)
const ev1 = { ...hero.evidenceItems[0], status: 'uploaded' as const, photoUrl: 'data:image/svg+xml;utf8,abc', metadata: { timestamp: '02:45 IST', gps: '23.7957° N, 86.4304° E', user: 'R. Singh (MSO-402)', sha256: 'sha-1' } };
const ev2 = { ...hero.evidenceItems[1], status: 'uploaded' as const, photoUrl: 'data:image/svg+xml;utf8,def', metadata: { timestamp: '02:48 IST', gps: '23.7957° N, 86.4304° E', user: 'R. Singh (MSO-402)', sha256: 'sha-2' } };
const ev3 = { ...hero.evidenceItems[2], status: 'uploaded' as const, photoUrl: 'data:image/svg+xml;utf8,ghi', metadata: { timestamp: '02:52 IST', gps: '23.7957° N, 86.4304° E', user: 'R. Singh (MSO-402)', sha256: 'sha-3' } };
state = store.saveDraft('TASK-001', [ev1], 'briefing notes...');
assert(state.tasks.find((t) => t.id === 'TASK-001')!.status === 'IN_PROGRESS', 'draft does not change status');
state = store.saveDraft('TASK-001', [ev1, ev2, ev3], 'Shift III briefing conducted. Alarms verified.');
assert(state.tasks.find((t) => t.id === 'TASK-001')!.evidenceItems.length === 3, 'draft stores 3 evidence items');

// 6. Submit → AWAITING_VERIFICATION
state = store.submitTask('TASK-001', [ev1, ev2, ev3], 'Shift III briefing conducted. Alarms verified.');
let t1 = state.tasks.find((t) => t.id === 'TASK-001')!;
assert(t1.status === 'AWAITING_VERIFICATION', 'submit → AWAITING_VERIFICATION');
assert(t1.isCriticalDoThisNext === false, 'hero flag cleared after submit');
assert(t1.submittedAt !== undefined, 'submittedAt recorded');

// 7. Submit blocked when evidence incomplete (one item still pending)
state = store.submitTask('TASK-001', [ev1, { ...ev2, status: 'pending' as const }, ev3], 'short');
t1 = state.tasks.find((t) => t.id === 'TASK-001')!;
assert(t1.status === 'AWAITING_VERIFICATION', 'incomplete submit does not regress status');
assert(t1.evidenceItems.every((ev) => ev.id !== 'ev-02' || ev.status === 'pending'), 'pending item blocks advance');

// 8. Reject evidence (verifier)
state = store.rejectEvidence('TASK-001', 'ev-02', 'Insufficient location metadata.');
t1 = state.tasks.find((t) => t.id === 'TASK-001')!;
assert(t1.status === 'REJECTED', 'reject → REJECTED');
assert(t1.rejectionReason === 'Insufficient location metadata.', 'rejection reason stored at task level');
assert(t1.evidenceItems.find((ev) => ev.id === 'ev-02')?.status === 'rejected', 'evidence item flagged rejected');
assert(t1.evidenceItems.find((ev) => ev.id === 'ev-02')?.rejectionReason === 'Insufficient location metadata.', 'evidence rejection reason stored');
assert(t1.isCriticalDoThisNext === true, 'rejected task back in DO THIS NEXT');

// 9. Correction + resubmit
const ev2b = { ...ev2, photoUrl: 'data:image/svg+xml;utf8,new', metadata: { ...ev2.metadata!, gps: '23.7958° N, 86.4305° E' } };
state = store.submitTask('TASK-001', [ev1, ev2b, ev3], 'Shift III briefing conducted. Alarms verified.');
t1 = state.tasks.find((t) => t.id === 'TASK-001')!;
assert(t1.status === 'AWAITING_VERIFICATION', 'resubmit → AWAITING_VERIFICATION');
assert(t1.rejectionReason === undefined, 'rejection reason cleared after resubmit');
assert(t1.evidenceItems.find((ev) => ev.id === 'ev-02')?.status === 'uploaded', 'corrected evidence re-uploaded');

// 10. Approve → VERIFIED + closure certificate
state = store.approveTask('TASK-001');
t1 = state.tasks.find((t) => t.id === 'TASK-001')!;
assert(t1.status === 'VERIFIED', 'approve → VERIFIED');
assert(t1.closureCertificate !== undefined, 'closure certificate generated');
const cert = t1.closureCertificate!;
assert(cert.taskId === 'TASK-001', 'certificate has taskId');
assert(cert.ownerName === 'Ram Singh' && cert.verifierName === 'R. Sharma', 'certificate locks both identities');
assert(cert.evidenceCount === 3 && cert.evidenceHashes.length === 3, `certificate has 3 evidence hashes (got ${cert.evidenceHashes.length})`);
assert(cert.hash.startsWith('0x'), 'certificate hash present');
assert(t1.evidenceItems.every((ev) => ev.status === 'verified'), 'all evidence verified after closure');

// 11. Dashboard counters reflect closure
const closed = state.tasks.filter((t) => t.status === 'VERIFIED').length;
const awaiting = state.tasks.filter((t) => t.status === 'AWAITING_VERIFICATION').length;
assert(closed === 6, `closed count 6 (got ${closed})`);
assert(awaiting === 1, `awaiting count 1 (got ${awaiting})`);

// 12. Determinism: reset and replay gives identical task states
state = store.reset();
assert(state.pipeline.alerts.every((p) => p.alert.status === 'received'), 'reset returns all alerts to fresh state');
assert(state.pipeline.alerts.every((p) => p.extraction === null && p.fanout === null), 'reset clears all pipelines');
assert(!state.tasks.some((t) => t.id === 'TASK-001'), 'reset removes generated tasks');
assert(state.tasks.length === 11, 'reset restores 11 seed tasks');
assert(
  !state.tasks.some((t) =>
    ['TASK-001', 'TASK-101', 'TASK-102', 'TASK-PPE-001', 'TASK-STRATA-001', 'TASK-STRATA-002', 'TASK-SLOPE-001', 'TASK-SLOPE-002', 'TASK-DUST-001', 'TASK-SAT-001'].includes(t.id),
  ),
  'reset removes all fan-out tasks',
);

// 13. Idempotency of confirm (second call returns no duplicate tasks)
state = store.processAlert();
const firstConfirm = store.confirmExtraction();
assert(firstConfirm.createdTasks.length === 3, 'fresh confirm after reset creates tasks again');
const secondConfirm = store.confirmExtraction();
assert(secondConfirm.createdTasks.length === 0, 'confirm is idempotent (no duplicate tasks)');
assert(secondConfirm.state.tasks.length === 14, 'no duplicate tasks after second confirm');

console.log('\nALL STORE TESTS PASSED ✔');