// Verification script for the demo store state machine (five-mine model).
// Run: cd client && node_modules/.bin/tsx ../shared/demo/store.test.ts
import { createDemoStore, loadSeed, MOBILE_MINE_ID, MOBILE_USER_ID } from './store';

const store = createDemoStore(loadSeed());
let state = store.getState();
const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
  console.log('ok  :', msg);
};

// 1. Fresh state: five mines, PROPOSED hero, inbox of compliance documents
assert(state.sites.length === 5, `five mines seeded (got ${state.sites.length})`);
assert(state.sites[0].name === 'Piparwar OCP', 'MINE-001 is Piparwar OCP');
assert(state.pipeline.documents.length === 5, `inbox has 5 compliance documents (got ${state.pipeline.documents.length})`);
assert(state.pipeline.documents.every((p) => p.alert.status === 'received'), 'all documents start received');
assert(state.pipeline.documents.every((p) => p.extraction === null), 'no extraction before processing');
assert(state.rules.length === 6, `rule registry has 6 rules (got ${state.rules.length})`);

const hero = () => state.tasks.find((t) => t.id === 'TASK-SLOPE-WK-2026-W36')!;
assert(!!hero(), 'hero task TASK-SLOPE-WK-2026-W36 seeded');
assert(hero().status === 'PROPOSED', 'hero task starts PROPOSED');
assert(hero().owner.id === 'u-ram' && hero().mineId === 'MINE-001', 'hero owner Ram Singh @ MINE-001');
assert(hero().verifier.id !== hero().owner.id, 'owner ≠ verifier structurally');
assert(state.tasks.filter((t) => t.status === 'PROPOSED').length === 5, `5 PROPOSED seed tasks (got ${state.tasks.filter((t) => t.status === 'PROPOSED').length})`);

// 2. Mobile scoping: PROPOSED invisible, only Ram Singh's MINE-001 tasks
let mobile = store.getMobileState();
assert(mobile.mine?.id === MOBILE_MINE_ID, 'mobile scoped to MINE-001');
assert(!mobile.tasks.some((t) => t.id === 'TASK-SLOPE-WK-2026-W36'), 'PROPOSED hero invisible on mobile before publish');
assert(mobile.tasks.every((t) => t.owner.id === MOBILE_USER_ID), 'mobile tasks owned by Ram Singh only');

// 3. Process the circular (AI extraction — advisory)
state = store.processDocument('DGMS/2026/TC-27');
const circ = state.pipeline.documents.find((p) => p.alert.ref === 'DGMS/2026/TC-27')!;
assert(circ.alert.status === 'processed', 'circular processed after AI pipeline');
assert(circ.extraction !== null, 'extraction present after processing');
assert(circ.recurrence !== null, 'organizational memory present after processing');

// 4. Deterministic applicability (rules — not AI)
state = store.determineApplicability('DGMS/2026/TC-27');
const circ2 = state.pipeline.documents.find((p) => p.alert.ref === 'DGMS/2026/TC-27')!;
const applicability = circ2.applicability as { applicableMineIds: string[]; filteredOut: Array<{ mineId: string }> };
assert(!!applicability, 'applicability determined');
assert(
  JSON.stringify(applicability.applicableMineIds) === JSON.stringify(['MINE-001', 'MINE-002', 'MINE-003']),
  'slope rule applies to MINE-001/002/003',
);
assert(applicability.filteredOut.some((f) => f.mineId === 'MINE-004'), 'MINE-004 (UG) correctly filtered out');

// 5. Manager publishes the hero → mobile sees it
state = store.publishTask('TASK-SLOPE-WK-2026-W36');
assert(hero().status === 'ASSIGNED', 'publish → ASSIGNED');
mobile = store.getMobileState();
assert(mobile.tasks.some((t) => t.id === 'TASK-SLOPE-WK-2026-W36'), 'published hero appears on mobile');

// 6. Mobile starts it
state = store.startTask('TASK-SLOPE-WK-2026-W36');
assert(hero().status === 'IN_PROGRESS', 'start → IN_PROGRESS');

// 7. Draft evidence (mobile captures)
const ev1 = { ...hero().evidenceItems[0], status: 'uploaded' as const, photoUrl: 'data:image/svg+xml;utf8,abc', metadata: { timestamp: '07:40 IST', gps: '23.6952° N, 85.0598° E', user: 'R. Singh (MSO-402)', sha256: 'sha-1' } };
const ev2 = { ...hero().evidenceItems[1], status: 'uploaded' as const, photoUrl: 'data:image/svg+xml;utf8,def', metadata: { timestamp: '07:48 IST', gps: '23.6952° N, 85.0598° E', user: 'R. Singh (MSO-402)', sha256: 'sha-2' } };
state = store.saveDraft('TASK-SLOPE-WK-2026-W36', [ev1, ev2], 'Bench 3B readings captured.', { reading: '1.9', withinLimit: 'YES' });
assert(state.tasks.find((t) => t.id === 'TASK-SLOPE-WK-2026-W36')!.status === 'IN_PROGRESS', 'draft does not change status');

// 8. Submit blocked when required evidence incomplete (optional item absent is OK)
state = store.submitTask('TASK-SLOPE-WK-2026-W36', [{ ...ev1, status: 'pending' as const }, ev2], 'Bench 3B readings captured.');
assert(state.tasks.find((t) => t.id === 'TASK-SLOPE-WK-2026-W36')!.status === 'IN_PROGRESS', 'incomplete submit does not advance');

