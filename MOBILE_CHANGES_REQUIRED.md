# MOBILE_CHANGES_REQUIRED.md

**Status:** The mobile UI was intentionally **NOT changed** during the demo-integration task.
The mobile app was only re-wired at the state layer (`mobile/src/App.tsx` now consumes the shared
demo state via `mobile/src/services/demoApi.ts`; component markup, styles, navigation and layout
are byte-for-byte identical).

The workflow functions end-to-end without any of the changes below. These are optional
polish items that would make the mobile demo read more clearly, in priority order.

---

### 1. Dedicated “ACTION REQUIRED / REJECTED” section in the Work Queue (M1)

- **What:** After a desktop rejection, the task shows up under the existing “Due Soon” bucket.
  A distinct red-tinted “Action Required” bucket (and count) would make the return-to-owner moment
  impossible to miss.
- **Why:** The rejection scene carries most of the demo’s differentiation; on the phone it should be
  visually louder than a regular due-soon card.
- **Which screen:** `mobile/src/components/M1Queue.tsx` (bucket logic around lines 210–260).
- **How:** Add a bucket for `status === 'REJECTED'` above “Overdue”, with a red header
  (“Action Required · rejection reason”), and exclude REJECTED tasks from the Due Soon bucket.

### 2. Show the rejection reason directly on the flagged evidence card in Evidence Capture (M2)

- **What:** Today the rejection reason is visible on the Task Detail sheet (task-level alert) but
  not next to the specific rejected evidence item while Ram is working in M2.
- **Why:** When Ram re-captures, it helps to see *which* item was rejected and *why* without
  navigating away. The shared state already carries the reason per item (`rejectionReason` on the
  evidence item — currently only surfaced in the sheet).
- **Which screen:** `mobile/src/components/M2EvidenceCapture.tsx` (evidence card render).
- **How:** When `item.status === 'rejected'`, render a small red/amber note above the capture button
  with the item-level rejection reason (data already available via the demo API).

### 3. Surface the owner-label “≠ you” note on the task card / queue

- **What:** The detail sheet says “Review Officer: … — ≠ owner”; the queue card does not.
- **Why:** Reinforces structural accountability at a glance during the handoff moment.
- **Which screen:** `mobile/src/components/TaskCard.tsx`.
- **How:** Add a subtle “≠ you” verifier chip on AWAITING_VERIFICATION cards.

### 4. Brief “Submitting evidence…” state after confirm-submit

- **What:** Submit currently transitions instantly (optimistic) with the server call in the
  background.
- **Why:** A 400–600 ms deterministic “Uploading evidence & sealing SHA-256…” state would mirror the
  upload realism of the camera modal.
- **Which screen:** `mobile/src/App.tsx` / `M2EvidenceCapture.tsx` submit path.
- **How:** Keep the optimistic UI, but have `handleUpdateTask` flip a transient submitting flag while
  the `/submit` round-trip resolves (visual only — no new data needed).

### 5. Field observations (M3) exist only on the device

- **What:** Observations created in M3 are stored locally on the phone and merged on top of server
  state, so they survive polling but are not visible on the desktop.
- **Why:** Acceptable — observations are not part of the hero story — but a later backend would
  treat them as governance objects.
- **Which screen:** `mobile/src/App.tsx` (`handleCreateObservationTask` / `localOnlyTasks`).
- **How:** When a real backend exists, POST the observation to the same governance-object endpoint.

### 6. TASK-001 evidence starts “pending” (intentionally)

- **What:** The original mock pre-uploaded the session photo so the hero card was not empty.
  In the connected demo the hero task is generated at fan-out with all three evidence items pending,
  so Ram captures all three live on camera.
- **Why:** This was a data change (in `shared/data/aiExtraction.json` task template), not a UI
  change, and is the intended demo behaviour — **no action required**, recorded here for clarity.