// 9. Full submit → AWAITING_VERIFICATION
state = store.submitTask('TASK-SLOPE-WK-2026-W36', [ev1, ev2], 'EX-07 read 1.9 mm/24h. Crest intact, no new cracks.', { reading: '1.9', withinLimit: 'YES', observations: 'Crest intact.' });
let h = hero();
assert(h.status === 'AWAITING_VERIFICATION', 'submit → AWAITING_VERIFICATION');
assert(h.submissionCount === 1, 'submission count recorded');

// 10. Reject evidence (regulatory official, hero reason)
state = store.rejectEvidence('TASK-SLOPE-WK-2026-W36', 'ev-slope-crest', 'Crest photo timestamp inconsistent with the recorded visit window and berm markers are not clearly visible — re-capture at the bench crest showing the berm and crack gauge.');
h = hero();
assert(h.status === 'REJECTED', 'reject → REJECTED');
assert(h.rejectionReason && h.rejectionReason.startsWith('Crest photo timestamp'), 'rejection reason stored at task level');
assert(h.evidenceItems.find((ev) => ev.id === 'ev-slope-crest')?.status === 'rejected', 'evidence item flagged rejected');
assert(h.isCriticalDoThisNext === true, 'rejected task flagged for correction');
mobile = store.getMobileState();
assert(mobile.tasks.find((t) => t.id === 'TASK-SLOPE-WK-2026-W36')?.status === 'REJECTED', 'mobile sees REJECTED (ACTION REQUIRED)');

// 11. Correction + resubmit
const ev2b = { ...ev2, photoUrl: 'data:image/svg+xml;utf8,new', metadata: { ...ev2.metadata!, sha256: 'sha-2b' } };
state = store.resubmitTask('TASK-SLOPE-WK-2026-W36', [ev1, ev2b], 'Re-captured crest photo with berm markers and crack gauge visible.', { reading: '1.9', withinLimit: 'YES', observations: 'Crest intact.' });
h = hero();
assert(h.status === 'AWAITING_VERIFICATION', 'resubmit → AWAITING_VERIFICATION');
assert(h.rejectionReason === undefined, 'rejection reason cleared after resubmit');
assert(h.submissionCount === 2, 'submission count incremented');

// 12. Approve → VERIFIED + closure record
state = store.approveTask('TASK-SLOPE-WK-2026-W36');
h = hero();
assert(h.status === 'VERIFIED', 'approve → VERIFIED');
assert(h.closureCertificate !== undefined, 'closure record generated');
const cert = h.closureCertificate!;
assert(cert.ownerName === 'Ram Singh' && cert.verifierName === 'R. Sharma', 'closure record locks both identities');
assert(cert.evidenceCount === 2, `closure record has evidence hashes (got ${cert.evidenceCount})`);
assert(h.evidenceItems.every((ev) => ev.status === 'verified'), 'all evidence verified after closure');
mobile = store.getMobileState();
assert(mobile.tasks.find((t) => t.id === 'TASK-SLOPE-WK-2026-W36')?.status === 'VERIFIED', 'mobile sees VERIFIED');

// 13. Scheduler: recurring next instance generated once all instances of a rule are VERIFIED
state = store.publishTask('TASK-SLOPE-WK-2026-W36-M002');
state = store.startTask('TASK-SLOPE-WK-2026-W36-M002');
const m2evs = state.tasks.find((t) => t.id === 'TASK-SLOPE-WK-2026-W36-M002')!.evidenceItems.map((ev) => ({ ...ev, status: 'uploaded' as const }));
state = store.submitTask('TASK-SLOPE-WK-2026-W36-M002', m2evs, 'Ashoka high-wall weekly readings captured and logged.');
state = store.approveTask('TASK-SLOPE-WK-2026-W36-M002');
const tick = store.schedulerTick();
assert(tick.created.length >= 1, `scheduler generated next weekly instance(s) (got ${tick.created.length})`);
assert(tick.created.every((t) => t.status === 'PROPOSED'), 'recurring instances start PROPOSED');
const tick2 = store.schedulerTick();
assert(tick2.created.length === 0, 'scheduler is idempotent within the period');

// 14. Idempotent publish
const pub2 = store.publishTask('TASK-SLOPE-WK-2026-W36');
assert(!pub2.tasks.some((t) => t.id === 'TASK-SLOPE-WK-2026-W36' && t.status === 'ASSIGNED' && t.publishedAt === undefined), 'publish is idempotent (no state regression)');

// 15. Reset: deterministic demo start state
state = store.reset();
assert(state.pipeline.documents.every((p) => p.alert.status === 'received'), 'reset returns all documents to fresh state');
assert(state.pipeline.documents.every((p) => p.extraction === null && p.applicability === null), 'reset clears all pipelines');
assert(state.tasks.filter((t) => t.status === 'PROPOSED').length === 5, 'reset restores 5 PROPOSED tasks');
assert(!state.tasks.some((t) => t.status === 'VERIFIED' && t.id === 'TASK-SLOPE-WK-2026-W36'), 'reset clears hero progress');
mobile = store.getMobileState();
assert(mobile.tasks.length === 0 || mobile.tasks.every((t) => t.status !== 'PROPOSED'), 'reset: mobile shows no PROPOSED tasks');

console.log('\nALL STORE TESTS PASSED ✔');
